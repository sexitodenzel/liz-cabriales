import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createAdminSubcategory,
  getAdminSubcategoriesWithProductCount,
  requireAdmin,
} from "@/lib/supabase/admin"
import { createSubcategorySchema } from "@/lib/validations/products"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "NOT_FOUND") return 404
  if (code === "DUPLICATE") return 409
  if (code === "SUBCATEGORIES_TABLE_MISSING") return 500
  return 400
}

export async function GET() {
  try {
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

    const result = await getAdminSubcategoriesWithProductCount()
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapStatus(result.error.code) }
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

export async function POST(request: Request) {
  try {
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
    const parsed = createSubcategorySchema.safeParse(json)
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

    const result = await createAdminSubcategory(parsed.data)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapStatus(result.error.code) }
      )
    }

    return NextResponse.json(
      { data: result.data, error: null },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
