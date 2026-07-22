import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  deleteServiceReview,
  setServiceReviewApproval,
} from "@/lib/supabase/service-reviews"

type Params = Promise<{ id: string }>

type ApiError = { message: string; code?: string }

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(
    { data: null, error: { message, code } as ApiError },
    { status }
  )
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdmin(user?.id)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const authResult = await assertAdmin()
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

    const { id } = await params

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const body = json as { is_approved?: unknown }
    if (typeof body.is_approved !== "boolean") {
      return errorResponse(
        "is_approved debe ser booleano",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await setServiceReviewApproval(id, body.is_approved)
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/service-reviews PATCH]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const authResult = await assertAdmin()
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

    const { id } = await params
    const result = await deleteServiceReview(id)
    if (result.error) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/service-reviews DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
