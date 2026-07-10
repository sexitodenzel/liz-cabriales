import { createClient } from "@supabase/supabase-js"

import type { DeliveryType, OrderStatus, ShippingPaymentStatus } from "@/types"

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
  shipping_amount_final: number | null
  shipping_payment_status: ShippingPaymentStatus
  shipping_payment_url: string | null
  carrier: string | null
  tracking_number: string | null
  guide_notes: string | null
  guide_created_at: string | null
  shipped_at: string | null
  created_at: string
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
  client_phone: string | null
  // Factura
  requires_invoice: boolean
  rfc: string | null
  razon_social: string | null
  invoice_email: string | null
  invoice_status: string | null
  constancia_fiscal_url: string | null
  constancia_signed_url: string | null
  ticket_photo_url: string | null
  ticket_signed_url: string | null
  invoice_issued_at: string | null
  items: AdminOrderItemRow[]
}

function unwrapUserEmail(users: unknown): string | null {
  const u = Array.isArray(users) ? users[0] : users
  if (u && typeof u === "object" && "email" in u) {
    return String((u as { email: string }).email)
  }
  return null
}

function unwrapUserPhone(users: unknown): string | null {
  const u = Array.isArray(users) ? users[0] : users
  if (u && typeof u === "object" && "phone" in u) {
    const phone = (u as { phone?: string | null }).phone
    return phone ? String(phone) : null
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
  shipping_amount_final: number | string | null
  shipping_payment_status: string
  shipping_payment_url: string | null
  carrier: string | null
  tracking_number: string | null
  guide_notes: string | null
  guide_created_at: string | null
  shipped_at: string | null
  created_at: string
  requires_invoice: boolean | null
  rfc: string | null
  razon_social: string | null
  invoice_email: string | null
  invoice_status: string | null
  constancia_fiscal_url: string | null
  ticket_photo_url: string | null
  invoice_issued_at: string | null
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
       shipping_amount_final,
       shipping_payment_status,
       shipping_payment_url,
       carrier,
       tracking_number,
       guide_notes,
       guide_created_at,
       shipped_at,
       created_at,
       requires_invoice,
       rfc,
       razon_social,
       invoice_email,
       invoice_status,
       constancia_fiscal_url,
       ticket_photo_url,
       invoice_issued_at,
       users ( first_name, last_name, email, phone ),
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
  const phone = unwrapUserPhone(row.users)

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

  // Generate signed URLs for private invoice documents (valid 1 hour)
  let constanciaSignedUrl: string | null = null
  let ticketSignedUrl: string | null = null

  if (row.constancia_fiscal_url) {
    const { data: signed } = await supabaseAdmin.storage
      .from("invoice-docs")
      .createSignedUrl(row.constancia_fiscal_url, 3600)
    constanciaSignedUrl = signed?.signedUrl ?? null
  }

  if (row.ticket_photo_url) {
    const { data: signed } = await supabaseAdmin.storage
      .from("invoice-docs")
      .createSignedUrl(row.ticket_photo_url, 3600)
    ticketSignedUrl = signed?.signedUrl ?? null
  }

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
      shipping_amount_final: row.shipping_amount_final != null ? Number(row.shipping_amount_final) : null,
      shipping_payment_status: (row.shipping_payment_status ?? "not_required") as ShippingPaymentStatus,
      shipping_payment_url: row.shipping_payment_url,
      carrier: row.carrier,
      tracking_number: row.tracking_number,
      guide_notes: row.guide_notes,
      guide_created_at: row.guide_created_at,
      shipped_at: row.shipped_at,
      created_at: row.created_at,
      client_first_name: names.first,
      client_last_name: names.last,
      client_email: email,
      client_phone: phone,
      requires_invoice: Boolean(row.requires_invoice),
      rfc: row.rfc,
      razon_social: row.razon_social,
      invoice_email: row.invoice_email,
      invoice_status: row.invoice_status,
      constancia_fiscal_url: row.constancia_fiscal_url,
      constancia_signed_url: constanciaSignedUrl,
      ticket_photo_url: row.ticket_photo_url,
      ticket_signed_url: ticketSignedUrl,
      invoice_issued_at: row.invoice_issued_at,
      items,
    },
    error: null,
  }
}

/**
 * Marca el pago de envío como pagado (idempotente via .eq shipping_payment_status=pending).
 * Retorna claimed:false si ya fue procesado.
 */
export async function claimShippingPayment(
  orderId: string
): Promise<Result<{ claimed: boolean }>> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      shipping_payment_status: "paid",
      status: "shipping_paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("shipping_payment_status", "pending")
    .select("id")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as Array<{ id: string }>
  return { data: { claimed: rows.length > 0 }, error: null }
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
