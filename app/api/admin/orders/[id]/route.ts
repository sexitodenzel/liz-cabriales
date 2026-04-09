import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getAdminOrderById } from "@/lib/supabase/adminOrders"
import { requireAdmin } from "@/lib/supabase/admin"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
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

    const orderResult = await getAdminOrderById(id)

    if (orderResult.error) {
      const httpStatus =
        orderResult.error.code === "NOT_FOUND" ? 404 : 500
      return NextResponse.json(
        { data: null, error: orderResult.error },
        { status: httpStatus }
      )
    }

    return NextResponse.json({
      data: { order: orderResult.data },
      error: null,
    })
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
