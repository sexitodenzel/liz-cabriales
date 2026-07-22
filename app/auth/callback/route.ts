import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  loginEventRequestMeta,
  recordLoginEvent,
  type LoginMethod,
} from "@/lib/supabase/login-events"
import { notifyAdminLoginSuccess } from "@/lib/security/login-alerts"

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

  if (code) {
    supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    justAuthenticated = !error
  }

  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin))
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
