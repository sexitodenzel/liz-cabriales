import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"
import type { ProductWithCategory } from "@/lib/supabase/products"

type CategoryRow = { id: string; name: string; slug: string }
type VariantRow = {
  id: string
  product_id: string
  sku: string
  variant_name: string
  price: number | string
  stock: number | string
  is_active: boolean
}

type RawRow = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  base_price: number | string
  images: string[] | null
  desktop_image_mode?: string | null
  brand: string | null
  abrasivity?: string | null
  is_featured: boolean
  is_best_seller?: boolean | null
  is_active: boolean
  updated_at?: string | null
  created_at?: string | null
  categories?: CategoryRow | CategoryRow[] | null
  product_variants?: VariantRow | VariantRow[] | null
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function normalizeAbrasivity(
  value: string | null | undefined
): AbrasivityValue | null {
  return isAbrasivityValue(value) ? value : null
}

function mapRow(row: RawRow): ProductWithCategory | null {
  const cat = unwrap(row.categories)
  if (!cat?.id) return null

  const rawVariants = row.product_variants
  const variantRows = Array.isArray(rawVariants)
    ? rawVariants
    : rawVariants
      ? [rawVariants]
      : []

  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    base_price: Number(row.base_price),
    images: row.images ?? null,
    desktop_image_mode: row.desktop_image_mode === "hover" ? "hover" : "carousel",
    brand: row.brand ?? null,
    abrasivity: normalizeAbrasivity(row.abrasivity),
    is_featured: Boolean(row.is_featured),
    is_best_seller: Boolean(row.is_best_seller),
    is_active: Boolean(row.is_active),
    updated_at: row.updated_at ?? null,
    created_at: row.created_at ?? null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants: variantRows.map((variant) => ({
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      variant_name: variant.variant_name,
      price: Number(variant.price),
      stock: Number(variant.stock),
      is_active: Boolean(variant.is_active),
    })),
  }
}

export async function GET(req: NextRequest) {
  const slugs = req.nextUrl.searchParams.get("slugs")?.split(",").filter(Boolean) ?? []

  if (slugs.length === 0) return NextResponse.json({ data: [], error: null })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, category_id, name, slug, description, base_price, images, desktop_image_mode, brand, abrasivity,
      is_featured, is_best_seller, is_active, updated_at, created_at,
      categories ( id, name, slug ),
      product_variants ( id, product_id, sku, variant_name, price, stock, is_active )
    `)
    .in("slug", slugs)
    .is("deleted_at", null)
    .eq("is_active", true)

  if (error) {
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    )
  }

  const bySlug = new Map(
    (data ?? [])
      .map((row) => mapRow(row as RawRow))
      .filter((product): product is ProductWithCategory => product !== null)
      .map((product) => [product.slug, product] as const)
  )

  const ordered = slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is ProductWithCategory => product !== undefined)

  return NextResponse.json({ data: ordered, error: null })
}
