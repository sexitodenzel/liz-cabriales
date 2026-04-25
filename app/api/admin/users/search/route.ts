import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"

/**
 * Búsqueda de usuarios para el admin (autocompletar al crear cita manual).
 * GET /api/admin/users/search?q=...
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdminOrReceptionist(user?.id)
    if (authResult.error) {
      const status =
        authResult.error.code === "UNAUTHENTICATED"
          ? 401
          : authResult.error.code === "FORBIDDEN"
            ? 403
            : 400
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status }
      )
    }

    const q = (request.nextUrl.searchParams.get("q") ?? "").trim()
    if (q.length < 2) {
      return NextResponse.json({ data: { users: [] }, error: null })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const likeExpr = `%${q}%`
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email")
      .or(
        `email.ilike.${likeExpr},first_name.ilike.${likeExpr},last_name.ilike.${likeExpr}`
      )
      .limit(10)

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: error.code } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { users: data ?? [] },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/users/search] Error inesperado:", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
