import type { CartItem } from "../cart"

import { createClient as createServerClient } from "./server"

type SupabaseError = {
  message: string
  code?: string
}

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

type CartRow = {
  id: string
  user_id: string
}

type ExistingCartItemRow = {
  id: string
  product_id: string
  variant_id: string
  quantity: number
}

type ProductJoin = {
  id: string
  name: string
  brand: string | null
  images: string[] | null
}

type VariantJoin = {
  id: string
  product_id: string
  variant_name: string
  price: number | string
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

export type CartItemRow = CartItem & {
  id: string
  cartId: string
  variantName: string | null
}

export type CartSnapshot = {
  cart_id: string
  items: CartItemRow[]
  total: number
}

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function toCartItemRow(row: CartItemJoinRow): CartItemRow {
  const product = unwrapJoin(row.products)
  const variant = unwrapJoin(row.product_variants)
  const quantity = Number(row.quantity)
  const price = Number(variant?.price ?? 0)

  return {
    id: row.id,
    cartId: row.cart_id,
    productId: row.product_id,
    variantId: row.variant_id,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    name: product?.name ?? "Producto no disponible",
    brand: product?.brand ?? null,
    image: product?.images?.[0] ?? null,
    variantName: variant?.variant_name ?? null,
  }
}

function toCartSnapshot(cartId: string, items: CartItemRow[]): CartSnapshot {
  return {
    cart_id: cartId,
    items,
    total: items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    ),
  }
}

async function getExistingCartItems(
  cartId: string
): Promise<Result<ExistingCartItemRow[]>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, product_id, variant_id, quantity")
    .eq("cart_id", cartId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return {
    data: (data ?? []) as ExistingCartItemRow[],
    error: null,
  }
}

async function updateCartItemAmount(
  cartItemId: string,
  quantity: number
): Promise<Result<null>> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

function aggregateGuestItems(items: CartItem[]): CartItem[] {
  const byVariant = new Map<string, CartItem>()

  for (const item of items) {
    if (item.quantity <= 0) continue

    const existing = byVariant.get(item.variantId)
    if (existing) {
      byVariant.set(item.variantId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      })
      continue
    }

    byVariant.set(item.variantId, { ...item })
  }

  return Array.from(byVariant.values())
}

export async function getOrCreateCart(
  userId: string
): Promise<Result<CartRow>> {
  const supabase = await createServerClient()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_SECONDS * 1000)

  const { data: existing, error: fetchError } = await supabase
    .from("carts")
    .select("id, user_id, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError && fetchError.code !== "PGRST116") {
    return {
      data: null,
      error: { message: fetchError.message, code: fetchError.code },
    }
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("carts")
      .update({ expires_at: expiresAt.toISOString() })
      .eq("id", existing.id)
      .select("id, user_id")
      .single()

    if (updateError || !updated) {
      return {
        data: null,
        error: {
          message: updateError?.message ?? "No se pudo actualizar el carrito",
          code: updateError?.code,
        },
      }
    }

    return { data: updated as CartRow, error: null }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("carts")
    .insert({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, user_id")
    .single()

  if (insertError || !inserted) {
    return {
      data: null,
      error: {
        message: insertError?.message ?? "No se pudo crear el carrito",
        code: insertError?.code,
      },
    }
  }

  return { data: inserted as CartRow, error: null }
}

export async function getCartItems(
  cartId: string
): Promise<Result<CartItemRow[]>> {
  const supabase = await createServerClient()

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
        brand,
        images
      ),
      product_variants (
        id,
        product_id,
        variant_name,
        price
      )
    `
    )
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const items = ((data ?? []) as CartItemJoinRow[])
    .map(toCartItemRow)
    .filter((item) => item.quantity > 0)

  return { data: items, error: null }
}

export async function getActiveCartSnapshot(
  userId: string
): Promise<Result<CartSnapshot>> {
  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return { data: null, error: cartResult.error }
  }

  const itemsResult = await getCartItems(cartResult.data.id)
  if (!itemsResult.data) {
    return { data: null, error: itemsResult.error }
  }

  return {
    data: toCartSnapshot(cartResult.data.id, itemsResult.data),
    error: null,
  }
}

export async function addCartItem(
  cartId: string,
  item: CartItem
): Promise<Result<null>> {
  const existingResult = await getExistingCartItems(cartId)
  if (!existingResult.data) {
    return { data: null, error: existingResult.error }
  }

  const existing = existingResult.data.find(
    (row) => row.variant_id === item.variantId
  )

  if (existing) {
    return updateCartItemAmount(
      existing.id,
      existing.quantity + item.quantity
    )
  }

  const supabase = await createServerClient()
  const { error } = await supabase.from("cart_items").insert({
    cart_id: cartId,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
  })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<Result<null>> {
  return updateCartItemAmount(cartItemId, quantity)
}

export async function removeCartItem(
  cartItemId: string
): Promise<Result<null>> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function clearCartItems(cartId: string): Promise<Result<null>> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function mergeGuestCart(
  userId: string,
  guestItems: CartItem[]
): Promise<Result<null>> {
  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return { data: null, error: cartResult.error }
  }

  const normalizedItems = aggregateGuestItems(guestItems)
  if (normalizedItems.length === 0) {
    return { data: null, error: null }
  }

  const existingResult = await getExistingCartItems(cartResult.data.id)
  if (!existingResult.data) {
    return { data: null, error: existingResult.error }
  }

  const existingByVariant = new Map<string, ExistingCartItemRow>()
  for (const row of existingResult.data) {
    existingByVariant.set(row.variant_id, row)
  }

  const inserts: Array<{
    cart_id: string
    product_id: string
    variant_id: string
    quantity: number
  }> = []

  for (const item of normalizedItems) {
    const existing = existingByVariant.get(item.variantId)

    if (existing) {
      const updateResult = await updateCartItemAmount(
        existing.id,
        existing.quantity + item.quantity
      )

      if (updateResult.error) {
        return updateResult
      }

      continue
    }

    inserts.push({
      cart_id: cartResult.data.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
    })
  }

  if (inserts.length === 0) {
    return { data: null, error: null }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.from("cart_items").insert(inserts)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}
