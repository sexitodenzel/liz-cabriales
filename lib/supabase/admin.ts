import { createClient } from "@supabase/supabase-js"

import {
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"
import { notifyStockAlertsForVariant } from "@/lib/notifications/stock-alert-notifications"

import { getUserRole } from "./users"
import type { UserRole } from "@/types"

type SupabaseError = {
  message: string
  code?: string
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type ProductDesktopImageMode = "carousel" | "hover"

export type AdminCategory = {
  id: string
  name: string
  slug: string
}

export type AdminCategoryWithProductCount = AdminCategory & {
  productCount: number
}

export type AdminSubcategory = {
  id: string
  category_id: string
  name: string
  slug: string
  created_at: string
}

export type AdminSubcategoryWithProductCount = AdminSubcategory & {
  productCount: number
  category_name: string
}

export type AdminBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  show_on_home: boolean
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
  sku: string | null
  description: string | null
  long_description: string | null
  base_price: number
  cost_price: number | null
  wholesale_price: number | null
  images: string[] | null
  desktop_image_mode: ProductDesktopImageMode
  brand: string | null
  department: string | null
  subcategory: string | null
  abrasivity: AbrasivityValue | null
  min_stock: number
  stock: number
  variant_id: string | null
  is_featured: boolean
  is_best_seller: boolean
  is_active: boolean
  deleted_at: string | null
  updated_at: string | null
}

export type AdminProductWithCategory = AdminProduct & {
  category: AdminCategory
}

export type AdminProductVariant = {
  id: string
  product_id: string
  sku: string
  variant_name: string
  price: number
  stock: number
  is_active: boolean
}

export type CreateVariantInput = {
  variantName: string
  sku?: string | null
  price: number
  stock: number
  isActive?: boolean
}

export type UpdateVariantInput = Partial<CreateVariantInput>

export type CreateAdminProductInput = {
  name: string
  slug: string
  sku?: string | null
  description?: string | null
  longDescription?: string | null
  basePrice: number
  costPrice?: number | null
  wholesalePrice?: number | null
  categoryId: string
  subcategory?: string | null
  brand?: string | null
  department?: string | null
  abrasivity?: AbrasivityValue | null
  images?: string[]
  desktopImageMode?: ProductDesktopImageMode
  isActive?: boolean
  isFeatured?: boolean
  isBestSeller?: boolean
  initialStock?: number
  minStock?: number
  stock?: number | null
  variants?: Array<{
    variantName: string
    sku?: string | null
    price: number
    stock: number
    isActive?: boolean
  }>
}

export type UpdateAdminProductInput = Partial<CreateAdminProductInput>

export type CreateAdminCategoryInput = {
  name: string
}

export type CreateAdminSubcategoryInput = {
  name: string
  categoryId: string
}

export type UpdateAdminSubcategoryInput = {
  name: string
}

export type CreateAdminBrandInput = {
  name: string
  logoUrl?: string | null
  showOnHome?: boolean
}

function hasLogoUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0
}

