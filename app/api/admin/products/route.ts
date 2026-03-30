import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createAdminProduct,
  getAdminCategories,
  getAdminProducts,
  requireAdmin,
} from "@/lib/supabase/admin"
import { createProductSchema } from "@/lib/validations/products"

export async function GET() {
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

    const [productsResult, categoriesResult] = await Promise.all([
      getAdminProducts(),
      getAdminCategories(),
    ])

    if (productsResult.error) {
      return NextResponse.json(
        { data: null, error: productsResult.error },
        { status: 500 }
      )
    }

    if (categoriesResult.error) {
      return NextResponse.json(
        { data: null, error: categoriesResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        products: productsResult.data,
        categories: categoriesResult.data,
      },
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Error interno del servidor",
        },
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

    const json = await request.json()

    const parseResult = createProductSchema.safeParse(json)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Datos inválidos",
            code: "VALIDATION_ERROR",
            issues: parseResult.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const createResult = await createAdminProduct(parseResult.data)

    if (createResult.error) {
      return NextResponse.json(
        { data: null, error: createResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: createResult.data, error: null },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Error interno del servidor",
        },
      },
      { status: 500 }
    )
  }
}

