import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  getAppointmentWithDetails,
  updateAppointmentStatusToPaid,
} from "@/lib/supabase/appointments"
import { sendAppointmentConfirmationEmail } from "@/lib/email/templates/appointment-confirmation"

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

export async function PATCH(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ status: "paid" }>>> {
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
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const details = await getAppointmentWithDetails(id)
    if (!details.data) {
      const status = details.error.code === "NOT_FOUND" ? 404 : 500
      return errorResponse(
        details.error.message ?? "Cita no encontrada",
        status,
        details.error.code
      )
    }

    if (details.data.status === "paid") {
      return NextResponse.json({ data: { status: "paid" }, error: null })
    }

    if (details.data.status !== "pending") {
      return errorResponse(
        "Solo se puede confirmar el pago de citas pendientes",
        400,
        "INVALID_STATUS"
      )
    }

    const paidResult = await updateAppointmentStatusToPaid(id)
    if (paidResult.error) {
      return errorResponse(paidResult.error.message, 500, paidResult.error.code)
    }

    try {
      await sendAppointmentConfirmationEmail(id)
    } catch (emailError) {
      console.error(
        `[api/admin/appointments/confirm] Error enviando email para cita ${id}:`,
        emailError
      )
    }

    return NextResponse.json({ data: { status: "paid" }, error: null })
  } catch (err) {
    console.error("[api/admin/appointments/confirm PATCH]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
