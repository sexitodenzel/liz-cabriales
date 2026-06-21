import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  createAdminProduct,
  getAdminCategories,
  getAdminProducts,
  requireAdmin,
} from "@/lib/supabase/admin"
import { createProductSchema } from "@/lib/validations/products"

function mapResultStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "BRANDS_TABLE_MISSING") return 500
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
        { status: mapResultStatus(authResult.error.code) }
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
  } catch {
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
      return NextResponse.json(
        { data: null, error: authResult.error },
        { status: mapResultStatus(authResult.error.code) }
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
        { status: mapResultStatus(createResult.error.code) }
      )
    }

    revalidateTag("products", "max")
    revalidateTag("best-sellers", "max")

    return NextResponse.json(
      { data: createResult.data, error: null },
      { status: 201 }
    )
  } catch {
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