function categoryFromJoin(row: { categories?: unknown }): AdminCategory | null {
  const c = row.categories as AdminCategory | null | undefined
  return c?.id ? c : null
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
          "La tabla brands no existe. Crea la tabla con: id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, logo_url text null, show_on_home boolean not null default false, created_at timestamptz not null default now().",
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
    .is("deleted_at", null)

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
    .is("deleted_at", null)

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

export async function updateAdminCategory(
  id: string,
  input: { name: string }
): Promise<Result<AdminCategory>> {
  const normalizedName = input.name.trim()
  if (!normalizedName) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const { data: current, error: fetchError } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return { data: null, error: { message: fetchError.message, code: fetchError.code } }
  }
  if (!current) {
    return { data: null, error: { message: "Categoría no encontrada", code: "NOT_FOUND" } }
  }

  const currentRow = current as { id: string; name: string; slug: string }
  let newSlug = currentRow.slug

  if (normalizedName.toLowerCase() !== currentRow.name.toLowerCase()) {
    const baseSlug = slugifyCategory(normalizedName)
    let candidate = baseSlug
    let suffix = 2
    while (true) {
      const { data: existing, error: slugError } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", candidate)
        .neq("id", id)
        .maybeSingle()
      if (slugError) {
        return { data: null, error: { message: slugError.message, code: slugError.code } }
      }
      if (!existing) {
        newSlug = candidate
        break
      }
      candidate = `${baseSlug}-${suffix}`
      suffix++
    }
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update({ name: normalizedName, slug: newSlug })
    .eq("id", id)
    .select("id, name, slug")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar la categoría",
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

function slugifySubcategory(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return normalized || "subcategoria"
}

async function ensureUniqueSubcategorySlug(
  categoryId: string,
  baseSlug: string,
  excludeId?: string
): Promise<Result<string>> {
  let candidate = baseSlug
  let suffix = 2
  while (true) {
    let query = supabaseAdmin
      .from("subcategories")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", candidate)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query.maybeSingle()
    if (error) {
      return { data: null, error: { message: error.message, code: error.code } }
    }
    if (!data) return { data: candidate, error: null }
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function getAdminSubcategoriesWithProductCount(): Promise<
  Result<AdminSubcategoryWithProductCount[]>
> {
  const { data: subs, error: subsError } = await supabaseAdmin
    .from("subcategories")
    .select("id, category_id, name, slug, created_at, categories(name)")
    .order("name", { ascending: true })

  if (subsError) {
    if (subsError.code === "42P01") {
      return {
        data: null,
        error: {
          message:
            "La tabla subcategories no existe. Corre docs/delivery/sql-subcategories.sql en Supabase.",
          code: "SUBCATEGORIES_TABLE_MISSING",
        },
      }
    }
    return {
      data: null,
      error: { message: subsError.message, code: subsError.code },
    }
  }

  const { data: productsData, error: productsError } = await supabaseAdmin
    .from("products")
    .select("category_id, subcategory")
    .not("subcategory", "is", null)
    .is("deleted_at", null)

  if (productsError) {
    return {
      data: null,
      error: { message: productsError.message, code: productsError.code },
    }
  }

  const usage = new Map<string, number>()
  for (const row of productsData ?? []) {
    const r = row as { category_id: string | null; subcategory: string | null }
    if (!r.category_id || !r.subcategory) continue
    const key = `${r.category_id}::${r.subcategory.trim()}`
    usage.set(key, (usage.get(key) ?? 0) + 1)
  }

  const rows = (subs ?? []) as Array<{
    id: string
    category_id: string
    name: string
    slug: string
    created_at: string
    categories?: { name: string } | { name: string }[] | null
  }>

  const data: AdminSubcategoryWithProductCount[] = rows.map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const key = `${row.category_id}::${row.name}`
    return {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      productCount: usage.get(key) ?? 0,
      category_name: cat?.name ?? "—",
    }
  })

  return { data, error: null }
}

export async function createAdminSubcategory(
  input: CreateAdminSubcategoryInput
): Promise<Result<AdminSubcategory>> {
  const normalizedName = input.name.trim()
  if (!normalizedName) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const { data: cat, error: catError } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("id", input.categoryId)
    .maybeSingle()
  if (catError) {
    return { data: null, error: { message: catError.message, code: catError.code } }
  }
  if (!cat) {
    return {
      data: null,
      error: { message: "Categoría no encontrada", code: "NOT_FOUND" },
    }
  }

  const slugResult = await ensureUniqueSubcategorySlug(
    input.categoryId,
    slugifySubcategory(normalizedName)
  )
  if (slugResult.error) return { data: null, error: slugResult.error }

  const { data, error } = await supabaseAdmin
    .from("subcategories")
    .insert({
      category_id: input.categoryId,
      name: normalizedName,
      slug: slugResult.data,
    })
    .select("id, category_id, name, slug, created_at")
    .single()

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        data: null,
        error: {
          message: "Ya existe una subcategoría con ese nombre en esta categoría",
          code: "DUPLICATE",
        },
      }
    }
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la subcategoría",
        code: error?.code,
      },
    }
  }

  return {
    data: {
      id: data.id as string,
      category_id: data.category_id as string,
      name: data.name as string,
      slug: data.slug as string,
      created_at: data.created_at as string,
    },
    error: null,
  }
}

