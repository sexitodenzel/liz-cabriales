import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { rescheduleAppointment } from "@/lib/supabase/appointments"
import { rescheduleAppointmentSchema } from "@/lib/validations/appointments"
import { sendAppointmentRescheduledEmail } from "@/lib/email/templates/appointment-rescheduled"

type RouteContext = { params: Promise<{ id: string }> }

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdminOrReceptionist(user?.id)
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

    const parseResult = rescheduleAppointmentSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await rescheduleAppointment(id, {
      date: parseResult.data.date,
      start_time: parseResult.data.start_time,
      professional_id: parseResult.data.professional_id,
    })

    if (!result.data) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "SLOT_UNAVAILABLE"
            ? 409
            : result.error.code === "INVALID_STATUS" ||
                result.error.code === "OUT_OF_BUSINESS_HOURS" ||
                result.error.code === "CLOSED_DAY" ||
                result.error.code === "VALIDATION_ERROR"
              ? 400
              : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    try {
      await sendAppointmentRescheduledEmail({
        appointmentId: result.data.appointment_id,
        previousDate: result.data.previous_date,
        previousStartTime: result.data.previous_start_time,
      })
    } catch (emailError) {
      console.error(
        `[api/admin/appointments/reschedule] Error enviando email para cita ${id}:`,
        emailError
      )
      // El fallo del email no revierte el cambio
    }

    return NextResponse.json({
      data: {
        appointment_id: result.data.appointment_id,
        date: result.data.new_date,
        start_time: result.data.new_start_time,
        end_time: result.data.new_end_time,
        professional_id: result.data.new_professional_id,
        total: result.data.total,
      },
      error: null,
    })
  } catch (err) {
    console.error(
      "[api/admin/appointments/reschedule PATCH] Error inesperado:",
      err
    )
    return errorResponse("Error interno del servidor", 500)
  }
}
