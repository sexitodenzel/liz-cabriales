import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type GalleryInput = {
  type: "image" | "video"
  url: string
  thumbnail_url?: string | null
  caption?: string | null
  position: number
  is_cover?: boolean
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdmin(user?.id)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await assertAdmin()
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: authResult.error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from("course_gallery")
      .select("*")
      .eq("course_id", id)
      .order("position", { ascending: true })

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { items: data ?? [] }, error: null })
  } catch (err) {
    console.error("[api/admin/courses/[id]/gallery GET]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await assertAdmin()
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: authResult.error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    const { id } = await params
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Cuerpo inválido" } },
        { status: 400 }
      )
    }

    const items: GalleryInput[] =
      (body as { items?: GalleryInput[] }).items ?? []

    const { error: deleteError } = await supabaseAdmin
      .from("course_gallery")
      .delete()
      .eq("course_id", id)

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: { message: deleteError.message } },
        { status: 500 }
      )
    }

    if (items.length > 0) {
      // Solo una foto puede ser portada de galería (la primera marcada gana)
      const coverIdx = items.findIndex(
        (item) => item.type === "image" && item.is_cover
      )
      const rows = items.map((item, i) => ({
        course_id: id,
        type: item.type,
        url: item.url,
        thumbnail_url: item.thumbnail_url ?? null,
        caption: item.caption || null,
        position: i,
        is_cover: i === coverIdx,
      }))
      let { error: insertError } = await supabaseAdmin
        .from("course_gallery")
        .insert(rows)

      // Si la columna is_cover aún no existe, reintenta sin ella para no
      // perder la galería (el delete de arriba ya se ejecutó).
      if (insertError && /is_cover/.test(insertError.message)) {
        const legacyRows = rows.map(({ is_cover: _isCover, ...rest }) => rest)
        ;({ error: insertError } = await supabaseAdmin
          .from("course_gallery")
          .insert(legacyRows))
      }

      if (insertError) {
        return NextResponse.json(
          { data: null, error: { message: insertError.message } },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/courses/[id]/gallery PUT]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
