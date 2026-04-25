import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { createClientFromAdmin } from "@/lib/supabase/adminUsers"
import { createAdminClientSchema } from "@/lib/validations/adminUsers"
import { sendWelcomeClientEmail } from "@/lib/email/templates/welcome-client"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
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

    const parseResult = createAdminClientSchema.safeParse(json)
    if (!parseResult.success) {
      return errorResponse(
        parseResult.error.issues[0]?.message ?? "Datos inválidos",
        400,
        "VALIDATION_ERROR"
      )
    }

    const result = await createClientFromAdmin({
      firstName: parseResult.data.first_name,
      lastName: parseResult.data.last_name,
      email: parseResult.data.email,
    })

    if (!result.data) {
      const status =
        result.error.code === "USER_CREATE_FAILED" ? 409 : 400
      return errorResponse(result.error.message, status, result.error.code)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    try {
      await sendWelcomeClientEmail({
        firstName: result.data.first_name,
        email: result.data.email,
        appUrl,
      })
    } catch (emailError) {
      console.error(
        `[api/admin/users POST] Error enviando email de bienvenida a ${result.data.email}:`,
        emailError
      )
      // El fallo del email no revierte la creación del usuario
    }

    return NextResponse.json({
      data: {
        user_id: result.data.user_id,
        email: result.data.email,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/users POST] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
