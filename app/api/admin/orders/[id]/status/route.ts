import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { updateAdminOrderStatusById } from "@/lib/supabase/adminOrders"
import { requireAdmin } from "@/lib/supabase/admin"
import { adminOrderStatusPatchSchema } from "@/lib/validations/adminOrders"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
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

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Cuerpo de la petición inválido",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const parseResult = adminOrderStatusPatchSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Datos inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const updateResult = await updateAdminOrderStatusById(
      id,
      parseResult.data.status
    )

    if (updateResult.error) {
      return NextResponse.json(
        { data: null, error: updateResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { message: "Error interno del servidor" },
      },
      { status: 500 }
    )
  }
}
