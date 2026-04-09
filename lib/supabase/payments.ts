import { createClient } from "@supabase/supabase-js"

import type { OrderStatus, PaymentStatus } from "@/types"

type SupabaseError = { message: string; code?: string }
type Result<T> = { data: T; error: null } | { data: null; error: SupabaseError }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type CreatePaymentInput = {
  user_id: string
  order_id: string
  amount: number
  provider_ref: string
}

export type PaymentRecord = {
  id: string
  user_id: string
  order_id: string
  amount: number
  currency: string
  provider: string
  provider_ref: string
  status: PaymentStatus
  email_sent: boolean
  created_at: string
  updated_at: string
}

export type ClaimApprovedPaymentResult =
  | { claimed: true; userId: string }
  | { claimed: false }

export async function createPayment(
  input: CreatePaymentInput
): Promise<Result<PaymentRecord>> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.user_id,
      order_id: input.order_id,
      amount: input.amount,
      currency: "MXN",
      provider: "mercadopago",
      provider_ref: input.provider_ref,
      status: "pending",
    })
    .select()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo registrar el pago",
        code: error?.code,
      },
    }
  }

  return { data: data as PaymentRecord, error: null }
}

/**
 * Marca el pago como aprobado y email_sent=true solo si aún no se procesó (email_sent=false).
 * Devuelve claimed:false si otro webhook ya actualizó la fila (idempotencia).
 */
export async function claimApprovedPaymentForOrder(
  orderId: string
): Promise<Result<ClaimApprovedPaymentResult>> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "approved",
      email_sent: true,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("email_sent", false)
    .select("user_id")

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const rows = (data ?? []) as Array<{ user_id: string }>
  if (rows.length === 0) {
    return { data: { claimed: false }, error: null }
  }

  return {
    data: { claimed: true, userId: rows[0].user_id },
    error: null,
  }
}

export async function updateOrderStatusToPaid(
  orderId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
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

export async function clearCartForUser(userId: string): Promise<void> {
  const { data: cart } = await supabaseAdmin
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!cart?.id) return

  await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id)
}

export async function updatePaymentStatusByOrderId(
  orderId: string,
  paymentStatus: PaymentStatus,
  orderStatus: OrderStatus
): Promise<Result<null>> {
  const { error: paymentError } = await supabaseAdmin
    .from("payments")
    .update({
      status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)

  if (paymentError) {
    return {
      data: null,
      error: { message: paymentError.message, code: paymentError.code },
    }
  }

  const { error: orderError } = await supabaseAdmin
    .from("orders")
    .update({
      status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (orderError) {
    return {
      data: null,
      error: { message: orderError.message, code: orderError.code },
    }
  }

  return { data: null, error: null }
}

export async function deductStockForOrder(orderId: string): Promise<void> {
  const { data: items, error } = await supabaseAdmin
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId)

  if (error || !items) {
    console.error(
      `[stock-deduct] Error obteniendo items de la orden ${orderId}:`,
      error
    )
    return
  }

  for (const item of items as Array<{ variant_id: string; quantity: number }>) {
    const { data: variant, error: variantError } = await supabaseAdmin
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single()

    if (variantError || !variant) {
      console.error(
        `[stock-deduct] Variante ${item.variant_id} no encontrada`
      )
      continue
    }

    const newStock = Number((variant as { stock: number }).stock) - item.quantity

    if (newStock < 0) {
      console.warn(
        `[stock-deduct] ALERTA: stock negativo para variante ${item.variant_id}: ${newStock}`
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from("product_variants")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", item.variant_id)

    if (updateError) {
      console.error(
        `[stock-deduct] Error actualizando stock de variante ${item.variant_id}:`,
        updateError
      )
    }
  }
}
