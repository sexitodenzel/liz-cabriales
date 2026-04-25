import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { cancelAppointment } from "@/lib/supabase/appointments"

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

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    const result = await cancelAppointment(id, user.id)
    if (result.error) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "FORBIDDEN"
            ? 403
            : result.error.code === "CANCEL_TOO_LATE" ||
                result.error.code === "ALREADY_CANCELLED" ||
                result.error.code === "ALREADY_COMPLETED"
              ? 409
              : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/appointments/cancel] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
