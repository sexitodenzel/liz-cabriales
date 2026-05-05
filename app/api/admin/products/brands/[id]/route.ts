import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deleteAdminBrand, requireAdmin } from "@/lib/supabase/admin"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function mapResultStatus(code?: string): number {
  if (!code) return 200
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "NOT_FOUND") return 404
  if (code === "BRAND_HAS_PRODUCTS") return 409
  if (code === "BRANDS_TABLE_MISSING") return 500
  return 400
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: mapResultStatus(authResult.error.code) }
      )
    }

    const deleteResult = await deleteAdminBrand(id)
    return NextResponse.json(
      { data: deleteResult.data, error: deleteResult.error },
      { status: mapResultStatus(deleteResult.error?.code) }
    )
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
