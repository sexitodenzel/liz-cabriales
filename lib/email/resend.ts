import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

import {
  buildOrderConfirmationHtml,
  type OrderConfirmationData,
} from "./templates/order-confirmation"

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Tipos para los datos crudos del join de Supabase ────────────────────────

type RawUser = {
  first_name: string
  last_name: string
  email: string
}

type RawOrderItem = {
  quantity: number | string
  unit_price: number | string
  products: { name: string } | { name: string }[] | null
  product_variants: { variant_name: string } | { variant_name: string }[] | null
}

type RawOrderRow = {
  id: string
  total: number | string
  delivery_type: string
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  status: string
  users: RawUser | RawUser[] | null
  order_items: RawOrderItem[] | null
}

type EmailPayload = {
  templateData: OrderConfirmationData
  recipientEmail: string
  recipientName: string
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

// ─── Query único — trae todo lo necesario para el email ──────────────────────

async function buildEmailPayload(
  orderId: string
): Promise<EmailPayload | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `id,
       total,
       delivery_type,
       shipping_address,
       shipping_city,
       shipping_state,
       status,
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

  if (error || !data) {
    console.error(
      `[email] Error obteniendo datos de la orden ${orderId}:`,
      error
    )
    return null
  }

  const raw = data as unknown as RawOrderRow
  const user = unwrap(raw.users)

  if (!user?.email) {
    console.error(
      `[email] Orden ${orderId} sin usuario o sin email asociado`
    )
    return null
  }

  const items = (raw.order_items ?? []).map((item) => {
    const product = unwrap(item.products)
    const variant = unwrap(item.product_variants)
    return {
      productName: product?.name ?? "Producto",
      variantName: variant?.variant_name ?? "",
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }
  })

  const templateData: OrderConfirmationData = {
    customerFirstName: user.first_name,
    customerLastName: user.last_name,
    orderShortId: raw.id.slice(0, 8).toUpperCase(),
    items,
    total: Number(raw.total),
    deliveryType: raw.delivery_type as "shipping" | "pickup",
    shippingAddress: raw.shipping_address,
    shippingCity: raw.shipping_city,
    shippingState: raw.shipping_state,
  }

  return {
    templateData,
    recipientEmail: user.email,
    recipientName: `${user.first_name} ${user.last_name}`,
  }
}

// ─── Función pública ──────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<void> {
  const payload = await buildEmailPayload(orderId)

  if (!payload) {
    throw new Error(
      `[email] No se pudieron obtener los datos para el email de la orden ${orderId}`
    )
  }

  const { templateData, recipientEmail, recipientName } = payload
  const html = buildOrderConfirmationHtml(templateData)
  const subject = `Tu pedido #${templateData.orderShortId} fue confirmado — Liz Cabriales`

  const { error } = await resend.emails.send({
    from: "Liz Cabriales <onboarding@resend.dev>",
    to: [`${recipientName} <${recipientEmail}>`],
    subject,
    html,
  })

  if (error) {
    throw new Error(
      `[email] Resend retornó error para la orden ${orderId}: ${JSON.stringify(error)}`
    )
  }
}
