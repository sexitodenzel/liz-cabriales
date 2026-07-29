import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  createHomeSpotlightItem,
  getAllHomeSpotlightItems,
  reorderHomeSpotlightItems,
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

  const result = await getAllHomeSpotlightItems()
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ data: result.data, error: null })
}

export async function POST(request: Request) {
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
  }

  if (typeof body.imageUrl !== "string" || !body.imageUrl.trim()) {
    return NextResponse.json(
      { data: null, error: { message: "La imagen es obligatoria", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await createHomeSpotlightItem({
    imageUrl: body.imageUrl,
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : null,
    label: typeof body.label === "string" ? body.label : null,
    linkHref: typeof body.linkHref === "string" ? body.linkHref : null,
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("home-spotlight", "max")
  return NextResponse.json({ data: result.data, error: null }, { status: 201 })
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

  const body = json as { orderedIds?: unknown }
  if (
    !Array.isArray(body.orderedIds) ||
    !body.orderedIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { data: null, error: { message: "orderedIds inválido", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await reorderHomeSpotlightItems(body.orderedIds as string[])
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("home-spotlight", "max")
  return NextResponse.json({ data: { ok: true }, error: null })
}
