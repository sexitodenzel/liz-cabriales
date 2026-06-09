import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  requireAdmin,
  updateAdminProductVariant,
  deleteAdminProductVariant,
} from "@/lib/supabase/admin"
import { updateVariantSchema } from "@/lib/validations/products"

type RouteContext = {
  params: Promise<{ id: string; variantId: string }>
}

function mapCode(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "NOT_FOUND") return 404
  return 400
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { variantId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: mapCode(authResult.error.code) }
      )
    }

    const json = await request.json()
    const parseResult = updateVariantSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { message: "Datos inválidos", code: "VALIDATION_ERROR", issues: parseResult.error.issues } },
        { status: 400 }
      )
    }

    const result = await updateAdminProductVariant(variantId, parseResult.data)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapCode(result.error.code) }
      )
    }

    return NextResponse.json({ data: result.data, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { variantId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: mapCode(authResult.error.code) }
      )
    }

    const result = await deleteAdminProductVariant(variantId)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapCode(result.error.code) }
      )
    }

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
