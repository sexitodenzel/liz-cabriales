import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  deleteService,
  updateService,
} from "@/lib/supabase/servicesAdmin"
import { adminServiceUpdateSchema } from "@/lib/validations/services"

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

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id } = await context.params

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = adminServiceUpdateSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await updateService(id, parseResult.data)
    if (!result.data) {
      const status = result.error.code === "VALIDATION_ERROR" ? 400 : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json({ data: { service: result.data }, error: null })
  } catch (err) {
    console.error("[api/admin/services/[id] PATCH]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await assertAdminOrReceptionist()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const { id } = await context.params
    const result = await deleteService(id)
    if (result.error) {
      const status =
        result.error.code === "HAS_APPOINTMENTS" ? 409 : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/services/[id] DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
