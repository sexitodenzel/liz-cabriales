import { createClient } from "./server"

type SupabaseError = {
  message: string
  code?: string
}

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

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
  images: string[] | null
  brand: string | null
  is_featured: boolean
  is_active: boolean
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
  images: string[] | null
  brand: string | null
  is_featured: boolean
  is_active: boolean
  categories?: Category | null
  product_variants?: ProductVariantRow[] | ProductVariantRow | null
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
      images,
      brand,
      is_featured,
      is_active,
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
        images: productRow.images ?? null,
        brand: productRow.brand ?? null,
        is_featured: Boolean(productRow.is_featured),
        is_active: Boolean(productRow.is_active),
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
    .select("id, category_id, name, slug, description, base_price, images, brand, is_featured, is_active")
    .eq("is_featured", true)
    .eq("is_active", true)
    .is("deleted_at", null)
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
        images: productRow.images ?? null,
        brand: productRow.brand ?? null,
        is_featured: Boolean(productRow.is_featured),
        is_active: Boolean(productRow.is_active),
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
      images,
      brand,
      is_featured,
      is_active,
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
    images: productRow.images ?? null,
    brand: productRow.brand ?? null,
    is_featured: Boolean(productRow.is_featured),
    is_active: Boolean(productRow.is_active),
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants: variantRows.map(mapVariantRow),
  }

  return { data: product, error: null }
}

