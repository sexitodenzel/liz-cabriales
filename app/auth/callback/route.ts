import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeNextPath(value: string | null): string {
  if (!value) return "/"
  if (!value.startsWith("/") || value.startsWith("//")) return "/"
  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = sanitizeNextPath(
    requestUrl.searchParams.get("next") ?? requestUrl.searchParams.get("redirect")
  )

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  if (type === "invite" || type === "recovery") {
    return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin))
  }

  const redirectUrl = new URL(next, requestUrl.origin)
  return NextResponse.redirect(redirectUrl)
}
