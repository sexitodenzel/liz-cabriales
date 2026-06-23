import {
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"

import { createClient } from "./server"

type SupabaseError = {
  message: string
  code?: string
}

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type ProductDesktopImageMode = "carousel" | "hover"

export type Category = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  discount_percent: number
  images: string[] | null
  desktop_image_mode: ProductDesktopImageMode
  brand: string | null
  abrasivity: AbrasivityValue | null
  is_featured: boolean
  is_best_seller: boolean
  is_active: boolean
  updated_at: string | null
  created_at: string | null
}

export type ProductWithCategory = Product & {
  category: Category
  variants?: ProductVariant[]
}

export type ProductVariant = {
  id: string
  product_id: string
  sku: string
  variant_name: string
  price: number
  stock: number
  is_active: boolean
}

export type ProductWithVariants = ProductWithCategory & {
  variants: ProductVariant[]
}

export type ProductFilters = {
  categorySlug?: string
  /**
   * Lista de marcas separadas por coma.
   * Ejemplo: "Exotic,Miss Nails"
   */
  brand?: string
  search?: string
}

type ProductVariantRow = {
  id: string
  product_id: string
  sku: string
  variant_name: string
  price: number | string
  stock: number | string
  is_active: boolean
}

type ProductRow = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
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
  categories?: Category | null
  product_variants?: ProductVariantRow[] | ProductVariantRow | null
}

function normalizeDesktopImageMode(
  value: string | null | undefined
): ProductDesktopImageMode {
  return value === "hover" ? "hover" : "carousel"
}

function normalizeAbrasivity(
  value: string | null | undefined
): AbrasivityValue | null {
  return isAbrasivityValue(value) ? value : null
}

function mapVariantRow(variant: ProductVariantRow): ProductVariant {
  return {
    id: variant.id,
    product_id: variant.product_id,
    sku: variant.sku,
    variant_name: variant.variant_name,
    price: Number(variant.price),
    stock: Number(variant.stock),
    is_active: Boolean(variant.is_active),
  }
}

function mapProductWithCategoryRow(
  row: unknown
): ProductWithCategory | null {
  const productRow = row as ProductRow
  const cat = productRow.categories
  if (!cat?.id) return null
  const rawVariants = productRow.product_variants
  const variantRows = Array.isArray(rawVariants)
    ? rawVariants
    : rawVariants
      ? [rawVariants]
      : []
  return {
    id: productRow.id,
    category_id: productRow.category_id,
    name: productRow.name,
    slug: productRow.slug,
    description: productRow.description ?? null,
    base_price: Number(productRow.base_price),
    discount_percent: Number(productRow.discount_percent ?? 0),
    images: productRow.images ?? null,
    desktop_image_mode: normalizeDesktopImageMode(
      productRow.desktop_image_mode
    ),
    brand: productRow.brand ?? null,
    abrasivity: normalizeAbrasivity(productRow.abrasivity),
    is_featured: Boolean(productRow.is_featured),
    is_best_seller: Boolean(productRow.is_best_seller),
    is_active: Boolean(productRow.is_active),
    updated_at: productRow.updated_at ?? null,
    created_at: productRow.created_at ?? null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants: variantRows.map(mapVariantRow),
  }
}

export async function getCategories(): Promise<Result<Category[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: (data ?? []) as Category[], error: null }
}

