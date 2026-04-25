import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  adminCreateManualAppointment,
  getAdminAppointments,
} from "@/lib/supabase/appointments"
import {
  adminAppointmentsQuerySchema,
  adminCreateAppointmentSchema,
} from "@/lib/validations/appointments"
import { sendAppointmentConfirmationEmail } from "@/lib/email/templates/appointment-confirmation"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

async function assertAdminOrReceptionist() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const authResult = await requireAdminOrReceptionist(user?.id)
  return { supabase, user, authResult }
}

export async function GET(request: NextRequest) {
  try {
    const { authResult } = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(
        authResult.error.message,
        status,
        authResult.error.code
      )
    }

    const sp = request.nextUrl.searchParams
    const parseResult = adminAppointmentsQuerySchema.safeParse({
      date: sp.get("date") ?? undefined,
      professional_id: sp.get("professional_id") ?? undefined,
    })

    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Parámetros inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const date = parseResult.data.date ?? todayString()

    const result = await getAdminAppointments(
      date,
      parseResult.data.professional_id
    )
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { appointments: result.data, date },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/appointments] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authResult } = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(
        authResult.error.message,
        status,
        authResult.error.code
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = adminCreateAppointmentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await adminCreateManualAppointment(parseResult.data)

    if (!result.data) {
      const status =
        result.error.code === "SLOT_UNAVAILABLE"
          ? 409
          : result.error.code === "USER_REQUIRED" ||
              result.error.code === "VALIDATION_ERROR" ||
              result.error.code === "SERVICE_NOT_FOUND" ||
              result.error.code === "OUT_OF_BUSINESS_HOURS" ||
              result.error.code === "CLOSED_DAY"
            ? 400
            : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    try {
      await sendAppointmentConfirmationEmail(result.data.appointment_id)
    } catch (emailError) {
      console.error(
        `[api/admin/appointments POST] Error enviando email de confirmación para cita ${result.data.appointment_id}:`,
        emailError
      )
      // El fallo del email no debe revertir la creación de la cita
    }

    return NextResponse.json({
      data: {
        appointment_id: result.data.appointment_id,
        total: result.data.total,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/appointments POST] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
