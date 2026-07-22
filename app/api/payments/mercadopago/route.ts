import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

import { createClient } from "@/lib/supabase/server"
import { getOrderForPayment } from "@/lib/supabase/orders"
import { createPayment } from "@/lib/supabase/payments"
import { createPaymentSchema } from "@/lib/validations/payments"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Creación de preferencias de pago: límite por usuario+IP para evitar abuso.
const PAYMENT_RATE_LIMIT = 10
const PAYMENT_RATE_WINDOW_MS = 5 * 60_000

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

    // ── Rate limit por usuario+IP ───────────────────────────────────────────────
    const rate = checkRateLimit(
      `payment-order:${user.id}:${getClientIp(request)}`,
      PAYMENT_RATE_LIMIT,
      PAYMENT_RATE_WINDOW_MS
    )
    if (!rate.allowed) {
      return errorResponse(
        "Demasiados intentos de pago. Espera unos minutos.",
        429,
        "RATE_LIMITED"
      )
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
    const userEmail = user.email?.trim() ?? ""
    if (!userEmail) {
      return errorResponse(
        "Tu cuenta no tiene correo electrónico. Actualiza tu perfil para continuar.",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()

    const payerName =
      (userProfile as { first_name?: string } | null)?.first_name?.trim() ?? ""
    const payerSurname =
      (userProfile as { last_name?: string } | null)?.last_name?.trim() ?? ""
    const payer: { email: string; name?: string; surname?: string } = {
      email: userEmail,
    }
    if (payerName) payer.name = payerName
    if (payerSurname) payer.surname = payerSurname

    // ── Construir preferencia de MercadoPago ───────────────────────────────────
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .trim()
      .replace(/\/$/, "")
    const isLocalAppUrl = /:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(
      appUrl
    )

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
          payer,
          back_urls: {
            success: `${appUrl}/orden/${order.id}?status=success`,
            failure: `${appUrl}/orden/${order.id}?status=failure`,
            pending: `${appUrl}/orden/${order.id}?status=pending`,
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
          ...(isLocalAppUrl ? {} : { auto_return: "approved" as const }),
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
