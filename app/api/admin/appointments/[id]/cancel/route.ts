import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { adminCancelAppointment } from "@/lib/supabase/appointments"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

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

    const result = await adminCancelAppointment(id)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    console.error("[api/admin/appointments/cancel] Error inesperado:", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
