import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  deleteProfessional,
  updateProfessional,
} from "@/lib/supabase/appointments"
import { adminProfessionalUpdateSchema } from "@/lib/validations/appointments"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

async function assertAdminOrReceptionist() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdminOrReceptionist(user?.id)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await assertAdminOrReceptionist()
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

    const parseResult = adminProfessionalUpdateSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await updateProfessional(id, parseResult.data)
    if (!result.data) {
      const status = result.error.code === "VALIDATION_ERROR" ? 400 : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    revalidateTag("professionals", "max")

    return NextResponse.json({
      data: { professional: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/professionals/[id] PATCH]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await assertAdminOrReceptionist()
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
    const result = await deleteProfessional(id)

    if (result.error) {
      const status =
        result.error.code === "HAS_APPOINTMENTS" ? 409 : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    revalidateTag("professionals", "max")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/professionals/[id] DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
