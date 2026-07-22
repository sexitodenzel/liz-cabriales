import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import type { CookieOptions } from "@supabase/ssr"

import { enforceRateLimit } from "@/lib/rate-limit"
import { extractTurnstileToken, requireTurnstile } from "@/lib/turnstile"
import { loginCredentialsSchema } from "@/lib/validations/auth"
import {
  loginEventRequestMeta,
  recordLoginEvent,
} from "@/lib/supabase/login-events"
import { touchUserLastActivity } from "@/lib/supabase/admin-session-activity"

type ApiError = { message: string; code?: string }

type LoginSuccess = {
  user: { id: string; email: string | null }
  role: string
  /** Metadatos de sesión (sin tokens; las cookies HttpOnly las fija el servidor). */
  session: {
    expires_at: number | null
    expires_in: number | null
    token_type: string | null
  }
}

type ApiResponse =
  | { data: LoginSuccess; error: null }
  | { data: null; error: ApiError }

type PendingCookie = {
  name: string
  value: string
  options: CookieOptions
}

// Intentos de login con contraseña: límite estricto por IP.
const LOGIN_RATE_LIMIT = 10
const LOGIN_RATE_WINDOW_MS = 60_000

function friendlyAuthError(raw: string): {
  message: string
  code: string
  status: number
} {
  if (/invalid login credentials/i.test(raw)) {
    return {
      message: "Correo o contraseña incorrectos.",
      code: "INVALID_CREDENTIALS",
      status: 401,
    }
  }
  if (/email not confirmed/i.test(raw)) {
    return {
      message: "Aún no confirmas tu correo. Revisa tu bandeja de entrada.",
      code: "EMAIL_NOT_CONFIRMED",
      status: 403,
    }
  }
  return {
    message:
      raw ||
      "No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo.",
    code: "AUTH_ERROR",
    status: 401,
  }
}

function applyCookies<T>(
  response: NextResponse<T>,
  pending: PendingCookie[]
): NextResponse<T> {
  for (const { name, value, options } of pending) {
    response.cookies.set(name, value, options)
  }
  return response
}

/**
 * Login con email/contraseña vía servidor.
 * Turnstile + rate limit antes de llamar a Supabase Auth; la sesión se guarda
 * en cookies HttpOnly (no se devuelven access/refresh tokens en el JSON).
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const rateLimited = enforceRateLimit(
    request,
    "login",
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_MS
  )
  if (rateLimited) {
    return rateLimited as NextResponse<ApiResponse>
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Body inválido", code: "VALIDATION_ERROR" },
      },
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

  const parsed = loginCredentialsSchema.safeParse({
    email: (json as { email?: unknown })?.email,
    password: (json as { password?: unknown })?.password,
  })
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: parsed.error.issues[0]?.message ?? "Datos inválidos",
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 }
    )
  }

  const pendingCookies: PendingCookie[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user || !data.session) {
    const friendly = friendlyAuthError(error?.message ?? "")
    return applyCookies(
      NextResponse.json(
        {
          data: null,
          error: { message: friendly.message, code: friendly.code },
        },
        { status: friendly.status }
      ),
      pendingCookies
    )
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, first_name, last_name, email")
    .eq("id", data.user.id)
    .maybeSingle()

  const role = (profile?.role as string | undefined) ?? "client"
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null

  // Auditoría de accesos: solo administradores (control interno del panel).
  if (role === "admin") {
    const meta = loginEventRequestMeta(request)
    void recordLoginEvent({
      userId: data.user.id,
      email: data.user.email ?? profile?.email ?? parsed.data.email,
      fullName,
      role,
      method: "password",
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
  }

  // Inicia el reloj de inactividad del panel para staff.
  if (role === "admin" || role === "receptionist") {
    void touchUserLastActivity(data.user.id)
  }

  const payload: LoginSuccess = {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
    role,
    session: {
      expires_at: data.session.expires_at ?? null,
      expires_in: data.session.expires_in ?? null,
      token_type: data.session.token_type ?? null,
    },
  }

  return applyCookies(
    NextResponse.json({ data: payload, error: null }, { status: 200 }),
    pendingCookies
  )
}
