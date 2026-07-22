import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { sendPhoneCodeSchema } from "@/lib/validations/phone"
import { sendPhoneOtp } from "@/lib/notifications/phone-verification"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { extractTurnstileToken, requireTurnstile } from "@/lib/turnstile"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

// Envío de OTP: costoso (SMS/WhatsApp). Límite estricto por IP.
const RATE_LIMIT_PER_MINUTE = 5

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const rate = checkRateLimit(
      `phone-send:${getClientIp(request)}`,
      RATE_LIMIT_PER_MINUTE,
      60_000
    )
    if (!rate.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Demasiados intentos. Espera un momento e intenta de nuevo.",
            code: "RATE_LIMITED",
          },
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      )
    }

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

    const turnstileRejected = await requireTurnstile(
      request,
      extractTurnstileToken(json)
    )
    if (turnstileRejected) {
      return turnstileRejected as NextResponse<ApiResponse<null>>
    }

    // El schema de teléfono no incluye turnstileToken; se valida aparte arriba.
    const { turnstileToken: _turnstileToken, ...phonePayload } =
      (json as Record<string, unknown>) ?? {}
    void _turnstileToken

    const parseResult = sendPhoneCodeSchema.safeParse(phonePayload)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: parseResult.error.issues[0]?.message ?? "Teléfono inválido",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await sendPhoneOtp(user.id, parseResult.data.phone)
    if (result.error) {
      const status = result.error.code === "RATE_LIMITED" ? 429 : 500
      return NextResponse.json(
        { data: null, error: result.error },
        { status }
      )
    }

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
