import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  getStudioSettings,
  saveStudioSettings,
} from "@/lib/supabase/studio-settings"
import { studioSettingsUpdateSchema } from "@/lib/validations/appointments"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

async function requireStaff() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdminOrReceptionist(user?.id)
}

export async function GET() {
  try {
    const authResult = await requireStaff()
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return errorResponse(authResult.error.message, status, authResult.error.code)
    }

    const result = await getStudioSettings()
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({ data: result.data, error: null })
  } catch (err) {
    console.error("[api/admin/studio-settings GET]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaff()
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

    const parsed = studioSettingsUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await saveStudioSettings(parsed.data)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    revalidateTag("studio-settings", "max")

    return NextResponse.json({ data: result.data, error: null })
  } catch (err) {
    console.error("[api/admin/studio-settings PUT]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
