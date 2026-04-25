import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  createAppointment,
  listAppointmentsForUser,
  type AppointmentRecord,
} from "@/lib/supabase/appointments"
import { createAppointmentSchema } from "@/lib/validations/appointments"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function GET(): Promise<
  NextResponse<ApiResponse<{ appointments: AppointmentRecord[] }>>
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    const result = await listAppointmentsForUser(user.id)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { appointments: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/appointments GET] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ appointment_id: string; total: number }>>> {
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
      return errorResponse("Cuerpo de la petición inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createAppointmentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await createAppointment({
      ...parseResult.data,
      user_id: user.id,
      appointment_type: "individual",
    })

    if (!result.data) {
      const status =
        result.error.code === "ACTIVE_APPOINTMENT_EXISTS"
          ? 409
          : result.error.code === "SLOT_UNAVAILABLE"
            ? 409
            : result.error.code === "TOO_SOON" ||
                result.error.code === "OUT_OF_BUSINESS_HOURS" ||
                result.error.code === "CLOSED_DAY" ||
                result.error.code === "VALIDATION_ERROR" ||
                result.error.code === "SERVICE_NOT_FOUND"
              ? 400
              : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    return NextResponse.json({
      data: {
        appointment_id: result.data.appointment_id,
        total: result.data.total,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/appointments] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
