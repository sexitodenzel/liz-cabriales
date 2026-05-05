import { createClient } from "@supabase/supabase-js"
import { getUserRole } from "./users"
import type { UserRole } from "@/types"

type SupabaseError = {
  message: string
  code?: string
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type AdminCategory = {
  id: string
  name: string
  slug: string
}

export type AdminCategoryWithProductCount = AdminCategory & {
  productCount: number
}

export type AdminBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export type AdminBrandWithProductCount = AdminBrand & {
  productCount: number
}

export type AdminProduct = {
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
  deleted_at: string | null
}

export type AdminProductWithCategory = AdminProduct & {
  category: AdminCategory
}

export type CreateAdminProductInput = {
  name: string
  slug: string
  description?: string | null
  basePrice: number
  categoryId: string
  brand?: string | null
  images?: string[]
  isActive?: boolean
  isFeatured?: boolean
}

export type UpdateAdminProductInput = Partial<CreateAdminProductInput>

export type CreateAdminCategoryInput = {
  name: string
}

export type CreateAdminBrandInput = {
  name: string
  logoUrl?: string | null
}

function categoryFromJoin(row: { categories?: unknown }): AdminCategory | null {
  const c = row.categories as AdminCategory | null | undefined
  return c?.id ? c : null
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugifyCategory(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return normalized || "categoria"
}

function slugifyBrand(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return normalized || "marca"
}

async function ensureUniqueCategorySlug(baseSlug: string): Promise<Result<string>> {
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code },
      }
    }

    if (!data) {
      return { data: candidate, error: null }
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function ensureUniqueBrandSlug(baseSlug: string): Promise<Result<string>> {
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (error) {
      if (error.code === "42703") {
        return { data: baseSlug, error: null }
      }
      return {
        data: null,
        error: { message: error.message, code: error.code },
      }
    }

    if (!data) {
      return { data: candidate, error: null }
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

async function ensureBrandsTable(): Promise<Result<null>> {
  const { error } = await supabaseAdmin.from("brands").select("id").limit(1)

  if (!error) {
    return { data: null, error: null }
  }

  if (error.code === "42P01") {
    return {
      data: null,
      error: {
        message:
          "La tabla brands no existe. Crea la tabla con: id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, logo_url text null, created_at timestamptz not null default now().",
        code: "BRANDS_TABLE_MISSING",
      },
    }
  }

  return {
    data: null,
    error: { message: error.message, code: error.code },
  }
}

async function normalizeBrandValue(
  brand: string | null | undefined
): Promise<Result<string | null>> {
  const normalized = brand?.trim() ?? ""
  if (!normalized) {
    return { data: null, error: null }
  }

  const ensureResult = await ensureBrandsTable()
  if (ensureResult.error) {
    return { data: null, error: ensureResult.error }
  }

  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("name")
    .eq("name", normalized)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  if (!data) {
    return {
      data: null,
      error: { message: "Marca no encontrada", code: "BRAND_NOT_FOUND" },
    }
  }

  return { data: normalized, error: null }
}

export async function requireAdmin(
  userId: string | undefined | null
): Promise<Result<UserRole>> {
  if (!userId) {
    return {
      data: null,
      error: { message: "No autorizado", code: "UNAUTHENTICATED" },
    }
  }

  const role = await getUserRole(userId)

  if (role !== "admin") {
    return {
      data: null,
      error: { message: "Acceso denegado", code: "FORBIDDEN" },
    }
  }

  return { data: role, error: null }
}

/** Admin o recepcionista (p. ej. agenda y citas). */
export async function requireAdminOrReceptionist(
  userId: string | undefined | null
): Promise<Result<UserRole>> {
  if (!userId) {
    return {
      data: null,
      error: { message: "No autorizado", code: "UNAUTHENTICATED" },
    }
  }

  const role = await getUserRole(userId)

  if (role !== "admin" && role !== "receptionist") {
    return {
      data: null,
      error: { message: "Acceso denegado", code: "FORBIDDEN" },
    }
  }

  return { data: role, error: null }
}

export async function getAdminCategories(): Promise<Result<AdminCategory[]>> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: (data ?? []) as AdminCategory[], error: null }
}

export async function getAdminCategoriesWithProductCount(): Promise<
  Result<AdminCategoryWithProductCount[]>
> {
  const categoriesResult = await getAdminCategories()
  if (categoriesResult.error) {
    return categoriesResult
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("category_id")
    .not("category_id", "is", null)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const usage = new Map<string, number>()
  for (const row of data ?? []) {
    const categoryId = (row as { category_id: string | null }).category_id
    if (!categoryId) continue
    usage.set(categoryId, (usage.get(categoryId) ?? 0) + 1)
  }

  return {
    data: categoriesResult.data.map((category) => ({
      ...category,
      productCount: usage.get(category.id) ?? 0,
    })),
    error: null,
  }
}

export async function createAdminCategory(
  input: CreateAdminCategoryInput
): Promise<Result<AdminCategory>> {
  const normalizedName = input.name.trim()

  if (!normalizedName) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const uniqueSlugResult = await ensureUniqueCategorySlug(
    slugifyCategory(normalizedName)
  )

  if (uniqueSlugResult.error) {
    return { data: null, error: uniqueSlugResult.error }
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      name: normalizedName,
      slug: uniqueSlugResult.data,
    })
    .select("id, name, slug")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la categoría",
        code: error?.code,
      },
    }
  }

  return {
    data: {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
    },
    error: null,
  }
}

