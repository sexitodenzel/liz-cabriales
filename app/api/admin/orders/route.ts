import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getAdminOrdersPaginated } from "@/lib/supabase/adminOrders"
import { requireAdmin } from "@/lib/supabase/admin"
import { adminOrdersQuerySchema } from "@/lib/validations/adminOrders"

export async function GET(request: NextRequest) {
  try {
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

    const sp = request.nextUrl.searchParams
    const parseResult = adminOrdersQuerySchema.safeParse({
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      status: sp.get("status") ?? undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Parámetros de consulta inválidos",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const { page, limit, status } = parseResult.data
    const statusFilter = status

    const listResult = await getAdminOrdersPaginated(page, limit, statusFilter)

    if (listResult.error) {
      return NextResponse.json(
        { data: null, error: listResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        orders: listResult.data.orders,
        total: listResult.data.total,
        page,
        limit,
      },
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
