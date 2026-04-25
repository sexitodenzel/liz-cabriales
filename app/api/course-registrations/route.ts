import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createRegistration } from "@/lib/supabase/courses"
import { createRegistrationSchema } from "@/lib/validations/courses"

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

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<ApiResponse<{ registration_id: string; total: number }>>
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse("No autorizado", 401, "UNAUTHENTICATED")
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = createRegistrationSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const { course_id, attendees } = parseResult.data
    const result = await createRegistration(course_id, user.id, attendees)

    if (!result.data) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "COURSE_FULL" ||
              result.error.code === "ALREADY_REGISTERED" ||
              result.error.code === "PENDING_REGISTRATION_EXISTS"
            ? 409
            : result.error.code === "COURSE_NOT_PUBLISHED" ||
                result.error.code === "VALIDATION_ERROR"
              ? 400
              : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    return NextResponse.json({
      data: {
        registration_id: result.data.registration_id,
        total: result.data.total,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/course-registrations POST] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