export async function deleteAdminCategory(id: string): Promise<Result<null>> {
  const { data: category, error: categoryError } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (categoryError) {
    return {
      data: null,
      error: { message: categoryError.message, code: categoryError.code },
    }
  }

  if (!category) {
    return {
      data: null,
      error: { message: "Categoría no encontrada", code: "NOT_FOUND" },
    }
  }

  const { count, error: countError } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countError) {
    return {
      data: null,
      error: { message: countError.message, code: countError.code },
    }
  }

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error: {
        message: "No se puede eliminar una categoría con productos asociados",
        code: "CATEGORY_HAS_PRODUCTS",
      },
    }
  }

  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function getAdminBrandsWithProductCount(): Promise<
  Result<AdminBrandWithProductCount[]>
> {
  const ensureResult = await ensureBrandsTable()
  if (ensureResult.error) {
    return { data: null, error: ensureResult.error }
  }

  const { data: fullBrandsData, error: fullBrandsError } = await supabaseAdmin
    .from("brands")
    .select("id, name, slug, logo_url, created_at")
    .order("name", { ascending: true })

  let rows: Array<{
    id: string
    name: string
    slug?: string
    logo_url?: string | null
    created_at?: string
  }> = []

  if (!fullBrandsError) {
    rows = (fullBrandsData ?? []) as Array<{
      id: string
      name: string
      slug: string
      logo_url?: string | null
      created_at?: string
    }>
  } else if (fullBrandsError.code === "42703") {
    const { data: slimBrandsData, error: slimBrandsError } = await supabaseAdmin
      .from("brands")
      .select("id, name, slug")
      .order("name", { ascending: true })

    if (!slimBrandsError) {
      rows = (slimBrandsData ?? []) as Array<{
        id: string
        name: string
        slug: string
      }>
    } else if (slimBrandsError.code === "42703") {
      const { data: minimalBrandsData, error: minimalBrandsError } = await supabaseAdmin
        .from("brands")
        .select("id, name")
        .order("name", { ascending: true })

      if (minimalBrandsError) {
        return {
          data: null,
          error: { message: minimalBrandsError.message, code: minimalBrandsError.code },
        }
      }

      rows = (minimalBrandsData ?? []) as Array<{
        id: string
        name: string
      }>
    } else {
      return {
        data: null,
        error: { message: slimBrandsError.message, code: slimBrandsError.code },
      }
    }
  } else {
    return {
      data: null,
      error: { message: fullBrandsError.message, code: fullBrandsError.code },
    }
  }

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from("products")
    .select("brand")
    .not("brand", "is", null)

  if (productsError) {
    return {
      data: null,
      error: { message: productsError.message, code: productsError.code },
    }
  }

  const usage = new Map<string, number>()
  for (const row of productsData ?? []) {
    const brandName = (row as { brand: string | null }).brand
    if (!brandName) continue
    usage.set(brandName, (usage.get(brandName) ?? 0) + 1)
  }

  const brands: AdminBrandWithProductCount[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugifyBrand(row.name),
    logo_url: "logo_url" in row ? (row.logo_url ?? null) : null,
    created_at:
      "created_at" in row && typeof row.created_at === "string"
        ? row.created_at
        : new Date(0).toISOString(),
    productCount: usage.get(row.name) ?? 0,
  }))

  return { data: brands, error: null }
}

