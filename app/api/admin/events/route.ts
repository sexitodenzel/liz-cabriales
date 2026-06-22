import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { createEvent, getAllEvents } from "@/lib/supabase/events-gallery"

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

  const result = await getAllEvents()
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: 500 })
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
    imageUrl?: unknown
    caption?: unknown
    eventDate?: unknown
    sortOrder?: unknown
  }

  if (typeof body.imageUrl !== "string" || !body.imageUrl.trim()) {
    return NextResponse.json(
      { data: null, error: { message: "La imagen es obligatoria", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const result = await createEvent({
    imageUrl: body.imageUrl,
    caption: typeof body.caption === "string" ? body.caption : null,
    eventDate: typeof body.eventDate === "string" ? body.eventDate : null,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  })

  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: mapStatus(result.error.code) }
    )
  }

  revalidateTag("liz-events", "max")

  return NextResponse.json({ data: result.data, error: null }, { status: 201 })
}
