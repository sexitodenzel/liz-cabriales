import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"

const SEARCH_LIMIT = 10
const MAX_QUERY_LENGTH = 80

type UserSearchRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

function normalizeSearchQuery(value: string) {
  return value.trim().slice(0, MAX_QUERY_LENGTH)
}

function escapeIlikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

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

    const q = normalizeSearchQuery(request.nextUrl.searchParams.get("q") ?? "")
    if (q.length < 2) {
      return NextResponse.json({ data: { users: [] }, error: null })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const likeExpr = `%${escapeIlikePattern(q)}%`
    const [emailResult, firstNameResult, lastNameResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email")
        .ilike("email", likeExpr)
        .limit(SEARCH_LIMIT),
      supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email")
        .ilike("first_name", likeExpr)
        .limit(SEARCH_LIMIT),
      supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email")
        .ilike("last_name", likeExpr)
        .limit(SEARCH_LIMIT),
    ])

    const error = emailResult.error ?? firstNameResult.error ?? lastNameResult.error

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: error.code } },
        { status: 500 }
      )
    }

    const usersById = new Map<string, UserSearchRow>()
    for (const row of [
      ...(emailResult.data ?? []),
      ...(firstNameResult.data ?? []),
      ...(lastNameResult.data ?? []),
    ] as UserSearchRow[]) {
      usersById.set(row.id, row)
      if (usersById.size >= SEARCH_LIMIT) break
    }

    return NextResponse.json({
      data: { users: Array.from(usersById.values()) },
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
