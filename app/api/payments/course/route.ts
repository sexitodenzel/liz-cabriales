import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { getRegistrationForPayment } from "@/lib/supabase/courses"
import { createCoursePaymentSchema } from "@/lib/validations/courses"
import { getMinDeposit } from "@/lib/utils"

type ApiError = { message: string; code?: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

type PaymentResponseData = {
  payment_url: string
  payment_id: string
}

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status }
  )
}

function buildExternalRef(registrationId: string): string {
  // Prefijo para que el webhook distinga pagos de cursos vs órdenes/citas.
  return `course:${registrationId}`
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentResponseData>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createCoursePaymentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { registration_id, amount } = parseResult.data

    const regRes = await getRegistrationForPayment(registration_id, user.id)
    if (!regRes.data) {
      const httpStatus =
        regRes.error.code === "NOT_FOUND"
          ? 404
          : regRes.error.code === "VALIDATION_ERROR"
            ? 400
            : 400
      return errorResponse(regRes.error.message, httpStatus, regRes.error.code)
    }

    const registration = regRes.data
    const course = registration.course
    if (!course) {
      return errorResponse(
        "El curso asociado a la inscripción no está disponible",
        400,
        "COURSE_NOT_FOUND"
      )
    }

    // Validar monto: debe ser >= apartado mínimo y <= precio total * attendees
    const totalCourse = course.price * registration.attendees
    const minDeposit = getMinDeposit(course.price)

    if (amount < minDeposit) {
      return errorResponse(
        `El monto mínimo de apartado es $${minDeposit}`,
        400,
        "AMOUNT_TOO_LOW"
      )
    }
    if (amount > totalCourse) {
      return errorResponse(
        "El monto excede el total del curso",
        400,
        "AMOUNT_TOO_HIGH"
      )
    }

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

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const preferenceClient = new Preference(mpClient)

    const isDeposit = amount < totalCourse
    const itemTitle = isDeposit
      ? `Apartado — ${course.title}`
      : `Inscripción — ${course.title}`

    let preferenceResponse
    try {
      preferenceResponse = await preferenceClient.create({
        body: {
          external_reference: buildExternalRef(registration.id),
          items: [
            {
              id: course.id,
              title: itemTitle,
              quantity: 1,
              unit_price: amount,
              currency_id: "MXN",
            },
          ],
          payer: {
            name: payerName,
            surname: payerSurname,
            email: userEmail,
          },
          back_urls: {
            success: `${appUrl}/curso/${course.id}/inscripcion/${registration.id}?status=success`,
            failure: `${appUrl}/curso/${course.id}/inscripcion/${registration.id}/error?status=failure`,
            pending: `${appUrl}/curso/${course.id}/inscripcion/${registration.id}?status=pending`,
          },
          notification_url: `${appUrl}/api/webhooks/mercadopago`,
          auto_return: "approved",
        },
      })
    } catch (mpError) {
      console.error("[payments/course] Error al crear preferencia:", mpError)
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

    // Registrar el pago con course_reg_id FK.
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: paymentInsertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        order_id: null,
        appointment_id: null,
        course_reg_id: registration.id,
        amount,
        currency: "MXN",
        provider: "mercadopago",
        provider_ref: preferenceResponse.id,
        status: "pending",
      })

    if (paymentInsertError) {
      console.error(
        "[payments/course] Error guardando registro de pago:",
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
    console.error("[payments/course] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
