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
  color_hex?: string | null
  color_name?: string | null
  size_label?: string | null
  is_limited_edition?: boolean | null
}

type RawRow = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  long_description?: string | null
  application_text?: string | null
  base_price: number | string
  discount_percent?: number | string | null
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
    long_description: row.long_description ?? null,
    application_text: row.application_text ?? null,
    base_price: Number(row.base_price),
    discount_percent: Number(row.discount_percent ?? 0),
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
      color_hex: variant.color_hex ?? null,
      color_name: variant.color_name ?? null,
      size_label: variant.size_label ?? null,
      is_limited_edition: Boolean(variant.is_limited_edition ?? false),
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
      id, category_id, name, slug, description, long_description, application_text, base_price, discount_percent, images, desktop_image_mode, brand, abrasivity,
      is_featured, is_best_seller, is_active, updated_at, created_at,
      categories ( id, name, slug ),
      product_variants ( id, product_id, sku, variant_name, price, stock, is_active, color_hex, color_name, size_label, is_limited_edition )
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
