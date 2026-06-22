import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeNextPath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//")) return null
  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = sanitizeNextPath(
    requestUrl.searchParams.get("next") ?? requestUrl.searchParams.get("redirect")
  )
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null

  if (code) {
    supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin))
  }

  if (next) {
    const redirectUrl = new URL(next, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  const authClient = supabase ?? await createClient()
  const { data: { user } } = await authClient.auth.getUser()

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