export async function createAdminBrand(
  input: CreateAdminBrandInput
): Promise<Result<AdminBrand>> {
  const ensureResult = await ensureBrandsTable()
  if (ensureResult.error) {
    return { data: null, error: ensureResult.error }
  }

  const normalizedName = input.name.trim()
  if (!normalizedName) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const uniqueSlugResult = await ensureUniqueBrandSlug(slugifyBrand(normalizedName))
  if (uniqueSlugResult.error) {
    return { data: null, error: uniqueSlugResult.error }
  }

  const createdAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("brands")
    .insert({
      id: crypto.randomUUID(),
      name: normalizedName,
      slug: uniqueSlugResult.data,
      logo_url: input.logoUrl ?? null,
      created_at: createdAt,
    })
    .select("id, name, slug, logo_url, created_at")
    .single()

  if (error?.code === "42703") {
    const { data: basicData, error: basicError } = await supabaseAdmin
      .from("brands")
      .insert({
        id: crypto.randomUUID(),
        name: normalizedName,
        slug: uniqueSlugResult.data,
      })
      .select("id, name, slug")
      .single()

    if (basicError?.code === "42703") {
      const { data: minimalData, error: minimalError } = await supabaseAdmin
        .from("brands")
        .insert({
          id: crypto.randomUUID(),
          name: normalizedName,
        })
        .select("id, name")
        .single()

      if (minimalError || !minimalData) {
        return {
          data: null,
          error: {
            message: minimalError?.message ?? "No se pudo crear la marca",
            code: minimalError?.code,
          },
        }
      }

      return {
        data: {
          id: minimalData.id as string,
          name: minimalData.name as string,
          slug: uniqueSlugResult.data,
          logo_url: null,
          created_at: createdAt,
        },
        error: null,
      }
    }

    if (basicError || !basicData) {
      return {
        data: null,
        error: {
          message: basicError?.message ?? "No se pudo crear la marca",
          code: basicError?.code,
        },
      }
    }

    return {
      data: {
        id: basicData.id as string,
        name: basicData.name as string,
        slug: basicData.slug as string,
        logo_url: null,
        created_at: createdAt,
      },
      error: null,
    }
  }

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la marca",
        code: error?.code,
      },
    }
  }

  return {
    data: {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      logo_url: (data.logo_url as string | null) ?? null,
      created_at: data.created_at as string,
    },
    error: null,
  }
}

export async function deleteAdminBrand(id: string): Promise<Result<null>> {
  const ensureResult = await ensureBrandsTable()
  if (ensureResult.error) {
    return { data: null, error: ensureResult.error }
  }

  const { data: brand, error: brandError } = await supabaseAdmin
    .from("brands")
    .select("id, name")
    .eq("id", id)
    .maybeSingle()

  if (brandError) {
    return {
      data: null,
      error: { message: brandError.message, code: brandError.code },
    }
  }

  if (!brand) {
    return {
      data: null,
      error: { message: "Marca no encontrada", code: "NOT_FOUND" },
    }
  }

  const brandName = brand.name as string
  const { count, error: countError } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand", brandName)

  if (countError) {
    return {
      data: null,
      error: { message: countError.message, code: countError.code },
    }
  }

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error: {
        message: "No se puede eliminar una marca con productos asociados",
        code: "BRAND_HAS_PRODUCTS",
      },
    }
  }

  const { error } = await supabaseAdmin.from("brands").delete().eq("id", id)
  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function getAdminProducts(): Promise<
  Result<AdminProductWithCategory[]>
