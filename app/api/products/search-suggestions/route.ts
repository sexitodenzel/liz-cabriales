import { NextResponse } from "next/server"

import {
  buildSupabaseOrFilter,
  scoreSearchMatch,
  tokenizeSearchQuery,
} from "@/lib/search-text"
import { createClient } from "@/lib/supabase/server"

type ProductSuggestion = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
}

type CategorySuggestion = {
  id: string
  name: string
  slug: string
}

type ApiResponse =
  | {
      data: {
        products: ProductSuggestion[]
        categories: CategorySuggestion[]
      }
      error: null
    }
  | { data: null; error: { message: string; code?: string } }

export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const tokens = tokenizeSearchQuery(q)

  if (q.length < 2 || tokens.length === 0) {
    return NextResponse.json({
      data: { products: [], categories: [] },
      error: null,
    })
  }

  const supabase = await createClient()
  const productFilter = buildSupabaseOrFilter(tokens, ["name", "slug"])
  const categoryFilter = buildSupabaseOrFilter(tokens, ["name", "slug"])

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, base_price, images")
      .eq("is_active", true)
      .is("deleted_at", null)
      .or(productFilter)
      .order("name", { ascending: true })
      .limit(40),
    supabase
      .from("categories")
      .select("id, name, slug")
      .or(categoryFilter)
      .order("name", { ascending: true })
      .limit(30),
  ])

  if (productsResult.error || categoriesResult.error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message:
            productsResult.error?.message ??
            categoriesResult.error?.message ??
            "No se pudieron cargar sugerencias",
          code: productsResult.error?.code ?? categoriesResult.error?.code,
        },
      },
      { status: 500 }
    )
  }

  type ProductRow = {
    id: string
    name: string
    slug: string
    base_price: number | string
    images: string[] | null
  }

  const rankedProducts = ((productsResult.data ?? []) as ProductRow[])
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      image: item.images?.[0] ?? null,
      price: Number(item.base_price),
      _score: scoreSearchMatch(item.name, tokens, item.slug),
    }))
    .filter((item) => item.slug && item._score > 0)
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name, "es"))
    .slice(0, 8)
    .map(({ _score, ...item }) => item)

  const rankedCategories = ((categoriesResult.data ?? []) as CategorySuggestion[])
    .map((item) => ({
      ...item,
      _score: scoreSearchMatch(item.name, tokens, item.slug),
    }))
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name, "es"))
    .slice(0, 6)
    .map(({ _score, ...item }) => item)

  return NextResponse.json({
    data: {
      products: rankedProducts,
      categories: rankedCategories,
    },
    error: null,
  })
}
