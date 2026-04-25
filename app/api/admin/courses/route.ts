import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { createCourse, getAdminCourses } from "@/lib/supabase/courses"
import { createCourseSchema } from "@/lib/validations/courses"

type ApiError = { message: string; code?: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status }
  )
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const authResult = await requireAdmin(user?.id)
  return { authResult }
}

export async function GET() {
  try {
    const { authResult } = await assertAdmin()
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

    const result = await getAdminCourses()
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { courses: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/courses GET] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authResult } = await assertAdmin()
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

    const parseResult = createCourseSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await createCourse(parseResult.data)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { course: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/courses POST] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
