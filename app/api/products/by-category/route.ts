import { NextResponse } from "next/server"

import { getProducts } from "@/lib/supabase/products"
import { applyDiscount } from "@/lib/tienda/discount"

export const dynamic = "force-dynamic"

const MAX_ITEMS = 4

type CategoryProduct = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
  originalPrice: number
  discountPercent: number
}

type ApiResponse =
  | { data: CategoryProduct[]; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url)
  // Acepta una o varias categorías separadas por coma (grupos del menú,
  // p. ej. Nail art = nail-art,decoracion,glitter…).
  const categorySlugs = (searchParams.get("categoria") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (categorySlugs.length === 0) {
    return NextResponse.json({ data: [], error: null })
  }

  const result = await getProducts({ categorySlugs })

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: { message: result.error.message, code: result.error.code },
      },
      { status: 500 }
    )
  }

  // Destacados primero; se completa con el resto para llenar el showcase.
  const ordered = [...result.data].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured)
  )

  const items: CategoryProduct[] = ordered.slice(0, MAX_ITEMS).map((product) => {
    const discountPercent = product.discount_percent ?? 0
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? null,
      price: applyDiscount(product.base_price, discountPercent),
      originalPrice: product.base_price,
      discountPercent,
    }
  })

  return NextResponse.json(
    { data: items, error: null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
