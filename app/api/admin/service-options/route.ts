import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  createServiceOption,
  getAdminServiceOptions,
} from "@/lib/supabase/servicesAdmin"
import { adminServiceOptionCreateSchema } from "@/lib/validations/services"

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

export async function GET() {
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

    const result = await getAdminServiceOptions()
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({ data: { options: result.data }, error: null })
  } catch (err) {
    console.error("[api/admin/service-options GET]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
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

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = adminServiceOptionCreateSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await createServiceOption(parseResult.data)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("services", "max")

    return NextResponse.json(
      { data: { option: result.data }, error: null },
      { status: 201 }
    )
  } catch (err) {
    console.error("[api/admin/service-options POST]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
