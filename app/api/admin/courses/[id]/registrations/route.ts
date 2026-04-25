import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  addManualRegistration,
  getRegistrationsByCourse,
} from "@/lib/supabase/courses"
import { manualRegistrationSchema } from "@/lib/validations/courses"

type Params = Promise<{ id: string }>

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
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

    const { id } = await params
    const result = await getRegistrationsByCourse(id)
    if (!result.data) {
      return errorResponse(result.error.message, 500, result.error.code)
    }

    return NextResponse.json({
      data: { registrations: result.data },
      error: null,
    })
  } catch (err) {
    console.error(
      "[api/admin/courses/[id]/registrations GET] Error inesperado:",
      err
    )
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
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

    const { id } = await params

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400, "VALIDATION_ERROR")
    }

    const parseResult = manualRegistrationSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await addManualRegistration(id, parseResult.data)
    if (!result.data) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "COURSE_FULL" ||
              result.error.code === "ALREADY_REGISTERED"
            ? 409
            : result.error.code === "USER_REQUIRED" ||
                result.error.code === "VALIDATION_ERROR"
              ? 400
              : 500
      return errorResponse(result.error.message, status, result.error.code)
    }

    return NextResponse.json({
      data: { registration_id: result.data.registration_id },
      error: null,
    })
  } catch (err) {
    console.error(
      "[api/admin/courses/[id]/registrations POST] Error inesperado:",
      err
    )
    return errorResponse("Error interno del servidor", 500)
  }
}
