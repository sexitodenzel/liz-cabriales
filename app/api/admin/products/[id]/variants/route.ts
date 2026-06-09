import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  requireAdmin,
  getAdminProductVariants,
  createAdminProductVariant,
} from "@/lib/supabase/admin"
import { createVariantSchema } from "@/lib/validations/products"

type RouteContext = {
  params: Promise<{ id: string }>
}

function mapCode(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "NOT_FOUND") return 404
  return 400
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: mapCode(authResult.error.code) }
      )
    }

    const result = await getAdminProductVariants(id)
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ data: result.data, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
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
    const parseResult = createVariantSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { message: "Datos inválidos", code: "VALIDATION_ERROR", issues: parseResult.error.issues } },
        { status: 400 }
      )
    }

    const result = await createAdminProductVariant(id, parseResult.data)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapCode(result.error.code) }
      )
    }

    return NextResponse.json({ data: result.data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
