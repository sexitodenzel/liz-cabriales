import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

import { createClient } from "@/lib/supabase/server"
import { getOrderForPayment } from "@/lib/supabase/orders"
import { createPayment } from "@/lib/supabase/payments"
import { createPaymentSchema } from "@/lib/validations/payments"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

type PaymentResponseData = {
  payment_url: string
  payment_id: string
}

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentResponseData>>> {
  try {
    // ── Autenticación ──────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("No autorizado", 401, "UNAUTHORIZED")
    }

    // ── Validación del body ────────────────────────────────────────────────────
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Body inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createPaymentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        "Datos inválidos: se requiere un order_id en formato UUID",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { order_id } = parseResult.data

    // ── Verificar orden ────────────────────────────────────────────────────────
    const orderResult = await getOrderForPayment(order_id, user.id)
    if (!orderResult.data) {
      const httpStatus =
        orderResult.error.code === "NOT_FOUND"
          ? 404
          : orderResult.error.code === "UNAUTHORIZED"
          ? 401
          : 400
      return errorResponse(
        orderResult.error.message,
        httpStatus,
        orderResult.error.code
      )
    }

    const order = orderResult.data

    // ── Datos del pagador ──────────────────────────────────────────────────────
    const userEmail = user.email ?? ""

    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()

    const payerName = (userProfile as { first_name?: string } | null)?.first_name ?? ""
    const payerSurname = (userProfile as { last_name?: string } | null)?.last_name ?? ""

    // ── Construir preferencia de MercadoPago ───────────────────────────────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const preferenceClient = new Preference(client)

    let preferenceResponse
    try {
      preferenceResponse = await preferenceClient.create({
        body: {
          external_reference: order.id,
          items: order.items.map((item) => ({
            id: item.variant_id,
            title:
              item.variant_name && item.variant_name !== item.product_name
                ? `${item.product_name} - ${item.variant_name}`
                : item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency_id: "MXN",
          })),
          payer: {
            name: payerName,
            surname: payerSurname,
            email: userEmail,
          },
          back_urls: {
            success: `${appUrl}/orden/${order.id}?status=success`,
            failure: `${appUrl}/orden/${order.id}/error?status=failure`,
            pending: `${appUrl}/orden/${order.id}?status=pending`,
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
          auto_return: "approved",
        },
      })
    } catch (mpError) {
      console.error("[mercadopago] Error al crear preferencia:", mpError)
      return errorResponse(
        "Error al conectar con MercadoPago. Intenta de nuevo.",
        502,
        "PAYMENT_ERROR"
      )
    }

    if (!preferenceResponse.id) {
      return errorResponse(
        "MercadoPago no devolvió una preferencia válida",
        502,
        "PAYMENT_ERROR"
      )
    }

    // ── Registrar el pago en Supabase ──────────────────────────────────────────
    const paymentResult = await createPayment({
      user_id: user.id,
      order_id: order.id,
      amount: order.total,
      provider_ref: preferenceResponse.id,
    })

    if (!paymentResult.data) {
      console.error(
        "[mercadopago] Error guardando registro de pago:",
        paymentResult.error
      )
    }

    // sandbox_init_point para tokens TEST-, init_point para producción
    const paymentUrl =
      preferenceResponse.sandbox_init_point ??
      preferenceResponse.init_point ??
      ""

    return NextResponse.json({
      data: {
        payment_url: paymentUrl,
        payment_id: preferenceResponse.id,
      },
      error: null,
    })
  } catch (err) {
    console.error("[mercadopago] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
