import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  createAdminBrand,
  getAdminBrandsWithProductCount,
  requireAdmin,
} from "@/lib/supabase/admin"
import { createBrandSchema } from "@/lib/validations/products"

function mapAuthStatus(code?: string): number {
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
        { status: mapAuthStatus(authResult.error.code) }
      )
    }

    const brandsResult = await getAdminBrandsWithProductCount()
    if (brandsResult.error) {
      return NextResponse.json(
        { data: null, error: brandsResult.error },
        { status: mapAuthStatus(brandsResult.error.code) }
      )
    }

    return NextResponse.json({
      data: brandsResult.data,
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
    const parsed = createBrandSchema.safeParse(json)

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

    const createResult = await createAdminBrand(parsed.data)
    if (createResult.error) {
      return NextResponse.json(
        { data: null, error: createResult.error },
        { status: mapAuthStatus(createResult.error.code) }
      )
    }

    revalidateTag("brands", "max")

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
