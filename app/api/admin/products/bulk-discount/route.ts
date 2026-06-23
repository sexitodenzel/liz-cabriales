import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  bulkUpdateProductsDiscount,
  requireAdmin,
} from "@/lib/supabase/admin"

function mapResultStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
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

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          data: null,
          error: { message: "JSON inválido", code: "VALIDATION_ERROR" },
        },
        { status: 400 }
      )
    }

    const productIds = (body as { productIds?: unknown }).productIds
    const discountPercent = Number(
      (body as { discountPercent?: unknown }).discountPercent
    )

    if (
      !Array.isArray(productIds) ||
      productIds.some((id) => typeof id !== "string" || id.length === 0)
    ) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "productIds debe ser un arreglo de IDs",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    const result = await bulkUpdateProductsDiscount(
      productIds as string[],
      discountPercent
    )

    if (result.error) {
      return NextResponse.json(
        { data: null, error: result.error },
        { status: mapResultStatus(result.error.code) }
      )
    }

    revalidateTag("products", "max")
    revalidateTag("best-sellers", "max")
    revalidateTag("on-sale", "max")

    return NextResponse.json({ data: result.data, error: null })
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
