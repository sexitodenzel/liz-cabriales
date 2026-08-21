import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  createBeforeAfterItem,
  getAllBeforeAfterItems,
  reorderBeforeAfterItems,
} from "@/lib/supabase/before-after"

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

  const result = await getAllBeforeAfterItems()
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
    beforeImageUrl?: unknown
    afterImageUrl?: unknown
    serviceLabel?: unknown
    caption?: unknown
  }

  if (typeof body.beforeImageUrl !== "string" || !body.beforeImageUrl.trim()) {
    return NextResponse.json(
      { data: null, error: { message: "La imagen de 'antes' es obligatoria", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }
  if (typeof body.afterImageUrl !== "string" || !body.afterImageUrl.trim()) {
    return NextResponse.json(
      { data: null, error: { message: "La imagen de 'después' es obligatoria", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await createBeforeAfterItem({
    beforeImageUrl: body.beforeImageUrl,
    afterImageUrl: body.afterImageUrl,
    serviceLabel: typeof body.serviceLabel === "string" ? body.serviceLabel : null,
    caption: typeof body.caption === "string" ? body.caption : null,
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("before-after", "max")
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

  const result = await reorderBeforeAfterItems(body.orderedIds as string[])
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("before-after", "max")
  return NextResponse.json({ data: { ok: true }, error: null })
}
