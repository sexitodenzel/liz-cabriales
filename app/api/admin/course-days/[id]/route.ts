import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { deleteBlockedSlot, updateCourseDay } from "@/lib/supabase/appointments"

type RouteContext = { params: Promise<{ id: string }> }

function errorResponse(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status })
}

async function getAuth(userId?: string) {
  return requireAdminOrReceptionist(userId)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await getAuth(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return errorResponse(authResult.error.message, status)
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400)
    }

    const body = json as { start_time?: string; end_time?: string }
    if (!body.start_time || !body.end_time) {
      return errorResponse("start_time y end_time son requeridos", 400)
    }

    const result = await updateCourseDay(id, body.start_time, body.end_time)
    if (!result.data) {
      return errorResponse(result.error.message, 500)
    }

    return NextResponse.json({ data: { course_day: result.data }, error: null })
  } catch (err) {
    console.error("[api/admin/course-days PATCH]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await getAuth(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: authResult.error }, { status })
    }

    const result = await deleteBlockedSlot(id)
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/course-days DELETE]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
