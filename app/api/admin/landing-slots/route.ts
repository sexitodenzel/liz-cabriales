import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

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

    const { key, label, url } = json as {
      key?: unknown; label?: unknown; url?: unknown
    }

    if (typeof key !== "string" || !key) {
      return NextResponse.json(
        { data: null, error: { message: "key es requerido", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if ([label, url].every(v => v === undefined)) {
      return NextResponse.json(
        { data: null, error: { message: "Se requiere al menos un campo para actualizar", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if (label !== undefined && typeof label !== "string") {
      return NextResponse.json(
        { data: null, error: { message: "label debe ser string", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    if (url !== undefined && typeof url !== "string") {
      return NextResponse.json(
        { data: null, error: { message: "url debe ser string", code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const fields: { label?: string; url?: string } = {}
    if (typeof label === "string") fields.label = label
    if (typeof url === "string") fields.url = url

    const result = await updateLandingSlot(key, fields)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: { message: result.error } },
        { status: 500 }
      )
    }

    revalidatePath("/")
    revalidatePath("/servicios")
    revalidatePath("/academia")
    revalidatePath("/blog")
    revalidateTag("landing-slots", "max")

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

