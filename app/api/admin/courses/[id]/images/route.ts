import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ImageInput = {
  image_url: string
  is_cover: boolean
  position: number
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
      .from("course_images")
      .select("id, image_url, is_cover, position, created_at")
      .eq("course_id", id)
      .order("position", { ascending: true })

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { images: data ?? [] }, error: null })
  } catch (err) {
    console.error("[api/admin/courses/[id]/images GET]", err)
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

    const images: ImageInput[] =
      (body as { images?: ImageInput[] }).images ?? []

    const { error: deleteError } = await supabaseAdmin
      .from("course_images")
      .delete()
      .eq("course_id", id)

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: { message: deleteError.message } },
        { status: 500 }
      )
    }

    if (images.length > 0) {
      const rows = images.map((img, i) => ({
        course_id: id,
        image_url: img.image_url,
        is_cover: img.is_cover,
        position: i,
      }))
      const { error: insertError } = await supabaseAdmin
        .from("course_images")
        .insert(rows)

      if (insertError) {
        return NextResponse.json(
          { data: null, error: { message: insertError.message } },
          { status: 500 }
        )
      }
    }

    const coverUrl =
      images.find((img) => img.is_cover)?.image_url ??
      images[0]?.image_url ??
      null

    await supabaseAdmin
      .from("courses")
      .update({ cover_image: coverUrl, updated_at: new Date().toISOString() })
      .eq("id", id)

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/courses/[id]/images PUT]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
