import { createClient } from "@supabase/supabase-js"

import { sendWhatsAppTemplate } from "./whatsapp-client"
import {
  TEMPLATE_NAMES,
  TEMPLATE_LANGUAGE,
  buildAdminNewOrderComponents,
  buildOrderProductsConfirmedComponents,
  buildShippingPaymentRequestComponents,
  buildShippingPaidAdminComponents,
  buildOrderShippedComponents,
  buildOrderDeliveredComponents,
} from "./templates"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatMxn(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type OrderRow = {
  id: string
  total: number | string
  delivery_type: string
  shipping_amount_final: number | string | null
  shipping_payment_url: string | null
  carrier: string | null
  tracking_number: string | null
  users: {
    first_name: string
    last_name: string
    phone: string | null
    phone_verified: boolean
    whatsapp_opt_in: boolean
  } | Array<{
    first_name: string
    last_name: string
    phone: string | null
    phone_verified: boolean
    whatsapp_opt_in: boolean
  }> | null
}

function unwrapUser(users: OrderRow["users"]) {
  const u = Array.isArray(users) ? users[0] : users
  return u ?? null
}

async function getOrderForNotification(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `id,
       total,
       delivery_type,
       shipping_amount_final,
       shipping_payment_url,
       carrier,
       tracking_number,
       users (
         first_name,
         last_name,
         phone,
         phone_verified,
         whatsapp_opt_in
       )`
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) {
    console.error(
      `[order-notifications] Error obteniendo orden ${orderId}:`,
      error
    )
    return null
  }

  return data as unknown as OrderRow
}

/**
 * Inserta en notification_log con ON CONFLICT DO NOTHING (idempotencia).
 * Retorna true si el mensaje es nuevo (debe enviarse), false si ya fue enviado.
 */
async function claimNotification(
  orderId: string,
  templateName: string,
  recipientPhone: string
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notification_log").insert({
    entity_type: "order",
    entity_id: orderId,
    channel: "whatsapp",
    template_name: templateName,
    recipient_phone: recipientPhone,
  })

  // code 23505 = unique_violation — ya fue enviado
  if (error) {
    if (error.code === "23505") return false
    console.error(`[order-notifications] Error en notification_log:`, error)
    return false
  }

  return true
}

async function sendAndLog(
  to: string,
  templateName: string,
  components: ReturnType<typeof buildAdminNewOrderComponents>,
  orderId: string
): Promise<void> {
  const claimed = await claimNotification(orderId, templateName, to)
  if (!claimed) return

  await sendWhatsAppTemplate(to, templateName, TEMPLATE_LANGUAGE, components)
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

/** Pago de productos aprobado → WhatsApp a Liz + al cliente */
export async function sendNewOrderAlerts(orderId: string): Promise<void> {
  const order = await getOrderForNotification(orderId)
  if (!order) return

  const user = unwrapUser(order.users)
  const orderShortId = orderId.slice(0, 8).toUpperCase()
  const total = formatMxn(Number(order.total))
  const deliveryLabel = order.delivery_type === "pickup" ? "Retiro en local" : "Envío a domicilio"

  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE
  if (adminPhone) {
    const clientName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : "—"

    await sendAndLog(
      adminPhone,
      TEMPLATE_NAMES.ADMIN_NEW_ORDER,
      buildAdminNewOrderComponents(orderShortId, total, clientName, deliveryLabel),
      orderId
    )
  }

  if (user?.phone && user.phone_verified && user.whatsapp_opt_in) {
    await sendAndLog(
      user.phone,
      TEMPLATE_NAMES.ORDER_PRODUCTS_CONFIRMED,
      buildOrderProductsConfirmedComponents(user.first_name, orderShortId, total),
      orderId
    )
  }
}

/** Admin registró guía → WhatsApp al cliente con link de pago */
export async function sendShippingPaymentRequest(orderId: string): Promise<void> {
  const order = await getOrderForNotification(orderId)
  if (!order) return

  const user = unwrapUser(order.users)
  if (!user?.phone || !user.phone_verified || !user.whatsapp_opt_in) return

  const amount = order.shipping_amount_final != null
    ? formatMxn(Number(order.shipping_amount_final))
    : "—"
  const paymentUrl = order.shipping_payment_url ?? "—"
  const orderShortId = orderId.slice(0, 8).toUpperCase()

  await sendAndLog(
    user.phone,
    TEMPLATE_NAMES.SHIPPING_PAYMENT_REQUEST,
    buildShippingPaymentRequestComponents(user.first_name, amount, orderShortId, paymentUrl),
    orderId
  )
}

/** Cliente pagó el envío → WhatsApp a Liz */
export async function sendShippingPaidAlert(orderId: string): Promise<void> {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE
  if (!adminPhone) return

  const order = await getOrderForNotification(orderId)
  if (!order) return

  const user = unwrapUser(order.users)
  const clientName = user ? `${user.first_name} ${user.last_name}`.trim() : "—"
  const amount = order.shipping_amount_final != null
    ? formatMxn(Number(order.shipping_amount_final))
    : "—"
  const orderShortId = orderId.slice(0, 8).toUpperCase()

  await sendAndLog(
    adminPhone,
    TEMPLATE_NAMES.SHIPPING_PAID_ADMIN,
    buildShippingPaidAdminComponents(orderShortId, amount, clientName),
    orderId
  )
}

/** Admin marca enviado → WhatsApp al cliente con tracking */
export async function sendOrderShippedAlert(orderId: string): Promise<void> {
  const order = await getOrderForNotification(orderId)
  if (!order) return

  const user = unwrapUser(order.users)
  if (!user?.phone || !user.phone_verified || !user.whatsapp_opt_in) return

  const orderShortId = orderId.slice(0, 8).toUpperCase()
  const carrier = order.carrier ?? "tu paquetería"
  const trackingNumber = order.tracking_number ?? "—"

  await sendAndLog(
    user.phone,
    TEMPLATE_NAMES.ORDER_SHIPPED,
    buildOrderShippedComponents(user.first_name, orderShortId, carrier, trackingNumber),
    orderId
  )
}

/** Admin marca entregado → WhatsApp al cliente */
export async function sendOrderDeliveredAlert(orderId: string): Promise<void> {
  const order = await getOrderForNotification(orderId)
  if (!order) return

  const user = unwrapUser(order.users)
  if (!user?.phone || !user.phone_verified || !user.whatsapp_opt_in) return

  const orderShortId = orderId.slice(0, 8).toUpperCase()

  await sendAndLog(
    user.phone,
    TEMPLATE_NAMES.ORDER_DELIVERED,
    buildOrderDeliveredComponents(user.first_name, orderShortId),
    orderId
  )
}