export async function getBrands(): Promise<Result<string[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("brands")
    .select("name")
    .order("name", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const names =
    data?.flatMap((row) => {
      const value = row.name
      return typeof value === "string" && value.trim().length > 0 ? [value] : []
    }) ?? []

  return { data: names, error: null }
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<Result<ProductWithCategory[]>> {
  const supabase = await createClient()

  let categoryId: string | null | undefined
  if (filters.categorySlug) {
    const { data: catRow, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle()

    if (catError) {
      return {
        data: null,
        error: { message: catError.message, code: catError.code },
      }
    }
    if (!catRow) {
      return { data: [], error: null }
    }
    categoryId = catRow.id as string
  }

  let query = supabase
    .from("products")
    .select(
      `
      id,
      category_id,
      name,
      slug,
      description,
      base_price,
      discount_percent,
      images,
      desktop_image_mode,
      brand,
      abrasivity,
      is_featured,
      is_active,
      updated_at,
      created_at,
      deleted_at,
      categories (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        product_id,
        sku,
        variant_name,
        price,
        stock,
        is_active
      )
    `
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (filters.brand) {
    const raw = filters.brand.split(",").map((item) => item.trim())
    const brands = raw.filter(Boolean)
    if (brands.length === 1) {
      query = query.eq("brand", brands[0])
    } else if (brands.length > 1) {
      query = query.in("brand", brands)
    }
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const products = (data ?? [])
    .map((row) => {
      const productRow = row as unknown as ProductRow
      const cat = productRow.categories
      if (!cat?.id) return null
      const rawVariants = productRow.product_variants
      const variantRows = Array.isArray(rawVariants)
        ? rawVariants
        : rawVariants
          ? [rawVariants]
          : []
      return {
        id: productRow.id,
        category_id: productRow.category_id,
        name: productRow.name,
        slug: productRow.slug,
        description: productRow.description ?? null,
        base_price: Number(productRow.base_price),
        discount_percent: Number(productRow.discount_percent ?? 0),
        images: productRow.images ?? null,
        desktop_image_mode: normalizeDesktopImageMode(
          productRow.desktop_image_mode
        ),
        brand: productRow.brand ?? null,
        abrasivity: normalizeAbrasivity(productRow.abrasivity),
        is_featured: Boolean(productRow.is_featured),
        is_best_seller: Boolean(productRow.is_best_seller),
        is_active: Boolean(productRow.is_active),
        updated_at: productRow.updated_at ?? null,
        created_at: productRow.created_at ?? null,
        category: { id: cat.id, name: cat.name, slug: cat.slug },
        variants: variantRows.map(mapVariantRow),
      }
    })
    .filter((p) => p !== null) as ProductWithCategory[]

  return { data: products, error: null }
}

export async function getFeaturedProducts(): Promise<Result<Product[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, slug, description, base_price, discount_percent, images, desktop_image_mode, brand, abrasivity, is_featured, is_best_seller, is_active, updated_at, created_at")
    .eq("is_featured", true)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return {
    data: (data ?? []).map((row) => {
      const productRow = row as ProductRow
      return {
        id: productRow.id,
        category_id: productRow.category_id,
        name: productRow.name,
        slug: productRow.slug,
        description: productRow.description ?? null,
        base_price: Number(productRow.base_price),
        discount_percent: Number(productRow.discount_percent ?? 0),
        images: productRow.images ?? null,
        desktop_image_mode: normalizeDesktopImageMode(
          productRow.desktop_image_mode
        ),
        brand: productRow.brand ?? null,
        abrasivity: normalizeAbrasivity(productRow.abrasivity),
        is_featured: Boolean(productRow.is_featured),
        is_best_seller: Boolean(productRow.is_best_seller),
        is_active: Boolean(productRow.is_active),
        updated_at: productRow.updated_at ?? null,
        created_at: productRow.created_at ?? null,
      }
    }),
    error: null,
  }
}

export async function getBestSellers(limit = 12): Promise<Result<Product[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, slug, description, base_price, discount_percent, images, desktop_image_mode, brand, abrasivity, is_featured, is_best_seller, is_active, updated_at, created_at")
    .eq("is_best_seller", true)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return {
    data: (data ?? []).map((row) => {
      const productRow = row as ProductRow
      return {
        id: productRow.id,
        category_id: productRow.category_id,
        name: productRow.name,
        slug: productRow.slug,
        description: productRow.description ?? null,
        base_price: Number(productRow.base_price),
        discount_percent: Number(productRow.discount_percent ?? 0),
        images: productRow.images ?? null,
        desktop_image_mode: normalizeDesktopImageMode(
          productRow.desktop_image_mode
        ),
        brand: productRow.brand ?? null,
        abrasivity: normalizeAbrasivity(productRow.abrasivity),
        is_featured: Boolean(productRow.is_featured),
        is_best_seller: Boolean(productRow.is_best_seller),
        is_active: Boolean(productRow.is_active),
        updated_at: productRow.updated_at ?? null,
        created_at: productRow.created_at ?? null,
      }
    }),
    error: null,
  }
}

export async function getProductBySlug(
  slug: string
): Promise<Result<ProductWithVariants>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      category_id,
      name,
      slug,
      description,
      base_price,
      discount_percent,
      images,
      desktop_image_mode,
      brand,
      abrasivity,
      is_featured,
      is_active,
      updated_at,
      created_at,
      deleted_at,
      categories (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        product_id,
        sku,
        variant_name,
        price,
        stock,
        is_active
      )
    `
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "Producto no encontrado",
        code: error?.code,
      },
    }
  }

  const productRow = data as unknown as ProductRow
  const cat = productRow.categories
  if (!cat?.id) {
    return {
      data: null,
      error: { message: "Producto sin categoría", code: "MISSING_CATEGORY" },
    }
  }

  const rawVariants = productRow.product_variants
  const variantRows = Array.isArray(rawVariants)
    ? rawVariants
    : rawVariants
      ? [rawVariants]
      : []

  const product: ProductWithVariants = {
    id: productRow.id,
    category_id: productRow.category_id,
    name: productRow.name,
    slug: productRow.slug,
    description: productRow.description ?? null,
    base_price: Number(productRow.base_price),
    discount_percent: Number(productRow.discount_percent ?? 0),
    images: productRow.images ?? null,
    desktop_image_mode: normalizeDesktopImageMode(
      productRow.desktop_image_mode
    ),
    brand: productRow.brand ?? null,
    abrasivity: normalizeAbrasivity(productRow.abrasivity),
    is_featured: Boolean(productRow.is_featured),
    is_best_seller: Boolean(productRow.is_best_seller),
    is_active: Boolean(productRow.is_active),
    updated_at: productRow.updated_at ?? null,
    created_at: productRow.created_at ?? null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants: variantRows.map(mapVariantRow),
  }

  return { data: product, error: null }
}

const RELATED_SELECT = `
  id,
  category_id,
  name,
  slug,
  description,
  base_price,
  images,
  desktop_image_mode,
  brand,
  abrasivity,
  is_featured,
  is_active,
  updated_at,
  created_at,
  deleted_at,
  categories (
    id,
    name,
    slug
  ),
  product_variants (
    id,
    product_id,
    sku,
    variant_name,
    price,
    stock,
    is_active
  )
`

export type RelatedProductsParams = {
  categoryId: string
  brand?: string | null
  excludeId: string
  limit?: number
}

/**
 * Recomendaciones "inteligentes": misma categoria primero, luego se completa
 * con la misma marca y, si aun faltan, con productos destacados.
 */
export async function getRelatedProducts({
  categoryId,
  brand,
  excludeId,
  limit = 4,
}: RelatedProductsParams): Promise<Result<ProductWithCategory[]>> {
  const supabase = await createClient()

  const collected: ProductWithCategory[] = []
  const seen = new Set<string>([excludeId])

  const baseQuery = () =>
    supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("is_active", true)
      .is("deleted_at", null)
      .neq("id", excludeId)
      .limit(limit * 3)

  const absorb = (rows: unknown[] | null) => {
    for (const row of rows ?? []) {
      if (collected.length >= limit) break
      const product = mapProductWithCategoryRow(row)
      if (!product || seen.has(product.id)) continue
      seen.add(product.id)
      collected.push(product)
    }
  }

  // 1. Misma categoria.
  {
    const { data, error } = await baseQuery()
      .eq("category_id", categoryId)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
    if (error) {
      return { data: null, error: { message: error.message, code: error.code } }
    }
    absorb(data)
  }

  // 2. Misma marca.
  if (collected.length < limit && brand) {
    const { data, error } = await baseQuery()
      .eq("brand", brand)
      .order("name", { ascending: true })
    if (error) {
      return { data: null, error: { message: error.message, code: error.code } }
    }
    absorb(data)
  }

  // 3. Destacados.
  if (collected.length < limit) {
    const { data, error } = await baseQuery()
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
    if (error) {
      return { data: null, error: { message: error.message, code: error.code } }
    }
    absorb(data)
  }

  return { data: collected.slice(0, limit), error: null }
}

