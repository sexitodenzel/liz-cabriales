import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

import { createClient } from "@/lib/supabase/server"
import { getAppointmentForPayment } from "@/lib/supabase/appointments"
import { createAppointmentPaymentSchema } from "@/lib/validations/appointments"

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

function buildExternalRef(appointmentId: string): string {
  // Prefijo para que el webhook distinga pagos de citas vs órdenes.
  return `appointment:${appointmentId}`
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentResponseData>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createAppointmentPaymentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        "Se requiere un appointment_id en formato UUID",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { appointment_id } = parseResult.data

    const apptResult = await getAppointmentForPayment(appointment_id, user.id)
    if (!apptResult.data) {
      const httpStatus =
        apptResult.error.code === "NOT_FOUND"
          ? 404
          : apptResult.error.code === "VALIDATION_ERROR"
            ? 400
            : 400
      return errorResponse(
        apptResult.error.message,
        httpStatus,
        apptResult.error.code
      )
    }

    const appointment = apptResult.data
    const userEmail = user.email ?? ""

    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()

    const payerName =
      (userProfile as { first_name?: string } | null)?.first_name ?? ""
    const payerSurname =
      (userProfile as { last_name?: string } | null)?.last_name ?? ""

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const preferenceClient = new Preference(client)

    let preferenceResponse
    try {
      preferenceResponse = await preferenceClient.create({
        body: {
          external_reference: buildExternalRef(appointment.id),
          items: appointment.services.map((s) => ({
            id: s.service_id,
            title: s.service_name,
            quantity: 1,
            unit_price: s.unit_price,
            currency_id: "MXN",
          })),
          payer: {
            name: payerName,
            surname: payerSurname,
            email: userEmail,
          },
          back_urls: {
            success: `${appUrl}/cita/${appointment.id}?status=success`,
            failure: `${appUrl}/cita/${appointment.id}/error?status=failure`,
            pending: `${appUrl}/cita/${appointment.id}?status=pending`,
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
          auto_return: "approved",
        },
      })
    } catch (mpError) {
      console.error(
        "[payments/appointment] Error al crear preferencia:",
        mpError
      )
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

    // Registrar el pago en la tabla payments con appointment_id.
    // Nota: order_id es requerido por esquema previo; usamos null porque
    // la columna admite appointment_id FK. Si tu esquema exige NOT NULL en
    // order_id, revisa la tabla `payments`.
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    )
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: paymentInsertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        order_id: null,
        appointment_id: appointment.id,
        amount: appointment.total,
        currency: "MXN",
        provider: "mercadopago",
        provider_ref: preferenceResponse.id,
        status: "pending",
      })

    if (paymentInsertError) {
      console.error(
        "[payments/appointment] Error guardando registro de pago:",
        paymentInsertError
      )
    }

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
    console.error("[payments/appointment] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
