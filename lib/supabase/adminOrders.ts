import { createClient } from "@supabase/supabase-js"

import type { DeliveryType, OrderStatus } from "@/types"

type SupabaseError = { message: string; code?: string }
type Result<T> = { data: T; error: null } | { data: null; error: SupabaseError }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AdminOrderSummary = {
  id: string
  status: OrderStatus
  total: number
  delivery_type: DeliveryType
  created_at: string
  client_email: string | null
}

export type AdminOrderItemRow = {
  product_name: string
  variant_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type AdminOrderDetail = {
  id: string
  status: OrderStatus
  total: number
  delivery_type: DeliveryType
  shipping_address: string | null
  shipping_state: string | null
  shipping_city: string | null
  shipping_cost: number
  created_at: string
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
  items: AdminOrderItemRow[]
}

function unwrapUserEmail(users: unknown): string | null {
  const u = Array.isArray(users) ? users[0] : users
  if (u && typeof u === "object" && "email" in u) {
    return String((u as { email: string }).email)
  }
  return null
}

function unwrapUserNames(users: unknown): {
  first: string | null
  last: string | null
} {
  const u = Array.isArray(users) ? users[0] : users
  if (u && typeof u === "object") {
    const o = u as { first_name?: string; last_name?: string }
    return {
      first: o.first_name ?? null,
      last: o.last_name ?? null,
    }
  }
  return { first: null, last: null }
}

export async function getAdminOrdersPaginated(
  page: number,
  limit: number,
  statusFilter?: OrderStatus | "all"
): Promise<Result<{ orders: AdminOrderSummary[]; total: number }>> {
  const from = Math.max(0, (page - 1) * limit)
  const to = from + limit - 1

  let query = supabaseAdmin
    .from("orders")
    .select(
      `id,
       status,
       total,
       delivery_type,
       created_at,
       users ( email )`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const orders: AdminOrderSummary[] = (data ?? []).map((row) => {
    const r = row as {
      id: string
      status: string
      total: number | string
      delivery_type: string
      created_at: string
      users: unknown
    }
    return {
      id: r.id,
      status: r.status as OrderStatus,
      total: Number(r.total),
      delivery_type: r.delivery_type as DeliveryType,
      created_at: r.created_at,
      client_email: unwrapUserEmail(r.users),
    }
  })

  return {
    data: { orders, total: count ?? 0 },
    error: null,
  }
}

type RawOrderRow = {
  id: string
  status: string
  total: number | string
  delivery_type: string
  shipping_address: string | null
  shipping_state: string | null
  shipping_city: string | null
  shipping_cost: number | string
  created_at: string
  users: unknown
  order_items: unknown
}

export async function getAdminOrderById(
  orderId: string
): Promise<Result<AdminOrderDetail>> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `id,
       status,
       total,
       delivery_type,
       shipping_address,
       shipping_state,
       shipping_city,
       shipping_cost,
       created_at,
       users ( first_name, last_name, email ),
       order_items (
         quantity,
         unit_price,
         products ( name ),
         product_variants ( variant_name )
       )`
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  if (!data) {
    return {
      data: null,
      error: { message: "Orden no encontrada", code: "NOT_FOUND" },
    }
  }

  const row = data as RawOrderRow
  const names = unwrapUserNames(row.users)
  const email = unwrapUserEmail(row.users)

  const rawItems = (row.order_items ?? []) as Array<{
    quantity: number | string
    unit_price: number | string
    products: { name: string } | { name: string }[] | null
    product_variants: { variant_name: string } | { variant_name: string }[] | null
  }>

  const items: AdminOrderItemRow[] = rawItems.map((it) => {
    const p = Array.isArray(it.products) ? it.products[0] : it.products
    const v = Array.isArray(it.product_variants)
      ? it.product_variants[0]
      : it.product_variants
    const qty = Number(it.quantity)
    const unit = Number(it.unit_price)
    return {
      product_name: p?.name ?? "Producto",
      variant_name: v?.variant_name ?? "",
      quantity: qty,
      unit_price: unit,
      subtotal: qty * unit,
    }
  })

  return {
    data: {
      id: row.id,
      status: row.status as OrderStatus,
      total: Number(row.total),
      delivery_type: row.delivery_type as DeliveryType,
      shipping_address: row.shipping_address,
      shipping_state: row.shipping_state,
      shipping_city: row.shipping_city,
      shipping_cost: Number(row.shipping_cost),
      created_at: row.created_at,
      client_first_name: names.first,
      client_last_name: names.last,
      client_email: email,
      items,
    },
    error: null,
  }
}

export async function updateAdminOrderStatusById(
  orderId: string,
  status: "shipped" | "delivered" | "cancelled"
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}
