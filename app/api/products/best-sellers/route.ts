import { NextResponse } from "next/server"

import { getBestSellersCached } from "@/lib/supabase/cache"
import { applyDiscount } from "@/lib/tienda/discount"

export const dynamic = "force-dynamic"

const MAX_BEST_SELLERS = 6

type BestSellerItem = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
  originalPrice: number
  discountPercent: number
}

type ApiResponse =
  | { data: BestSellerItem[]; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const result = await getBestSellersCached()

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: { message: result.error.message, code: result.error.code },
      },
      { status: 500 }
    )
  }

  const items: BestSellerItem[] = result.data
    .slice(0, MAX_BEST_SELLERS)
    .map((product) => {
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
