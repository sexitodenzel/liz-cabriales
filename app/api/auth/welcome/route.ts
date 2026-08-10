import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

import { checkRateLimit, enforceRateLimit } from "@/lib/rate-limit"
import { sendWelcomeClientEmail } from "@/lib/email/templates/welcome-client"

type ApiResponse =
  | { data: { sent: boolean }; error: null }
  | { data: null; error: { message: string; code?: string } }

// Tope por IP; el de verdad es el de por usuario de más abajo.
const RATE_LIMIT_PER_MINUTE = 5
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Correo de bienvenida para quien se registró solo en `/registrar`.
 *
 * Ese flujo ocurre entero en el navegador (Supabase Auth directo), así que no
 * hay ningún momento en el servidor donde engancharlo: por eso esta ruta. NO
 * recibe destinatario — lo saca de la sesión — para que no se pueda usar como
 * bandeja de spam hacia correos ajenos.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const rateLimited = enforceRateLimit(
    request,
    "auth-welcome",
    RATE_LIMIT_PER_MINUTE,
    60_000
  )
  if (rateLimited) return rateLimited as NextResponse<ApiResponse>

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Solo lectura: esta ruta no refresca la sesión.
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return NextResponse.json(
      { data: null, error: { message: "No autenticado", code: "UNAUTHENTICATED" } },
      { status: 401 }
    )
  }

  // Una bienvenida por usuario al día: si el registro se reintenta o la página
  // se recarga, no le llegan tres correos iguales.
  const once = checkRateLimit(`auth-welcome-user:${user.id}`, 1, ONE_DAY_MS)
  if (!once.allowed) {
    return NextResponse.json({ data: { sent: false }, error: null }, { status: 200 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle()

  const firstName =
    (profile?.first_name as string | undefined)?.trim() ||
    (user.user_metadata?.first_name as string | undefined)?.trim() ||
    "Hola"

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin

  try {
    await sendWelcomeClientEmail({
      firstName,
      email: user.email,
      appUrl,
      // Esta persona acaba de elegir su contraseña; no mandarla a recuperarla.
      needsPasswordSetup: false,
    })
  } catch (err) {
    // El registro ya quedó hecho: un fallo de correo no debe romper nada.
    console.error("[auth/welcome] No se pudo enviar la bienvenida:", err)
    return NextResponse.json(
      {
        data: null,
        error: { message: "No se pudo enviar el correo", code: "EMAIL_FAILED" },
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: { sent: true }, error: null }, { status: 200 })
}
