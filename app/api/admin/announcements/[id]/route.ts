import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { deleteAnnouncement, updateAnnouncement } from "@/lib/supabase/announcements"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
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

  const { id } = await params

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

  const patch: {
    label?: string
    href?: string | null
    position?: number
    isEnabled?: boolean
  } = {}

  if (typeof body.label === "string") patch.label = body.label
  if (typeof body.href === "string" || body.href === null) patch.href = (body.href as string | null) ?? null
  if (typeof body.position === "number") patch.position = body.position
  if (typeof body.isEnabled === "boolean") patch.isEnabled = body.isEnabled

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { data: null, error: { message: "Sin cambios", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await updateAnnouncement(id, patch)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("announcements", "max")

  return NextResponse.json({ data: result.data, error: null })
}

export async function DELETE(_request: Request, { params }: Ctx) {
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

  const { id } = await params
  const result = await deleteAnnouncement(id)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("announcements", "max")

  return NextResponse.json({ data: { ok: true }, error: null })
}
