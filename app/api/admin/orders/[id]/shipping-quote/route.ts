import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { shippingQuoteSchema } from "@/lib/validations/shippingQuote"
import { sendShippingPaymentRequest } from "@/lib/notifications/order-notifications"
import { sendShippingPaymentRequestEmail } from "@/lib/email/templates/shipping-payment-request"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ payment_url: string }>>> {
  try {
    const { id: orderId } = await context.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED" ? 401
        : authResult.error.code === "FORBIDDEN" ? 403
        : 400
      return NextResponse.json({ data: null, error: authResult.error }, { status })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Body inválido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const parseResult = shippingQuoteSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const input = parseResult.data

    // Verificar que la orden existe, está en estado 'paid' y es de tipo 'shipping'
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status, delivery_type, user_id, users ( email, first_name, last_name )")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { data: null, error: { message: "Orden no encontrada", code: "NOT_FOUND" } },
        { status: 404 }
      )
    }

    const o = order as {
      id: string
      status: string
      delivery_type: string
      user_id: string
      users: { email: string; first_name: string; last_name: string } | Array<{ email: string; first_name: string; last_name: string }> | null
    }

    if (o.status !== "paid") {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: `La orden debe estar en estado 'paid' para registrar el envío (estado actual: ${o.status})`,
            code: "INVALID_STATUS",
          },
        },
        { status: 400 }
      )
    }

    if (o.delivery_type !== "shipping") {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Esta orden es de retiro en local y no requiere cobro de envío", code: "INVALID_DELIVERY_TYPE" },
        },
        { status: 400 }
      )
    }

    const userRow = Array.isArray(o.users) ? o.users[0] : o.users
    const payerEmail = userRow?.email ?? ""
    const payerName = userRow?.first_name ?? ""
    const payerSurname = userRow?.last_name ?? ""

    // Crear preferencia de MercadoPago para el segundo cobro
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .trim()
      .replace(/\/$/, "")
    const isLocal = /:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(appUrl)

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const preferenceClient = new Preference(mpClient)

    let preferenceResponse
    try {
      preferenceResponse = await preferenceClient.create({
        body: {
          external_reference: `shipping:${orderId}`,
          items: [
            {
              id: `shipping-${orderId}`,
              title: `Costo de envío — Pedido #${orderId.slice(0, 8).toUpperCase()}`,
              quantity: 1,
              unit_price: input.shipping_amount_final,
              currency_id: "MXN",
            },
          ],
          payer: {
            email: payerEmail,
            ...(payerName ? { name: payerName } : {}),
            ...(payerSurname ? { surname: payerSurname } : {}),
          },
          back_urls: {
            success: `${appUrl}/orden/${orderId}?status=shipping_success`,
            failure: `${appUrl}/orden/${orderId}?status=shipping_failure`,
            pending: `${appUrl}/orden/${orderId}?status=shipping_pending`,
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
          ...(isLocal ? {} : { auto_return: "approved" as const }),
        },
      })
    } catch (mpError) {
      console.error("[shipping-quote] Error creando preferencia MP:", mpError)
      return NextResponse.json(
        { data: null, error: { message: "Error al conectar con MercadoPago", code: "PAYMENT_ERROR" } },
        { status: 502 }
      )
    }

    if (!preferenceResponse.id) {
      return NextResponse.json(
        { data: null, error: { message: "MercadoPago no devolvió una preferencia válida", code: "PAYMENT_ERROR" } },
        { status: 502 }
      )
    }

    const paymentUrl =
      preferenceResponse.sandbox_init_point ??
      preferenceResponse.init_point ??
      ""

    // Actualizar la orden con el costo de envío y la referencia de pago
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        shipping_amount_final: input.shipping_amount_final,
        shipping_payment_status: "pending",
        shipping_payment_preference_id: preferenceResponse.id,
        shipping_payment_url: paymentUrl,
        status: "awaiting_shipping_payment",
        ...(input.carrier ? { carrier: input.carrier } : {}),
        ...(input.tracking_number ? { tracking_number: input.tracking_number } : {}),
        ...(input.guide_notes ? { guide_notes: input.guide_notes } : {}),
        guide_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      console.error("[shipping-quote] Error actualizando orden:", updateError)
      return NextResponse.json(
        { data: null, error: { message: "Error guardando datos de envío", code: "DB_ERROR" } },
        { status: 500 }
      )
    }

    // Notificar al cliente por WhatsApp y email (sin await — no bloquea la respuesta)
    sendShippingPaymentRequest(orderId).catch((err) =>
      console.error("[shipping-quote] Error enviando WhatsApp:", err)
    )
    sendShippingPaymentRequestEmail(orderId).catch((err) =>
      console.error("[shipping-quote] Error enviando email:", err)
    )

    return NextResponse.json({ data: { payment_url: paymentUrl }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
