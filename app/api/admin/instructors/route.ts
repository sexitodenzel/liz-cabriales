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

export async function GET() {
  try {
    const authResult = await assertAdmin()
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: authResult.error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("instructors")
      .select("id, name, bio, photo_url, created_at")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { instructors: data ?? [] }, error: null })
  } catch (err) {
    console.error("[api/admin/instructors GET]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await assertAdmin()
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: authResult.error.code === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Cuerpo inválido" } },
        { status: 400 }
      )
    }

    const { name, bio, photo_url } = body as {
      name?: string
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
      .insert({ name: name.trim(), bio: bio || null, photo_url: photo_url || null })
      .select("id, name, bio, photo_url, created_at")
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          data: null,
          error: { message: error?.message ?? "No se pudo crear el instructor" },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { instructor: data }, error: null }, { status: 201 })
  } catch (err) {
    console.error("[api/admin/instructors POST]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
