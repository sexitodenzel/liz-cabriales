import { NextRequest, NextResponse } from "next/server"

import { getAvailableSlots } from "@/lib/supabase/appointments"
import { availabilityQuerySchema } from "@/lib/validations/appointments"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams

    const parseResult = availabilityQuerySchema.safeParse({
      date: sp.get("date") ?? undefined,
      professional_id: sp.get("professional_id") ?? undefined,
      duration_min: sp.get("duration_min") ?? undefined,
    })

    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Parámetros inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { date, professional_id, duration_min } = parseResult.data

    const result = await getAvailableSlots(date, professional_id, duration_min)

    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { slots: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/appointments/availability] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
