import type { DeliveryType, OrderStatus } from "@/types"
import type { CreateOrderInput } from "@/lib/validations/orders"

import { createClient } from "./server"

type SupabaseError = {
  message: string
  code?: string
}

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type CartRow = {
  id: string
}

type ProductJoin = {
  id: string
  name: string
  is_active: boolean
  deleted_at: string | null
}

type VariantJoin = {
  id: string
  product_id: string
  variant_name: string
  price: number | string
  stock: number | string
  is_active: boolean
}

type CartItemJoinRow = {
  id: string
  cart_id: string
  product_id: string
  variant_id: string
  quantity: number
  products: ProductJoin | ProductJoin[] | null
  product_variants: VariantJoin | VariantJoin[] | null
}

export type OrderDraftItem = {
  product_id: string
  product_name: string
  variant_id: string
  variant_name: string
  quantity: number
  unit_price: number
}

export type OrderDraft = {
  cart_id: string
  delivery_type: DeliveryType
  items: OrderDraftItem[]
  subtotal: number
  shipping_cost: number
  total: number
}

export type CreateOrderResult = {
  order_id: string
  total: number
}

const DEFAULT_SHIPPING_COST = 0

function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function outOfStockError(): Result<never> {
  return {
    data: null,
    error: {
      message: "Uno o mas productos de tu carrito ya no estan disponibles",
      code: "OUT_OF_STOCK",
    },
  }
}

function cartEmptyError(): Result<never> {
  return {
    data: null,
    error: {
      message: "Tu carrito esta vacio",
      code: "CART_EMPTY",
    },
  }
}

async function getActiveCartRow(
  supabase: SupabaseClient,
  userId: string
): Promise<Result<CartRow>> {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    }
  }

  if (!data) {
    return cartEmptyError()
  }

  return { data: data as CartRow, error: null }
}

