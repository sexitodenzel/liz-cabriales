import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  createBlockedSlot,
  createBlockedSlotsForDateRange,
  getUpcomingBlockedSlots,
} from "@/lib/supabase/appointments"
import { blockedSlotCreateSchema } from "@/lib/validations/appointments"

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

    const professionalIds = request.nextUrl.searchParams.getAll("professional_id")
    const result = await getUpcomingBlockedSlots({
      professionalIds: professionalIds.length > 0 ? professionalIds : undefined,
    })

    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { blocked_slots: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/blocked-slots GET] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const parseResult = blockedSlotCreateSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const payload = parseResult.data

    if (payload.mode === "days") {
      const result = await createBlockedSlotsForDateRange({
        professional_id: payload.professional_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        reason: payload.reason,
      })
      if (!result.data) {
        return errorResponse(result.error.message, 500, result.error.code)
      }
      return NextResponse.json({
        data: { days_blocked: result.data.days_blocked },
        error: null,
      })
    }

    const { mode: _mode, ...hourPayload } = payload
    const result = await createBlockedSlot(hourPayload)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { blocked_slot: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/blocked-slots POST] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
