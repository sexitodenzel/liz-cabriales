import { createClient } from "@supabase/supabase-js"

import type { OrderStatus, PaymentStatus } from "@/types"

type SupabaseError = { message: string; code?: string }
type Result<T> = { data: T; error: null } | { data: null; error: SupabaseError }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Tolerancia al comparar montos: un centavo. MercadoPago redondea a dos
 * decimales igual que nosotros, así que un descuadre real siempre será mayor.
 */
const AMOUNT_TOLERANCE = 0.01

export type OrderAmountCheck = {
  /** Total que debería cobrarse hoy, según la orden en la base. */
  expected: number
  /** Lo que MercadoPago dice que se pagó de verdad. */
  paid: number
  covers: boolean
}

/**
 * Compara lo pagado en MercadoPago contra el total vigente de la orden.
 *
 * Existe porque el link de pago se genera con el total del momento: si la orden
 * cambia de precio después (p. ej. se le añade el cargo por factura CFDI), el
 * cliente todavía puede pagar el link viejo y quedarse corto. El webhook solo
 * miraba el estado `approved`, así que esa orden se marcaba pagada completa.
 */
export async function checkPaymentCoversOrder(
  orderId: string,
  paidAmount: number
): Promise<Result<OrderAmountCheck>> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: `Orden ${orderId} no encontrada`, code: "NOT_FOUND" },
    }
  }

  const expected = Math.round(Number(data.total) * 100) / 100
  const paid = Math.round(paidAmount * 100) / 100

  return {
    data: { expected, paid, covers: paid >= expected - AMOUNT_TOLERANCE },
    error: null,
  }
}

export type ShippingAmountCheck = {
  /**
   * Lo cotizado en `shipping_amount_final`. `null` si no hay cotización
   * guardada, caso en el que no hay contra qué comparar.
   */
  expected: number | null
  paid: number
  covers: boolean
}

/**
 * Igual que `checkPaymentCoversOrder` pero para el segundo cobro, el del envío.
 * Mismo riesgo: si se recotiza el envío después de mandarle el link al cliente,
 * el link viejo sigue siendo pagable y `claimShippingPayment` lo daba por bueno.
 *
 * OJO con la columna: el importe del segundo cobro es `shipping_amount_final`,
 * que es lo que escribe la cotización del panel. NO es `shipping_cost`, que en
 * este flujo vale 0 — compararlo contra esa daría por bueno cualquier importe.
 */
export async function checkPaymentCoversShipping(
  orderId: string,
  paidAmount: number
): Promise<Result<ShippingAmountCheck>> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("shipping_amount_final")
    .eq("id", orderId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: `Orden ${orderId} no encontrada`, code: "NOT_FOUND" },
    }
  }

  const paid = Math.round(paidAmount * 100) / 100
  const raw = data.shipping_amount_final

  // Sin cotización guardada no hay verdad contra la cual comparar. No debería
  // pasar (el link de envío se crea junto con la cotización), así que se deja
  // pasar y se avisa: bloquear aquí castigaría a un cliente que sí pagó por un
  // hueco de datos nuestro.
  if (raw === null || raw === undefined) {
    return { data: { expected: null, paid, covers: true }, error: null }
  }

  const expected = Math.round(Number(raw) * 100) / 100

  return {
    data: { expected, paid, covers: paid >= expected - AMOUNT_TOLERANCE },
    error: null,
  }
}

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

/**
 * Fallback de acreditación cuando no hay fila reclamable en `payments`
 * (p. ej. el INSERT falló al crear la preferencia, o el cron ya canceló la
 * orden). Hace compare-and-swap sobre el estado de la orden: solo la primera
 * llamada encuentra filas, así que dos webhooks concurrentes no duplican
 * correo ni descuento de stock.
 *
 * Solo debe llamarse cuando ya se confirmó con MercadoPago que el pago está
 * aprobado.
 */
export async function claimPendingOrderByStatusSwap(
  orderId: string
): Promise<Result<ClaimApprovedPaymentResult>> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .in("status", ["pending", "cancelled"])
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
