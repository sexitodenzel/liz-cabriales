import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { authEmailSchema } from "@/lib/validations/auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { extractTurnstileToken, requireTurnstile } from "@/lib/turnstile"

type ApiError = { message: string; code?: string }
type ApiResponse = { data: { exists: boolean }; error: null } | { data: null; error: ApiError }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Frena la enumeración de correos: un usuario legítimo hace 1-2 checks al
// entrar al login; 10/min por IP deja margen para NAT compartido.
const RATE_LIMIT_PER_MINUTE = 10

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const rate = checkRateLimit(
    `check-email:${getClientIp(request)}`,
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
    return turnstileRejected as NextResponse<ApiResponse>
  }

  const emailField = (json as { email?: unknown })?.email
  const parsed = authEmailSchema.safeParse(emailField)
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: parsed.error.issues[0]?.message ?? "Correo inválido",
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 }
    )
  }

  const email = parsed.data

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: "No se pudo verificar el correo" } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { exists: Boolean(data) }, error: null })
}
