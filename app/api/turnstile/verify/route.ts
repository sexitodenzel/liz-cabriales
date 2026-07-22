import { NextRequest, NextResponse } from "next/server"

import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import {
  extractTurnstileToken,
  requireTurnstile,
} from "@/lib/turnstile"

type ApiError = { message: string; code?: string }
type ApiResponse = { data: { ok: true }; error: null } | { data: null; error: ApiError }

/**
 * Endpoint ligero para flujos que hablan directo con Supabase Auth en el
 * cliente (login con contraseña, envío de OTP de correo en registro).
 * Valida el token de Turnstile y no ejecuta ninguna otra lógica de negocio.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const rate = checkRateLimit(`turnstile-verify:${getClientIp(request)}`, 30, 60_000)
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

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Body inválido", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const rejected = await requireTurnstile(request, extractTurnstileToken(json))
  if (rejected) {
    return rejected as NextResponse<ApiResponse>
  }

  return NextResponse.json({ data: { ok: true }, error: null })
}