async function getOrderDraftWithClient(
  supabase: SupabaseClient,
  userId: string,
  deliveryType: DeliveryType
): Promise<Result<OrderDraft>> {
  const cartResult = await getActiveCartRow(supabase, userId)
  if (!cartResult.data) {
    return cartResult
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      products (
        id,
        name,
        is_active,
        deleted_at
      ),
      product_variants (
        id,
        product_id,
        variant_name,
        price,
        stock,
        is_active
      )
    `
    )
    .eq("cart_id", cartResult.data.id)
    .order("created_at", { ascending: true })

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    }
  }

  const rawItems = ((data ?? []) as CartItemJoinRow[]).filter(
    (row) => Number(row.quantity) > 0
  )

  if (rawItems.length === 0) {
    return cartEmptyError()
  }

  const items: OrderDraftItem[] = []

  for (const row of rawItems) {
    const product = unwrapJoin(row.products)
    const variant = unwrapJoin(row.product_variants)

    if (!product || !variant) {
      return outOfStockError()
    }

    const quantity = Number(row.quantity)
    const stock = Number(variant.stock)
    const unitPrice = Number(variant.price)

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(stock) ||
      !Number.isFinite(unitPrice) ||
      quantity <= 0 ||
      unitPrice < 0 ||
      !product.is_active ||
      product.deleted_at !== null ||
      !variant.is_active ||
      variant.product_id !== product.id ||
      variant.product_id !== row.product_id ||
      variant.id !== row.variant_id ||
      quantity > stock
    ) {
      return outOfStockError()
    }

    items.push({
      product_id: row.product_id,
      product_name: product.name,
      variant_id: row.variant_id,
      variant_name: variant.variant_name,
      quantity,
      unit_price: unitPrice,
    })
  }

  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.unit_price,
    0
  )
  const shipping_cost = DEFAULT_SHIPPING_COST
  const total = subtotal + shipping_cost

  return {
    data: {
      cart_id: cartResult.data.id,
      delivery_type: deliveryType,
      items,
      subtotal,
      shipping_cost,
      total,
    },
    error: null,
  }
}

export async function getOrderDraftFromActiveCart(
  userId: string,
  deliveryType: DeliveryType
): Promise<Result<OrderDraft>> {
  const supabase = await createClient()
  return getOrderDraftWithClient(supabase, userId, deliveryType)
}

export async function createOrderFromActiveCart(
  userId: string,
  input: CreateOrderInput
): Promise<Result<CreateOrderResult>> {
  const supabase = await createClient()
  const draftResult = await getOrderDraftWithClient(
    supabase,
    userId,
    input.delivery_type
  )

  if (!draftResult.data) {
    return draftResult
  }

  const shippingAddress =
    input.delivery_type === "shipping" ? input.shipping_address ?? null : null
  const shippingState =
    input.delivery_type === "shipping" ? input.shipping_state ?? null : null
  const shippingCity =
    input.delivery_type === "shipping" ? input.shipping_city ?? null : null

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total: draftResult.data.total,
      delivery_type: input.delivery_type,
      shipping_address: shippingAddress,
      shipping_state: shippingState,
      shipping_city: shippingCity,
      shipping_cost: draftResult.data.shipping_cost,
    })
    .select("id, total")
    .single()

  if (orderError || !order) {
    return {
      data: null,
      error: {
        message: orderError?.message ?? "No se pudo crear la orden",
        code: orderError?.code ?? "ORDER_CREATE_FAILED",
      },
    }
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    draftResult.data.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    const { error: rollbackError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id)

    return {
      data: null,
      error: {
        message: rollbackError
          ? "No se pudo completar la orden y no fue posible revertir el registro base"
          : "No se pudieron guardar los productos de la orden",
        code: itemsError.code ?? "ORDER_ITEMS_CREATE_FAILED",
      },
    }
  }

  return {
    data: {
      order_id: order.id as string,
      total: Number(order.total),
    },
    error: null,
  }
}

// ─── Tipos para las páginas de orden y el endpoint de pagos ──────────────────

export type OrderItemForDisplay = {
  id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_name: string
  quantity: number
  unit_price: number
}

export type OrderForDisplay = {
  id: string
  status: OrderStatus
  total: number
  delivery_type: DeliveryType
  shipping_address: string | null
  shipping_state: string | null
  shipping_city: string | null
  shipping_cost: number
  created_at: string
  items: OrderItemForDisplay[]
}

export type OrderForPayment = {
  id: string
  status: string
  total: number
  items: OrderDraftItem[]
}

type RawOrderItemJoin = {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  products: { id: string; name: string } | { id: string; name: string }[] | null
  product_variants:
    | { id: string; variant_name: string }
    | { id: string; variant_name: string }[]
    | null
}

function unwrapOrderItemJoins(rows: RawOrderItemJoin[]): OrderItemForDisplay[] {
  return rows.map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const variant = Array.isArray(row.product_variants)
      ? row.product_variants[0]
      : row.product_variants
    return {
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      product_name: product?.name ?? "Producto",
      variant_name: variant?.variant_name ?? "",
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
    }
  })
}

/**
 * Obtiene una orden con sus items para mostrar en la página /orden/[id].
 * Verifica que la orden pertenezca al usuario autenticado.
 */
export async function getOrderWithItemsForUser(
  orderId: string,
  userId: string
): Promise<Result<OrderForDisplay>> {
  const supabase = await createClient()

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, total, delivery_type, shipping_address, shipping_state, shipping_city, shipping_cost, created_at"
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle()

  if (orderError) {
    return {
      data: null,
      error: { message: orderError.message, code: orderError.code },
    }
  }

  if (!order) {
    return {
      data: null,
      error: { message: "Orden no encontrada", code: "NOT_FOUND" },
    }
  }

  const { data: rawItems, error: itemsError } = await supabase
    .from("order_items")
    .select(
      `id, product_id, variant_id, quantity, unit_price,
       products ( id, name ),
       product_variants ( id, variant_name )`
    )
    .eq("order_id", orderId)

  if (itemsError) {
    return {
      data: null,
      error: { message: itemsError.message, code: itemsError.code },
    }
  }

  const items = unwrapOrderItemJoins(
    (rawItems ?? []) as unknown as RawOrderItemJoin[]
  )

  return {
    data: {
      id: order.id as string,
      status: order.status as OrderStatus,
      total: Number(order.total),
      delivery_type: order.delivery_type as DeliveryType,
      shipping_address: (order.shipping_address as string | null) ?? null,
      shipping_state: (order.shipping_state as string | null) ?? null,
      shipping_city: (order.shipping_city as string | null) ?? null,
      shipping_cost: Number(order.shipping_cost),
      created_at: order.created_at as string,
      items,
    },
    error: null,
  }
}

/**
 * Obtiene una orden con sus items para construir la preferencia de MercadoPago.
 * Verifica que la orden pertenezca al usuario y esté en estado 'pending'.
 */
export async function getOrderForPayment(
  orderId: string,
  userId: string
): Promise<Result<OrderForPayment>> {
  const supabase = await createClient()

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle()

  if (orderError) {
    return {
      data: null,
      error: { message: orderError.message, code: orderError.code },
    }
  }

  if (!order) {
    return {
      data: null,
      error: { message: "Orden no encontrada o no pertenece al usuario", code: "NOT_FOUND" },
    }
  }

  if (order.status !== "pending") {
    return {
      data: null,
      error: {
        message: "La orden ya no está en estado pendiente",
        code: "VALIDATION_ERROR",
      },
    }
  }

  const { data: rawItems, error: itemsError } = await supabase
    .from("order_items")
    .select(
      `product_id, variant_id, quantity, unit_price,
       products ( id, name ),
       product_variants ( id, variant_name )`
    )
    .eq("order_id", orderId)

  if (itemsError) {
    return {
      data: null,
      error: { message: itemsError.message, code: itemsError.code },
    }
  }

  const items: OrderDraftItem[] = (
    (rawItems ?? []) as unknown as RawOrderItemJoin[]
  ).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const variant = Array.isArray(row.product_variants)
      ? row.product_variants[0]
      : row.product_variants
    return {
      product_id: row.product_id,
      product_name: product?.name ?? "Producto",
      variant_id: row.variant_id,
      variant_name: variant?.variant_name ?? "",
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
    }
  })

  return {
    data: {
      id: order.id as string,
      status: order.status as string,
      total: Number(order.total),
      items,
    },
    error: null,
  }
}
