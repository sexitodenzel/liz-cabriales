import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { deleteAdminBrand, requireAdmin, updateAdminBrand } from "@/lib/supabase/admin"
import { updateBrandSchema } from "@/lib/validations/products"

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
        { status: mapResultStatus(authResult.error.code) }
      )
    }

    const json = await request.json()
    const parsed = updateBrandSchema.safeParse(json)
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

    const updateResult = await updateAdminBrand(id, {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl,
      showOnHome: parsed.data.showOnHome,
    })

    if (!updateResult.error) {
      revalidateTag("brands")
    }

    return NextResponse.json(
      { data: updateResult.data, error: updateResult.error },
      { status: mapResultStatus(updateResult.error?.code) }
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
        { status: mapResultStatus(authResult.error.code) }
      )
    }

    const deleteResult = await deleteAdminBrand(id)

    if (!deleteResult.error) {
      revalidateTag("brands")
    }

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
