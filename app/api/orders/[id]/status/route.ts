import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

type ApiError = { message: string; code?: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Estado de una orden — usado por la pantalla de checkout para sondear el
 * resultado del pago (que confirma el webhook de MercadoPago) mientras el
 * usuario paga en la pestaña de MercadoPago. Solo el dueño de la orden puede
 * consultarla.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ status: string }>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado", code: "UNAUTHORIZED" } },
        { status: 401 }
      )
    }

    const { id: orderId } = await params

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: error.code } },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { data: null, error: { message: "Orden no encontrada", code: "NOT_FOUND" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: { status: (data as { status: string }).status },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
