import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return requireAdmin(user?.id)
}

export async function PATCH(
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

    const { name, title, bio, photo_url } = body as {
      name?: string
      title?: string | null
      bio?: string | null
      photo_url?: string | null
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { data: null, error: { message: "El nombre es obligatorio" } },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("instructors")
      .update({
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio || null,
        photo_url: photo_url || null,
      })
      .eq("id", id)
      .select("id, name, title, bio, photo_url, created_at")
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: error?.message ?? "No se pudo actualizar el instructor",
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { instructor: data }, error: null })
  } catch (err) {
    console.error("[api/admin/instructors/[id] PATCH]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { error } = await supabaseAdmin
      .from("instructors")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/instructors/[id] DELETE]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
