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
    .from("products")
    .select("brand")
    .not("brand", "is", null)
    .order("brand", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const unique =
    data && Array.isArray(data)
      ? [
          ...new Set(
            data
              .map((row: any) => row.brand as string | null)
              .filter((value): value is string => Boolean(value))
          ),
        ]
      : []

  return { data: unique, error: null }
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
    .map((row: any) => {
      const cat = row.categories as Category | null | undefined
      if (!cat?.id) return null
      const rawVariants = row.product_variants
      const variantRows = Array.isArray(rawVariants)
        ? rawVariants
        : rawVariants
          ? [rawVariants]
          : []
      return {
        id: row.id as string,
        category_id: row.category_id as string,
        name: row.name as string,
        slug: row.slug as string,
        description: (row.description as string) ?? null,
        base_price: Number(row.base_price),
        images: (row.images as string[] | null) ?? null,
        brand: (row.brand as string | null) ?? null,
        is_featured: Boolean(row.is_featured),
        is_active: Boolean(row.is_active),
        category: { id: cat.id, name: cat.name, slug: cat.slug },
        variants:
          variantRows.map((variant: any) => ({
            id: variant.id as string,
            product_id: variant.product_id as string,
            sku: variant.sku as string,
            variant_name: variant.variant_name as string,
            price: Number(variant.price),
            stock: Number(variant.stock),
            is_active: Boolean(variant.is_active),
          })),
      }
    })
    .filter((p) => p !== null)

  return { data: products as ProductWithCategory[], error: null }
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

  const cat = (data as any).categories as Category
  const product: ProductWithVariants = {
    id: data.id as string,
    category_id: data.category_id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string) ?? null,
    base_price: Number(data.base_price),
    images: (data.images as string[] | null) ?? null,
    brand: (data.brand as string | null) ?? null,
    is_featured: Boolean(data.is_featured),
    is_active: Boolean(data.is_active),
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants:
      ((data as any).product_variants ?? []).map((variant: any) => ({
        id: variant.id as string,
        product_id: variant.product_id as string,
        sku: variant.sku as string,
        variant_name: variant.variant_name as string,
        price: Number(variant.price),
        stock: Number(variant.stock),
        is_active: Boolean(variant.is_active),
      })) ?? [],
  }

  return { data: product, error: null }
}

