import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getAllLandingSlots, updateLandingSlot } from "@/lib/supabase/landing-slots"

const VALID_LINK_TYPES = ["none", "product", "course", "services", "custom"] as const

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

    const { key, url, link_type, link_value, cta_label, cta_subtext } = json as {
      key?: unknown
      url?: unknown
      link_type?: unknown
      link_value?: unknown
      cta_label?: unknown
      cta_subtext?: unknown
    }

    if (typeof key !== "string" || !key) {
      return NextResponse.json(
        { data: null, error: { message: "key es requerido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if (url === undefined && link_type === undefined && link_value === undefined && cta_label === undefined && cta_subtext === undefined) {
      return NextResponse.json(
        { data: null, error: { message: "Se requiere al menos un campo para actualizar", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if (url !== undefined && typeof url !== "string") {
      return NextResponse.json(
        { data: null, error: { message: "url debe ser string", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if (link_type !== undefined && !VALID_LINK_TYPES.includes(link_type as typeof VALID_LINK_TYPES[number])) {
      return NextResponse.json(
        { data: null, error: { message: "link_type inválido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const fields: { url?: string; link_type?: string; link_value?: string; cta_label?: string; cta_subtext?: string } = {}
    if (typeof url === "string") fields.url = url
    if (typeof link_type === "string") fields.link_type = link_type
    if (typeof link_value === "string") fields.link_value = link_value
    if (typeof cta_label === "string") fields.cta_label = cta_label
    if (typeof cta_subtext === "string") fields.cta_subtext = cta_subtext

    const result = await updateLandingSlot(key, fields)
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
