import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createAdminCategory,
  getAdminCategoriesWithProductCount,
  requireAdmin,
} from "@/lib/supabase/admin"
import { createCategorySchema } from "@/lib/validations/products"

function mapAuthStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
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
        { status: mapAuthStatus(authResult.error.code) }
      )
    }

    const categoriesResult = await getAdminCategoriesWithProductCount()
    if (categoriesResult.error) {
      return NextResponse.json(
        { data: null, error: categoriesResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: categoriesResult.data,
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
        { status: mapAuthStatus(authResult.error.code) }
      )
    }

    const json = await request.json()
    const parsed = createCategorySchema.safeParse(json)

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

    const createResult = await createAdminCategory(parsed.data)
    if (createResult.error) {
      return NextResponse.json(
        { data: null, error: createResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: createResult.data, error: null }, { status: 201 })
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
