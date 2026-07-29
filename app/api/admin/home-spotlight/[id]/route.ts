import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  deleteHomeSpotlightItem,
  updateHomeSpotlightItem,
} from "@/lib/supabase/home-spotlight"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

type Ctx = { params: Promise<{ id: string }> }

async function guard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdmin(user?.id)
}

export async function PATCH(request: Request, { params }: Ctx) {
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

  const body = json as {
    imageUrl?: unknown
    avatarUrl?: unknown
    label?: unknown
    linkHref?: unknown
    isActive?: unknown
  }

  const { id } = await params
  const result = await updateHomeSpotlightItem(id, {
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
    label: typeof body.label === "string" ? body.label : undefined,
    linkHref: typeof body.linkHref === "string" ? body.linkHref : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
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

export async function DELETE(_request: Request, { params }: Ctx) {
  const authResult = await guard()
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  const { id } = await params
  const result = await deleteHomeSpotlightItem(id)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("home-spotlight", "max")
  return NextResponse.json({ data: { ok: true }, error: null })
}
