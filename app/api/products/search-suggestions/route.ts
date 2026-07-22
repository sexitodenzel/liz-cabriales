import { NextResponse, type NextRequest } from "next/server"

import {
  buildSupabaseOrFilter,
  normalizeSearchText,
  tokenizeSearchQuery,
} from "@/lib/search-text"
import { createClient } from "@/lib/supabase/server"
import { applyDiscount } from "@/lib/tienda/discount"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Búsqueda pública de alto volumen: límite generoso por IP para frenar bots
// que enumeren el catálogo sin afectar a usuarios reales.
const RATE_LIMIT_PER_MINUTE = 120

type ProductSuggestion = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
  originalPrice: number
  discountPercent: number
}

type BrandSuggestion = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  href: string
}

type CategorySuggestion = {
  id: string
  label: string
  href: string
  isSubcategory: boolean
}

type ApiResponse =
  | {
      data: {
        products: ProductSuggestion[]
        brands: BrandSuggestion[]
        categories: CategorySuggestion[]
      }
      error: null
    }
  | { data: null; error: { message: string; code?: string } }

function scoreProduct(
  product: {
    name: string
    slug: string
    description: string | null
    brand: string | null
    subcategory: string | null
    search_synonyms: string | null
  },
  tokens: string[]
): number {
  const name = normalizeSearchText(product.name)
  const slug = normalizeSearchText(product.slug)
  const desc = product.description ? normalizeSearchText(product.description) : ""
  const brand = product.brand ? normalizeSearchText(product.brand) : ""
  const sub = product.subcategory ? normalizeSearchText(product.subcategory) : ""
  const syn = product.search_synonyms
    ? normalizeSearchText(product.search_synonyms)
    : ""

  let score = 0
  for (const t of tokens) {
    if (name === t) score += 10
    else if (name.startsWith(t)) score += 6
    else if (name.includes(t)) score += 4

    if (slug === t) score += 4
    else if (slug.includes(t)) score += 2

    if (syn.includes(t)) score += 5
    if (brand.includes(t)) score += 3
    if (sub.includes(t)) score += 2
    if (desc.includes(t)) score += 1
  }
  return score
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const rate = checkRateLimit(
    `search-suggestions:${getClientIp(request)}`,
    RATE_LIMIT_PER_MINUTE,
    60_000
  )
  if (!rate.allowed) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Demasiadas búsquedas. Espera un momento.",
          code: "RATE_LIMITED",
        },
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const tokens = tokenizeSearchQuery(q)

  if (q.length < 2 || tokens.length === 0) {
    return NextResponse.json({
      data: { products: [], brands: [], categories: [] },
      error: null,
    })
  }

  const supabase = await createClient()

  const productFilter = buildSupabaseOrFilter(tokens, [
    "name",
    "slug",
    "description",
    "long_description",
    "brand",
    "subcategory",
    "search_synonyms",
  ])

  // Match estricto (sin prefijo de 3 chars) para marcas/categorías:
  // así "cardone" no trae Podocare por contener "car".
  const tableFilter = tokens
    .flatMap((t) => [`name.ilike.%${t}%`, `slug.ilike.%${t}%`])
    .join(",")

  const [productsRes, brandsRes, categoriesRes, subcategoriesRes] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, base_price, discount_percent, images, brand, subcategory, description, search_synonyms"
        )
        .eq("is_active", true)
        .is("deleted_at", null)
        .or(productFilter)
        .limit(60),
      supabase
        .from("brands")
        .select("id, name, slug, logo_url")
        .or(tableFilter)
        .limit(8),
      supabase
        .from("categories")
        .select("id, name, slug")
        .or(tableFilter)
        .limit(6),
      supabase
        .from("subcategories")
        .select("id, name, slug, category:categories(slug)")
        .or(tableFilter)
        .limit(6),
    ])

  if (productsRes.error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message:
            productsRes.error.message ?? "No se pudieron cargar sugerencias",
          code: productsRes.error.code,
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
    discount_percent?: number | string | null
    images: string[] | null
    brand: string | null
    subcategory: string | null
    description: string | null
    search_synonyms: string | null
  }

  const rankedProducts = ((productsRes.data ?? []) as ProductRow[])
    .map((item) => {
      const basePrice = Number(item.base_price)
      const discountPercent = Number(item.discount_percent ?? 0)
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        image: item.images?.[0] ?? null,
        price: applyDiscount(basePrice, discountPercent),
        originalPrice: basePrice,
        discountPercent,
        _score: scoreProduct(item, tokens),
      }
    })
    .filter((item) => item.slug && item._score > 0)
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name, "es"))
    .slice(0, 8)
    .map(({ _score, ...item }) => item)

  type BrandRow = { id: string; name: string; slug: string; logo_url: string | null }
  const brands: BrandSuggestion[] = ((brandsRes.data ?? []) as BrandRow[])
    .slice(0, 4)
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url ?? null,
      href: `/tienda?marca=${encodeURIComponent(b.name)}`,
    }))

  type SubRow = {
    id: string
    name: string
    slug: string
    category: { slug: string } | { slug: string }[] | null
  }
  const subcategories: CategorySuggestion[] = (
    (subcategoriesRes.data ?? []) as SubRow[]
  )
    .map((s) => {
      const cat = Array.isArray(s.category) ? s.category[0] : s.category
      if (!cat?.slug) return null
      return {
        id: s.id,
        label: s.name,
        href: `/tienda?categoria=${cat.slug}&subcategoria=${s.slug}`,
        isSubcategory: true,
      }
    })
    .filter((s): s is CategorySuggestion => s !== null)

  type CatRow = { id: string; name: string; slug: string }
  const topLevel: CategorySuggestion[] = (
    (categoriesRes.data ?? []) as CatRow[]
  ).map((c) => ({
    id: c.id,
    label: c.name,
    href: `/tienda?categoria=${c.slug}`,
    isSubcategory: false,
  }))

  const categories: CategorySuggestion[] = [...topLevel, ...subcategories].slice(
    0,
    6
  )

  return NextResponse.json({
    data: { products: rankedProducts, brands, categories },
    error: null,
  })
}