> {
  const { data, error } = await supabaseAdmin
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
      )
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  const products = (data ?? [])
    .map((row) => {
      const current = row as {
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
        deleted_at: string | null
        categories?: unknown
      }
      const cat = categoryFromJoin(current)
      if (!cat) return null
      return {
        id: current.id,
        category_id: current.category_id,
        name: current.name,
        slug: current.slug,
        description: current.description ?? null,
        base_price: Number(current.base_price),
        images: current.images ?? null,
        brand: current.brand ?? null,
        is_featured: Boolean(current.is_featured),
        is_active: Boolean(current.is_active),
        deleted_at: current.deleted_at,
        category: { id: cat.id, name: cat.name, slug: cat.slug },
      }
    })
    .filter((p) => p !== null) as AdminProductWithCategory[]

  return { data: products, error: null }
}

export async function createAdminProduct(
  input: CreateAdminProductInput
): Promise<Result<AdminProductWithCategory>> {
  const normalizedBrandResult = await normalizeBrandValue(input.brand)
  if (normalizedBrandResult.error) {
    return { data: null, error: normalizedBrandResult.error }
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      base_price: input.basePrice,
      category_id: input.categoryId,
      brand: normalizedBrandResult.data,
      images: input.images && input.images.length > 0 ? input.images : null,
      is_active: input.isActive ?? true,
      is_featured: input.isFeatured ?? false,
    })
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
      )
    `
    )
    .single()

  if (productError || !product) {
    return {
      data: null,
      error: {
        message: productError?.message ?? "No se pudo crear el producto",
        code: productError?.code,
      },
    }
  }

  const cat = categoryFromJoin(product as { categories?: unknown })
  if (!cat) {
    return {
      data: null,
      error: {
        message: "No se pudo obtener la categoría del producto",
        code: "MISSING_CATEGORY",
      },
    }
  }

  const { error: variantError } = await supabaseAdmin
    .from("product_variants")
    .insert({
    product_id: product.id,
    sku: input.slug.toUpperCase(),
    variant_name: input.name,
    price: input.basePrice,
    stock: 0,
    is_active: true,
  })

  if (variantError) {
    return {
      data: null,
      error: {
        message: variantError.message,
        code: variantError.code,
      },
    }
  }

  const created: AdminProductWithCategory = {
    id: product.id as string,
    category_id: product.category_id as string,
    name: product.name as string,
    slug: product.slug as string,
    description: (product.description as string) ?? null,
    base_price: Number(product.base_price),
    images: (product.images as string[] | null) ?? null,
    brand: (product.brand as string | null) ?? null,
    is_featured: Boolean(product.is_featured),
    is_active: Boolean(product.is_active),
    deleted_at: product.deleted_at as string | null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
  }

  return { data: created, error: null }
}

export async function updateAdminProduct(
  id: string,
  input: UpdateAdminProductInput
): Promise<Result<AdminProductWithCategory>> {
  const updatePayload: Record<string, unknown> = {}

  if (input.name !== undefined) updatePayload.name = input.name
  if (input.slug !== undefined) updatePayload.slug = input.slug
  if (input.description !== undefined)
    updatePayload.description = input.description
  if (input.basePrice !== undefined) updatePayload.base_price = input.basePrice
  if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId
  if (input.brand !== undefined) {
    const normalizedBrandResult = await normalizeBrandValue(input.brand)
    if (normalizedBrandResult.error) {
      return { data: null, error: normalizedBrandResult.error }
    }
    updatePayload.brand = normalizedBrandResult.data
  }
  if (input.images !== undefined)
    updatePayload.images =
      input.images && input.images.length > 0 ? input.images : null
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive
  if (input.isFeatured !== undefined) updatePayload.is_featured = input.isFeatured

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(updatePayload)
    .eq("id", id)
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
      )
    `
    )
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el producto",
        code: error?.code,
      },
    }
  }

  const cat = categoryFromJoin(data as { categories?: unknown })
  if (!cat) {
    return {
      data: null,
      error: {
        message: "No se pudo obtener la categoría del producto",
        code: "MISSING_CATEGORY",
      },
    }
  }

  const updated: AdminProductWithCategory = {
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
    deleted_at: data.deleted_at as string | null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
  }

  return { data: updated, error: null }
}

export async function softDeleteAdminProduct(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code,
      },
    }
  }

  return { data: null, error: null }
}

