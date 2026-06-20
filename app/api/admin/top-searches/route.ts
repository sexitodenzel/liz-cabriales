import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { createTopSearch, getAllTopSearches } from "@/lib/supabase/top-searches"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authResult = await requireAdmin(user?.id)
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  const result = await getAllTopSearches()
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: result.data, error: null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authResult = await requireAdmin(user?.id)
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

  const body = json as {
    label?: unknown
    href?: unknown
    position?: unknown
    isEnabled?: unknown
  }

  if (typeof body.label !== "string" || !body.label.trim()) {
    return NextResponse.json(
      { data: null, error: { message: "El término es obligatorio", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await createTopSearch({
    label: body.label,
    href: typeof body.href === "string" ? body.href : null,
    position: typeof body.position === "number" ? body.position : undefined,
    isEnabled: typeof body.isEnabled === "boolean" ? body.isEnabled : undefined,
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("top-searches")

  return NextResponse.json({ data: result.data, error: null }, { status: 201 })
}
