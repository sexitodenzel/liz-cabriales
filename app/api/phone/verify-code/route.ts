import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { verifyPhoneCodeSchema } from "@/lib/validations/phone"
import { verifyPhoneOtp } from "@/lib/notifications/phone-verification"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado", code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Body inválido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const parseResult = verifyPhoneCodeSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Código inválido",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await verifyPhoneOtp(user.id, parseResult.data.code)
    if (result.error) {
      const status =
        result.error.code === "TOO_MANY_ATTEMPTS"
          ? 429
          : result.error.code === "INVALID_CODE" ||
              result.error.code === "CODE_EXPIRED" ||
              result.error.code === "NO_CODE"
            ? 400
            : 500
      return NextResponse.json({ data: null, error: result.error }, { status })
    }

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
