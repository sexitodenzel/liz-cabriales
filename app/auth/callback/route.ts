import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  loginEventRequestMeta,
  recordLoginEvent,
  type LoginMethod,
} from "@/lib/supabase/login-events"
import { notifyAdminLoginSuccess } from "@/lib/security/login-alerts"
import { RECOVERY_MARKER_COOKIE } from "@/lib/supabase/recovery-marker"

function sanitizeNextPath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//")) return null
  return value
}

function resolveAuthMethod(type: string | null): LoginMethod {
  if (type === "invite") return "invite"
  if (type === "recovery") return "recovery"
  if (type === "magiclink" || type === "email") return "magic_link"
  // PKCE / OAuth (Google, etc.) suelen llegar solo con ?code=
  return "oauth"
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = sanitizeNextPath(
    requestUrl.searchParams.get("next") ?? requestUrl.searchParams.get("redirect")
  )
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  let justAuthenticated = false
  let exchangeFailed = false

  // Supabase manda ?error=access_denied&error_code=otp_expired cuando el enlace
  // del correo ya se usó o venció (un clic doble, o el antivirus del correo lo
  // abrió antes). Sin esto el usuario caería en la portada sin explicación.
  const linkErrorCode = requestUrl.searchParams.get("error_code")
  const linkFailed = !!(requestUrl.searchParams.get("error") || linkErrorCode)

  if (code) {
    supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    justAuthenticated = !error
    exchangeFailed = !!error
  }

  // El correo de recuperación ya no lleva `?type=recovery` (rompía la lista de
  // Redirect URLs de Supabase): lo reconocemos por la cookie de /forgot-password.
  // El parámetro se conserva para los correos que ya se enviaron con él.
  const isRecovery =
    type === "recovery" ||
    request.cookies.get(RECOVERY_MARKER_COOKIE)?.value === "1"

  if (type === "invite" || isRecovery || linkFailed) {
    const wantsRecovery = isRecovery || (linkFailed && type !== "invite")
    const setPasswordUrl = new URL("/auth/set-password", requestUrl.origin)
    if (wantsRecovery) setPasswordUrl.searchParams.set("type", "recovery")
    // Sin sesión (p. ej. el enlace se abrió en otro navegador y falta el
    // code_verifier del PKCE, o ya venció) la página debe explicarlo, no
    // mostrar un genérico.
    if (linkErrorCode === "otp_expired") {
      setPasswordUrl.searchParams.set("error", "expired")
    } else if (exchangeFailed || linkFailed) {
      setPasswordUrl.searchParams.set("error", "link")
    }
    const response = NextResponse.redirect(setPasswordUrl)
    if (isRecovery) response.cookies.delete(RECOVERY_MARKER_COOKIE)
    return response
  }

  const authClient = supabase ?? (await createClient())
  const {
    data: { user },
  } = await authClient.auth.getUser()

  // Auditoría: solo cuando acabamos de intercambiar el code y el usuario es admin.
  if (justAuthenticated && user) {
    const { data: profile } = await authClient
      .from("users")
      .select("role, first_name, last_name, email")
      .eq("id", user.id)
      .maybeSingle()

    const role = (profile?.role as string | undefined) ?? "client"
    if (role === "admin") {
      const meta = loginEventRequestMeta(request)
      const email = user.email ?? profile?.email ?? null
      const fullName =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
        null
      const method = resolveAuthMethod(type)

      void recordLoginEvent({
        userId: user.id,
        email,
        fullName,
        role,
        method,
        ip: meta.ip,
        userAgent: meta.userAgent,
      })

      if (email) {
        notifyAdminLoginSuccess({
          fullName,
          email,
          method,
          ip: meta.ip,
          userAgent: meta.userAgent,
        })
      }
    }
  }

  if (next) {
    const redirectUrl = new URL(next, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  if (!user) {
    return NextResponse.redirect(new URL("/perfil", requestUrl.origin))
  }

  const { data: profile } = await authClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role ?? "client"
  const defaultRedirect =
    role === "admin"
      ? "/admin"
      : role === "receptionist"
        ? "/admin/appointments"
        : "/perfil"

  const redirectUrl = new URL(defaultRedirect, requestUrl.origin)
  return NextResponse.redirect(redirectUrl)
}
