import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  getHomeSpotlightSettingsAdmin,
  updateHomeSpotlightSettings,
} from "@/lib/supabase/home-spotlight"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

async function guard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdmin(user?.id)
}

export async function GET() {
  const authResult = await guard()
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  const result = await getHomeSpotlightSettingsAdmin()
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ data: result.data, error: null })
}

export async function PATCH(request: Request) {
  const authResult = await guard()
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Cuerpo inválido", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const body = json as Record<string, unknown>
  const pick = (k: string) =>
    typeof body[k] === "string" ? (body[k] as string) : undefined

  const result = await updateHomeSpotlightSettings({
    eyebrow: pick("eyebrow"),
    title: pick("title"),
    subtitle: pick("subtitle"),
    body: pick("body"),
    cta_label: pick("cta_label"),
    cta_href: pick("cta_href"),
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("home-spotlight", "max")
  return NextResponse.json({ data: result.data, error: null })
}