export async function updateAdminSubcategory(
  id: string,
  input: UpdateAdminSubcategoryInput
): Promise<Result<AdminSubcategory>> {
  const normalizedName = input.name.trim()
  if (!normalizedName) {
    return {
      data: null,
      error: { message: "El nombre es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const { data: current, error: fetchError } = await supabaseAdmin
    .from("subcategories")
    .select("id, category_id, name, slug, created_at")
    .eq("id", id)
    .maybeSingle()
  if (fetchError) {
    return {
      data: null,
      error: { message: fetchError.message, code: fetchError.code },
    }
  }
  if (!current) {
    return {
      data: null,
      error: { message: "Subcategoría no encontrada", code: "NOT_FOUND" },
    }
  }

  const currentRow = current as {
    id: string
    category_id: string
    name: string
    slug: string
    created_at: string
  }
  const previousName = currentRow.name
  let newSlug = currentRow.slug

  if (normalizedName.toLowerCase() !== currentRow.name.toLowerCase()) {
    const slugResult = await ensureUniqueSubcategorySlug(
      currentRow.category_id,
      slugifySubcategory(normalizedName),
      id
    )
    if (slugResult.error) return { data: null, error: slugResult.error }
    newSlug = slugResult.data
  }

  const { data, error } = await supabaseAdmin
    .from("subcategories")
    .update({ name: normalizedName, slug: newSlug })
    .eq("id", id)
    .select("id, category_id, name, slug, created_at")
    .single()

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        data: null,
        error: {
          message: "Ya existe una subcategoría con ese nombre en esta categoría",
          code: "DUPLICATE",
        },
      }
    }
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar la subcategoría",
        code: error?.code,
      },
    }
  }

  // Propagar el rename al texto denormalizado en products.
  if (previousName !== normalizedName) {
    await supabaseAdmin
      .from("products")
      .update({ subcategory: normalizedName })
      .eq("category_id", currentRow.category_id)
      .eq("subcategory", previousName)
  }

  return {
    data: {
      id: data.id as string,
      category_id: data.category_id as string,
      name: data.name as string,
      slug: data.slug as string,
      created_at: data.created_at as string,
    },
    error: null,
  }
}

