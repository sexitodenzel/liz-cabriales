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
}

export type UpdateAdminProductInput = Partial<CreateAdminProductInput>

function categoryFromJoin(row: { categories?: unknown }): AdminCategory | null {
  const c = row.categories as AdminCategory | null | undefined
  return c?.id ? c : null
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    .map((row: any) => {
      const cat = categoryFromJoin(row)
      if (!cat) return null
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
        deleted_at: row.deleted_at as string | null,
        category: { id: cat.id, name: cat.name, slug: cat.slug },
      }
    })
    .filter((p) => p !== null) as AdminProductWithCategory[]

  return { data: products, error: null }
}

export async function createAdminProduct(
  input: CreateAdminProductInput
): Promise<Result<AdminProductWithCategory>> {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      base_price: input.basePrice,
      category_id: input.categoryId,
      brand: input.brand ?? null,
      images: input.images && input.images.length > 0 ? input.images : null,
      is_active: input.isActive ?? true,
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
  if (input.brand !== undefined) updatePayload.brand = input.brand
  if (input.images !== undefined)
    updatePayload.images =
      input.images && input.images.length > 0 ? input.images : null
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive

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

