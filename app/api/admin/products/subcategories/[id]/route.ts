import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  deleteAdminSubcategory,
  requireAdmin,
  updateAdminSubcategory,
} from "@/lib/supabase/admin"
import { updateSubcategorySchema } from "@/lib/validations/products"

type RouteContext = {
  params: Promise<{ id: string }>
}

function mapStatus(code?: string): number {
  if (!code) return 200
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "NOT_FOUND") return 404
  if (code === "SUBCATEGORY_HAS_PRODUCTS") return 409
  if (code === "DUPLICATE") return 409
  return 400
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
        { status: mapStatus(authResult.error.code) }
      )
    }

    const json = await request.json()
    const parsed = updateSubcategorySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Datos inválidos",
            code: "VALIDATION_ERROR",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const result = await updateAdminSubcategory(id, parsed.data)
    return NextResponse.json(
      { data: result.data, error: result.error },
      { status: mapStatus(result.error?.code) }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
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
        { status: mapStatus(authResult.error.code) }
      )
    }

    const result = await deleteAdminSubcategory(id)
    return NextResponse.json(
      { data: result.data, error: result.error },
      { status: mapStatus(result.error?.code) }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