export async function deleteAdminSubcategory(id: string): Promise<Result<null>> {
  const { data: sub, error: fetchError } = await supabaseAdmin
    .from("subcategories")
    .select("id, category_id, name")
    .eq("id", id)
    .maybeSingle()
  if (fetchError) {
    return {
      data: null,
      error: { message: fetchError.message, code: fetchError.code },
    }
  }
  if (!sub) {
    return {
      data: null,
      error: { message: "Subcategoría no encontrada", code: "NOT_FOUND" },
    }
  }

  const subRow = sub as { id: string; category_id: string; name: string }

  const { count, error: countError } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", subRow.category_id)
    .eq("subcategory", subRow.name)
    .is("deleted_at", null)

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
        message: "No se puede eliminar una subcategoría con productos asociados",
        code: "SUBCATEGORY_HAS_PRODUCTS",
      },
    }
  }

  const { error } = await supabaseAdmin.from("subcategories").delete().eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
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
    .select("id, name, slug, logo_url, show_on_home, created_at")
    .order("name", { ascending: true })

  let rows: Array<{
    id: string
    name: string
    slug?: string
    logo_url?: string | null
    show_on_home?: boolean
    created_at?: string
  }> = []

  if (!fullBrandsError) {
    rows = (fullBrandsData ?? []) as Array<{
      id: string
      name: string
      slug: string
      logo_url?: string | null
      show_on_home?: boolean
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
    .is("deleted_at", null)

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
    show_on_home:
      "show_on_home" in row && typeof row.show_on_home === "boolean"
        ? row.show_on_home
        : hasLogoUrl(row.logo_url ?? null),
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
  const normalizedLogoUrl = input.logoUrl?.trim() ? input.logoUrl.trim() : null
  const showOnHome = input.showOnHome ?? hasLogoUrl(normalizedLogoUrl)

  const { data, error } = await supabaseAdmin
    .from("brands")
    .insert({
      id: crypto.randomUUID(),
      name: normalizedName,
      slug: uniqueSlugResult.data,
      logo_url: normalizedLogoUrl,
      show_on_home: showOnHome,
      created_at: createdAt,
    })
    .select("id, name, slug, logo_url, show_on_home, created_at")
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
          show_on_home: showOnHome,
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
        show_on_home: showOnHome,
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
      show_on_home:
        typeof (data as { show_on_home?: unknown }).show_on_home === "boolean"
          ? Boolean((data as { show_on_home?: boolean }).show_on_home)
          : showOnHome,
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
    .is("deleted_at", null)

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

export async function updateAdminBrand(
  id: string,
  input: { name: string; logoUrl?: string | null; showOnHome?: boolean }
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

  let current:
    | {
        id: string
        name: string
        slug: string
        logo_url: string | null
        show_on_home?: boolean
        created_at: string
      }
    | null = null

  const { data: currentWithFlag, error: fetchWithFlagError } = await supabaseAdmin
    .from("brands")
    .select("id, name, slug, logo_url, show_on_home, created_at")
    .eq("id", id)
    .maybeSingle()

  if (!fetchWithFlagError) {
    current = currentWithFlag as {
      id: string
      name: string
      slug: string
      logo_url: string | null
      show_on_home?: boolean
      created_at: string
    } | null
  } else if (fetchWithFlagError.code === "42703") {
    const { data: currentBasic, error: fetchBasicError } = await supabaseAdmin
      .from("brands")
      .select("id, name, slug, logo_url, created_at")
      .eq("id", id)
      .maybeSingle()

    if (fetchBasicError) {
      return {
        data: null,
        error: { message: fetchBasicError.message, code: fetchBasicError.code },
      }
    }

    current = currentBasic as {
      id: string
      name: string
      slug: string
      logo_url: string | null
      created_at: string
    } | null
  } else {
    return {
      data: null,
      error: { message: fetchWithFlagError.message, code: fetchWithFlagError.code },
    }
  }

  if (!current) {
    return { data: null, error: { message: "Marca no encontrada", code: "NOT_FOUND" } }
  }

  const currentRow = current
  let newSlug = currentRow.slug

  if (normalizedName.toLowerCase() !== currentRow.name.toLowerCase()) {
    const baseSlug = slugifyBrand(normalizedName)
    let candidate = baseSlug
    let suffix = 2
    while (true) {
      const { data: existing, error: slugError } = await supabaseAdmin
        .from("brands")
        .select("id")
        .eq("slug", candidate)
        .neq("id", id)
        .maybeSingle()
      if (slugError) {
        return { data: null, error: { message: slugError.message, code: slugError.code } }
      }
      if (!existing) {
        newSlug = candidate
        break
      }
      candidate = `${baseSlug}-${suffix}`
      suffix++
    }
  }

  const normalizedLogoUrl = input.logoUrl?.trim() ? input.logoUrl.trim() : null
  const computedShowOnHome = input.showOnHome ?? hasLogoUrl(normalizedLogoUrl)

  const { data, error } = await supabaseAdmin
    .from("brands")
    .update({
      name: normalizedName,
      slug: newSlug,
      logo_url: normalizedLogoUrl,
      show_on_home: computedShowOnHome,
    })
    .eq("id", id)
    .select("id, name, slug, logo_url, show_on_home, created_at")
    .single()

  if (error?.code === "42703") {
    const { data: basicData, error: basicError } = await supabaseAdmin
      .from("brands")
      .update({
        name: normalizedName,
        slug: newSlug,
        logo_url: normalizedLogoUrl,
      })
      .eq("id", id)
      .select("id, name, slug, logo_url, created_at")
      .single()

    if (basicError || !basicData) {
      return {
        data: null,
        error: {
          message: basicError?.message ?? "No se pudo actualizar la marca",
          code: basicError?.code,
        },
      }
    }

    return {
      data: {
        id: basicData.id as string,
        name: basicData.name as string,
        slug: basicData.slug as string,
        logo_url: (basicData.logo_url as string | null) ?? null,
        show_on_home: computedShowOnHome,
        created_at: basicData.created_at as string,
      },
      error: null,
    }
  }

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar la marca",
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
      show_on_home:
        typeof (data as { show_on_home?: unknown }).show_on_home === "boolean"
          ? Boolean((data as { show_on_home?: boolean }).show_on_home)
          : computedShowOnHome,
      created_at: data.created_at as string,
    },
    error: null,
  }
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
      sku,
      description,
      long_description,
      base_price,
      cost_price,
      wholesale_price,
      images,
      desktop_image_mode,
      brand,
      department,
      subcategory,
      abrasivity,
      min_stock,
      is_featured,
      is_best_seller,
      is_active,
      updated_at,
      deleted_at,
      categories (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        stock,
        is_active
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
        sku: string | null
        description: string | null
        long_description: string | null
        base_price: number
        cost_price: number | null
        wholesale_price: number | null
        images: string[] | null
        desktop_image_mode?: string | null
        brand: string | null
        department: string | null
        subcategory: string | null
        abrasivity?: string | null
        min_stock: number | null
        is_featured: boolean
        is_best_seller: boolean | null
        is_active: boolean
        updated_at: string | null
        deleted_at: string | null
        categories?: unknown
        product_variants?: Array<{ id: string; stock: number; is_active: boolean }> | null
      }
      const cat = categoryFromJoin(current)
      if (!cat) return null
      const variants = current.product_variants ?? []
      const activeVariant = variants.find((v) => v.is_active) ?? variants[0] ?? null
      return {
        id: current.id,
        category_id: current.category_id,
        name: current.name,
        slug: current.slug,
        sku: current.sku ?? null,
        description: current.description ?? null,
        long_description: current.long_description ?? null,
        base_price: Number(current.base_price),
        cost_price: current.cost_price !== null ? Number(current.cost_price) : null,
        wholesale_price: current.wholesale_price !== null ? Number(current.wholesale_price) : null,
        images: current.images ?? null,
        desktop_image_mode: normalizeDesktopImageMode(
          current.desktop_image_mode
        ),
        brand: current.brand ?? null,
        department: current.department ?? null,
        subcategory: current.subcategory ?? null,
        abrasivity: normalizeAbrasivity(current.abrasivity),
        min_stock: Number(current.min_stock ?? 0),
        stock: activeVariant ? Number(activeVariant.stock) : 0,
        variant_id: activeVariant?.id ?? null,
        is_featured: Boolean(current.is_featured),
        is_best_seller: Boolean(current.is_best_seller),
        is_active: Boolean(current.is_active),
        updated_at: current.updated_at ?? null,
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
      sku: input.sku ?? null,
      description: input.description ?? null,
      long_description: input.longDescription ?? null,
      base_price: input.basePrice,
      cost_price: input.costPrice ?? null,
      wholesale_price: input.wholesalePrice ?? null,
      category_id: input.categoryId,
      subcategory: input.subcategory ?? null,
      brand: normalizedBrandResult.data,
      department: input.department ?? null,
      abrasivity: input.abrasivity ?? null,
      images: input.images && input.images.length > 0 ? input.images : null,
      desktop_image_mode: input.desktopImageMode ?? "carousel",
      is_active: input.isActive ?? true,
      is_featured: input.isFeatured ?? false,
      is_best_seller: input.isBestSeller ?? false,
      min_stock: input.minStock ?? 0,
    })
    .select(
      `
      id,
      category_id,
      name,
      slug,
      sku,
      description,
      long_description,
      base_price,
      cost_price,
      wholesale_price,
      images,
      desktop_image_mode,
      brand,
      department,
      subcategory,
      abrasivity,
      min_stock,
      is_featured,
      is_best_seller,
      is_active,
      updated_at,
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

  if (input.variants && input.variants.length > 0) {
    const baseSku = (input.sku?.trim() || input.slug).toUpperCase()
    for (let i = 0; i < input.variants.length; i++) {
      const v = input.variants[i]
      const providedSku = v.sku?.trim()
      const sku =
        providedSku && providedSku.length > 0
          ? providedSku.toUpperCase()
          : `${baseSku}-${i + 1}`
      const { error: variantError } = await supabaseAdmin
        .from("product_variants")
        .insert({
          product_id: product.id,
          sku,
          variant_name: v.variantName,
          price: v.price,
          stock: v.stock,
          is_active: v.isActive ?? true,
        })
      if (variantError) {
        await supabaseAdmin.from("product_variants").delete().eq("product_id", product.id)
        await supabaseAdmin.from("products").delete().eq("id", product.id)
        return {
          data: null,
          error: { message: variantError.message, code: variantError.code },
        }
      }
    }
  } else {
    const { error: variantError } = await supabaseAdmin
      .from("product_variants")
      .insert({
        product_id: product.id,
        sku: input.sku?.toUpperCase() ?? input.slug.toUpperCase(),
        variant_name: input.name,
        price: input.basePrice,
        stock: input.initialStock ?? 0,
        is_active: true,
      })
    if (variantError) {
      return {
        data: null,
        error: { message: variantError.message, code: variantError.code },
      }
    }
  }

  const created: AdminProductWithCategory = {
    id: product.id as string,
    category_id: product.category_id as string,
    name: product.name as string,
    slug: product.slug as string,
    sku: (product.sku as string | null) ?? null,
    description: (product.description as string) ?? null,
    long_description: (product.long_description as string | null) ?? null,
    base_price: Number(product.base_price),
    cost_price: product.cost_price !== null ? Number(product.cost_price) : null,
    wholesale_price: product.wholesale_price !== null ? Number(product.wholesale_price) : null,
    images: (product.images as string[] | null) ?? null,
    desktop_image_mode: normalizeDesktopImageMode(
      product.desktop_image_mode as string | null | undefined
    ),
    brand: (product.brand as string | null) ?? null,
    department: (product.department as string | null) ?? null,
    subcategory: (product.subcategory as string | null) ?? null,
    abrasivity: normalizeAbrasivity(product.abrasivity as string | null | undefined),
    min_stock: Number(product.min_stock ?? 0),
    stock: input.initialStock ?? 0,
    variant_id: null,
    is_featured: Boolean(product.is_featured),
    is_best_seller: Boolean(product.is_best_seller),
    is_active: Boolean(product.is_active),
    updated_at: (product.updated_at as string | null) ?? null,
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
  if (input.sku !== undefined) updatePayload.sku = input.sku
  if (input.description !== undefined) updatePayload.description = input.description
  if (input.longDescription !== undefined) updatePayload.long_description = input.longDescription
  if (input.basePrice !== undefined) updatePayload.base_price = input.basePrice
  if (input.costPrice !== undefined) updatePayload.cost_price = input.costPrice
  if (input.wholesalePrice !== undefined) updatePayload.wholesale_price = input.wholesalePrice
  if (input.categoryId !== undefined) updatePayload.category_id = input.categoryId
  if (input.subcategory !== undefined) updatePayload.subcategory = input.subcategory
  if (input.brand !== undefined) {
    const normalizedBrandResult = await normalizeBrandValue(input.brand)
    if (normalizedBrandResult.error) {
      return { data: null, error: normalizedBrandResult.error }
    }
    updatePayload.brand = normalizedBrandResult.data
  }
  if (input.department !== undefined) updatePayload.department = input.department
  if (input.abrasivity !== undefined) updatePayload.abrasivity = input.abrasivity ?? null
  if (input.images !== undefined)
    updatePayload.images =
      input.images && input.images.length > 0 ? input.images : null
  if (input.desktopImageMode !== undefined)
    updatePayload.desktop_image_mode = input.desktopImageMode
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive
  if (input.isFeatured !== undefined) updatePayload.is_featured = input.isFeatured
  if (input.isBestSeller !== undefined) updatePayload.is_best_seller = input.isBestSeller
  if (input.minStock !== undefined) updatePayload.min_stock = input.minStock
  updatePayload.updated_at = new Date().toISOString()

  if (input.stock !== undefined && input.stock !== null) {
    const newStock = Number(input.stock)
    const { data: activeVariants } = await supabaseAdmin
      .from("product_variants")
      .select("id, stock")
      .eq("product_id", id)
      .eq("is_active", true)

    await supabaseAdmin
      .from("product_variants")
      .update({ stock: newStock })
      .eq("product_id", id)
      .eq("is_active", true)

    for (const variant of activeVariants ?? []) {
      void notifyStockAlertsForVariant(
        variant.id as string,
        Number(variant.stock),
        newStock
      ).catch((err) =>
        console.error("[admin] Error enviando alertas de stock:", err)
      )
    }
  }

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
      sku,
      description,
      long_description,
      base_price,
      cost_price,
      wholesale_price,
      images,
      desktop_image_mode,
      brand,
      department,
      subcategory,
      abrasivity,
      min_stock,
      is_featured,
      is_best_seller,
      is_active,
      updated_at,
      deleted_at,
      categories (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        stock,
        is_active
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

  const updatedVariants = (data as { product_variants?: Array<{ id: string; stock: number; is_active: boolean }> | null }).product_variants ?? []
  const updatedActiveVariant = updatedVariants.find((v) => v.is_active) ?? updatedVariants[0] ?? null

  const updated: AdminProductWithCategory = {
    id: data.id as string,
    category_id: data.category_id as string,
    name: data.name as string,
    slug: data.slug as string,
    sku: (data.sku as string | null) ?? null,
    description: (data.description as string) ?? null,
    long_description: (data.long_description as string | null) ?? null,
    base_price: Number(data.base_price),
    cost_price: data.cost_price !== null ? Number(data.cost_price) : null,
    wholesale_price: data.wholesale_price !== null ? Number(data.wholesale_price) : null,
    images: (data.images as string[] | null) ?? null,
    desktop_image_mode: normalizeDesktopImageMode(
      data.desktop_image_mode as string | null | undefined
    ),
    brand: (data.brand as string | null) ?? null,
    department: (data.department as string | null) ?? null,
    subcategory: (data.subcategory as string | null) ?? null,
    abrasivity: normalizeAbrasivity(data.abrasivity as string | null | undefined),
    min_stock: Number(data.min_stock ?? 0),
    stock: updatedActiveVariant ? Number(updatedActiveVariant.stock) : (input.stock ?? 0),
    variant_id: updatedActiveVariant?.id ?? null,
    is_featured: Boolean(data.is_featured),
    is_best_seller: Boolean(data.is_best_seller),
    is_active: Boolean(data.is_active),
    updated_at: (data.updated_at as string | null) ?? null,
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

export async function getAdminProductVariants(
  productId: string
): Promise<Result<AdminProductVariant[]>> {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select("id, product_id, sku, variant_name, price, stock, is_active")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      product_id: row.product_id as string,
      sku: row.sku as string,
      variant_name: row.variant_name as string,
      price: Number(row.price),
      stock: Number(row.stock),
      is_active: Boolean(row.is_active),
    })),
    error: null,
  }
}

export async function createAdminProductVariant(
  productId: string,
  input: CreateVariantInput
): Promise<Result<AdminProductVariant>> {
  const providedSku = input.sku?.trim()
  const fallbackSku = `${productId.slice(0, 8)}-${Date.now().toString(36)}`.toUpperCase()
  const sku =
    providedSku && providedSku.length > 0 ? providedSku.toUpperCase() : fallbackSku

  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .insert({
      product_id: productId,
      sku,
      variant_name: input.variantName,
      price: input.price,
      stock: input.stock,
      is_active: input.isActive ?? true,
    })
    .select("id, product_id, sku, variant_name, price, stock, is_active")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear la presentación",
        code: error?.code,
      },
    }
  }

  const createdStock = Number(data.stock)
  if (createdStock > 0) {
    void notifyStockAlertsForVariant(data.id as string, 0, createdStock).catch(
      (err) => console.error("[admin] Error enviando alertas de stock:", err)
    )
  }

  return {
    data: {
      id: data.id as string,
      product_id: data.product_id as string,
      sku: data.sku as string,
      variant_name: data.variant_name as string,
      price: Number(data.price),
      stock: createdStock,
      is_active: Boolean(data.is_active),
    },
    error: null,
  }
}

export async function updateAdminProductVariant(
  variantId: string,
  input: UpdateVariantInput
): Promise<Result<AdminProductVariant>> {
  let previousStock: number | null = null
  if (input.stock !== undefined) {
    const { data: before } = await supabaseAdmin
      .from("product_variants")
      .select("stock")
      .eq("id", variantId)
      .maybeSingle()
    previousStock = before ? Number(before.stock) : 0
  }

  const payload: Record<string, unknown> = {}
  if (input.variantName !== undefined) payload.variant_name = input.variantName
  if (input.sku !== undefined) payload.sku = input.sku ? input.sku.toUpperCase() : null
  if (input.price !== undefined) payload.price = input.price
  if (input.stock !== undefined) payload.stock = input.stock
  if (input.isActive !== undefined) payload.is_active = input.isActive

  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .update(payload)
    .eq("id", variantId)
    .select("id, product_id, sku, variant_name, price, stock, is_active")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar la presentación",
        code: error?.code,
      },
    }
  }

  const updatedStock = Number(data.stock)
  if (previousStock !== null) {
    void notifyStockAlertsForVariant(variantId, previousStock, updatedStock).catch(
      (err) => console.error("[admin] Error enviando alertas de stock:", err)
    )
  }

  return {
    data: {
      id: data.id as string,
      product_id: data.product_id as string,
      sku: data.sku as string,
      variant_name: data.variant_name as string,
      price: Number(data.price),
      stock: updatedStock,
      is_active: Boolean(data.is_active),
    },
    error: null,
  }
}

export async function deleteAdminProductVariant(
  variantId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("product_variants")
    .delete()
    .eq("id", variantId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

