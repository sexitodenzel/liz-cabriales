import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getAllLandingSlots, updateLandingSlot } from "@/lib/supabase/landing-slots"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: authResult.error }, { status })
    }

    const slots = await getAllLandingSlots()
    return NextResponse.json({ data: slots, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: authResult.error }, { status })
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

    const { key, url } = json as { key?: unknown; url?: unknown }
    if (typeof key !== "string" || !key || typeof url !== "string") {
      return NextResponse.json(
        { data: null, error: { message: "key y url son requeridos", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const result = await updateLandingSlot(key, url)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: { message: result.error } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
