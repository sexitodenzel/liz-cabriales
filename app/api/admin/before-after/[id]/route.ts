import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  deleteBeforeAfterItem,
  updateBeforeAfterItem,
} from "@/lib/supabase/before-after"

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
    beforeImageUrl?: unknown
    afterImageUrl?: unknown
    serviceLabel?: unknown
    caption?: unknown
    isActive?: unknown
  }

  const { id } = await params
  const result = await updateBeforeAfterItem(id, {
    beforeImageUrl: typeof body.beforeImageUrl === "string" ? body.beforeImageUrl : undefined,
    afterImageUrl: typeof body.afterImageUrl === "string" ? body.afterImageUrl : undefined,
    serviceLabel: typeof body.serviceLabel === "string" ? body.serviceLabel : undefined,
    caption: typeof body.caption === "string" ? body.caption : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("before-after", "max")
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
  const result = await deleteBeforeAfterItem(id)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("before-after", "max")
  return NextResponse.json({ data: { ok: true }, error: null })
}
