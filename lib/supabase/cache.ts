import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import {
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"

import type {
  Category,
  Product,
  ProductDesktopImageMode,
  ProductWithCategory,
  ProductVariant,
  ProductWithVariants,
} from "./products"
import type { ProfessionalRow, ServiceRow } from "./appointments"

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function dbAdminReadonly() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return db()
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )
}

type DbError = { message: string; code?: string }
type Result<T> = { data: T; error: null } | { data: null; error: DbError }
export type HomeBrandItem = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  show_on_home: boolean
  description: string | null
}

type VariantRow = {
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
  desktop_image_mode?: string | null
  brand: string | null
  abrasivity?: string | null
  is_featured: boolean
  is_best_seller?: boolean | null
  is_active: boolean
  updated_at?: string | null
  created_at?: string | null
  categories?: Category | null
  product_variants?: VariantRow[] | VariantRow | null
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

const PRODUCT_SELECT = `
  id, category_id, name, slug, description, base_price, images, desktop_image_mode, brand, abrasivity,
  is_featured, is_best_seller, is_active, updated_at, created_at, deleted_at,
  categories ( id, name, slug ),
  product_variants ( id, product_id, sku, variant_name, price, stock, is_active )
`

function mapVariant(v: VariantRow): ProductVariant {
  return {
    id: v.id,
    product_id: v.product_id,
    sku: v.sku,
    variant_name: v.variant_name,
    price: Number(v.price),
    stock: Number(v.stock),
    is_active: Boolean(v.is_active),
  }
}

function mapProduct(row: ProductRow): ProductWithCategory | null {
  const cat = row.categories
  if (!cat?.id) return null
  const raw = row.product_variants
  const variants = Array.isArray(raw) ? raw : raw ? [raw] : []
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    base_price: Number(row.base_price),
    images: row.images ?? null,
    desktop_image_mode: normalizeDesktopImageMode(row.desktop_image_mode),
    brand: row.brand ?? null,
    abrasivity: normalizeAbrasivity(row.abrasivity),
    is_featured: Boolean(row.is_featured),
    is_best_seller: Boolean(row.is_best_seller),
    is_active: Boolean(row.is_active),
    updated_at: row.updated_at ?? null,
    created_at: row.created_at ?? null,
    category: { id: cat.id, name: cat.name, slug: cat.slug },
    variants: variants.map(mapVariant),
  }
}

/* ── Categories ──────────────────────────────────────────────────────────── */

export const getCategoriesCached = unstable_cache(
  async (): Promise<Result<Category[]>> => {
    const { data, error } = await db()
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true })
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    return { data: (data ?? []) as Category[], error: null }
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
)

/* ── Brands ──────────────────────────────────────────────────────────────── */

export const getBrandsCached = unstable_cache(
  async (): Promise<Result<string[]>> => {
    const { data, error } = await dbAdminReadonly()
      .from("brands")
      .select("name")
      .order("name", { ascending: true })
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const names = (data ?? []).flatMap((row) =>
      typeof row.name === "string" && row.name.trim() ? [row.name as string] : []
    )
    return { data: names, error: null }
  },
  ["brands"],
  { revalidate: 300, tags: ["brands"] }
)

type BrandRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  show_on_home: boolean | null
  description?: string | null
}

function mapBrandRow(row: BrandRow): HomeBrandItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
    show_on_home: Boolean(row.show_on_home),
    description: row.description ?? null,
  }
}

async function fetchBrandsWithLogo(): Promise<Result<HomeBrandItem[]>> {
  const withDescription = await dbAdminReadonly()
    .from("brands")
    .select("id, name, slug, logo_url, show_on_home, description")
    .not("logo_url", "is", null)
    .neq("logo_url", "")
    .order("name", { ascending: true })

  if (withDescription.error && withDescription.error.code !== "42703") {
    return {
      data: null,
      error: {
        message: withDescription.error.message,
        code: withDescription.error.code,
      },
    }
  }

  if (!withDescription.error) {
    const rows = (withDescription.data ?? []) as unknown as BrandRow[]
    const brands = rows
      .map(mapBrandRow)
      .filter(
        (b) =>
          typeof b.name === "string" &&
          b.name.trim().length > 0 &&
          typeof b.logo_url === "string" &&
          b.logo_url.trim().length > 0
      )
    return { data: brands, error: null }
  }

  // Columna description no existe — fallback sin ella.
  const fallback = await dbAdminReadonly()
    .from("brands")
    .select("id, name, slug, logo_url, show_on_home")
    .not("logo_url", "is", null)
    .neq("logo_url", "")
    .order("name", { ascending: true })

  if (fallback.error) {
    if (fallback.error.code === "42703") return { data: [], error: null }
    return {
      data: null,
      error: { message: fallback.error.message, code: fallback.error.code },
    }
  }

  const rows = (fallback.data ?? []) as unknown as BrandRow[]
  const brands = rows
    .map(mapBrandRow)
    .filter(
      (b) =>
        typeof b.name === "string" &&
        b.name.trim().length > 0 &&
        typeof b.logo_url === "string" &&
        b.logo_url.trim().length > 0
    )
  return { data: brands, error: null }
}

export const getBrandsWithLogoCached = unstable_cache(
  async (): Promise<Result<HomeBrandItem[]>> => {
    return fetchBrandsWithLogo()
  },
  ["brands-with-logo"],
  { revalidate: 300, tags: ["brands"] }
)

async function fetchAllBrandsFull(): Promise<Result<HomeBrandItem[]>> {
  const withDescription = await dbAdminReadonly()
    .from("brands")
    .select("id, name, slug, logo_url, show_on_home, description")
    .order("name", { ascending: true })

  if (withDescription.error && withDescription.error.code !== "42703") {
    return {
      data: null,
      error: {
        message: withDescription.error.message,
        code: withDescription.error.code,
      },
    }
  }

  if (!withDescription.error) {
    const rows = (withDescription.data ?? []) as unknown as BrandRow[]
    return {
      data: rows
        .map(mapBrandRow)
        .filter((b) => typeof b.name === "string" && b.name.trim().length > 0),
      error: null,
    }
  }

  const fallback = await dbAdminReadonly()
    .from("brands")
    .select("id, name, slug, logo_url, show_on_home")
    .order("name", { ascending: true })

  if (fallback.error) {
    if (fallback.error.code === "42703") return { data: [], error: null }
    return {
      data: null,
      error: { message: fallback.error.message, code: fallback.error.code },
    }
  }

  const rows = (fallback.data ?? []) as unknown as BrandRow[]
  return {
    data: rows
      .map(mapBrandRow)
      .filter((b) => typeof b.name === "string" && b.name.trim().length > 0),
    error: null,
  }
}

export const getAllBrandsFullCached = unstable_cache(
  async (): Promise<Result<HomeBrandItem[]>> => {
    return fetchAllBrandsFull()
  },
  ["brands-all-full"],
  { revalidate: 300, tags: ["brands"] }
)

export const getHomeBrandsCached = unstable_cache(
  async (): Promise<Result<HomeBrandItem[]>> => {
    const { data, error } = await dbAdminReadonly()
      .from("brands")
      .select("id, name, slug, logo_url, show_on_home")
      .eq("show_on_home", true)
      .order("name", { ascending: true })

    if (!error) {
      const brands: HomeBrandItem[] = (data ?? [])
        .map((row) => ({
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
          logo_url: (row.logo_url as string | null) ?? null,
          show_on_home: Boolean(row.show_on_home),
          description: null,
        }))
        .filter((brand) => typeof brand.name === "string" && brand.name.trim().length > 0)
      return { data: brands, error: null }
    }

    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await dbAdminReadonly()
        .from("brands")
        .select("id, name, slug, logo_url")
        .order("name", { ascending: true })

      if (fallbackError) {
        return {
          data: null,
          error: { message: fallbackError.message, code: fallbackError.code },
        }
      }

      const brands: HomeBrandItem[] = (fallbackData ?? [])
        .map((row) => {
          const logo = (row.logo_url as string | null) ?? null
          return {
            id: row.id as string,
            name: row.name as string,
            slug: row.slug as string,
            logo_url: logo,
            show_on_home: typeof logo === "string" && logo.trim().length > 0,
            description: null,
          }
        })
        .filter((brand) => brand.show_on_home)

      return { data: brands, error: null }
    }

    return { data: null, error: { message: error.message, code: error.code } }
  },
  ["home-brands"],
  { revalidate: 300, tags: ["brands"] }
)

/* ── All products (full catalog, no filters) ─────────────────────────────── */

export const RECENT_PRODUCTS_LIMIT = 21

export const getAllProductsCached = unstable_cache(
  async (): Promise<Result<ProductWithCategory[]>> => {
    const { data, error } = await db()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true })
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const products = (data ?? [])
      .map((row) => mapProduct(row as unknown as ProductRow))
      .filter((p): p is ProductWithCategory => p !== null)
    return { data: products, error: null }
  },
  ["products-all"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Newest products (mega menu + /tienda/nuevos) ──────────────────────── */

export const getNewestProductsCached = unstable_cache(
  async (): Promise<Result<ProductWithCategory[]>> => {
    const { data, error } = await db()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(RECENT_PRODUCTS_LIMIT)
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const products = (data ?? [])
      .map((row) => mapProduct(row as unknown as ProductRow))
      .filter((p): p is ProductWithCategory => p !== null)
    return { data: products, error: null }
  },
  ["products-newest"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Featured products ───────────────────────────────────────────────────── */

export const getFeaturedProductsCached = unstable_cache(
  async (): Promise<Result<Product[]>> => {
    const { data, error } = await db()
      .from("products")
      .select(
        "id, category_id, name, slug, description, base_price, images, desktop_image_mode, brand, abrasivity, is_featured, is_best_seller, is_active, updated_at, created_at"
      )
      .eq("is_featured", true)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12)
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const products = (data ?? []).map((row) => ({
      id: row.id as string,
      category_id: row.category_id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string | null) ?? null,
      base_price: Number(row.base_price),
      images: (row.images as string[] | null) ?? null,
      desktop_image_mode: normalizeDesktopImageMode(
        row.desktop_image_mode as string | null | undefined
      ),
      brand: (row.brand as string | null) ?? null,
      abrasivity: normalizeAbrasivity(row.abrasivity as string | null | undefined),
      is_featured: Boolean(row.is_featured),
      is_best_seller: Boolean(row.is_best_seller),
      is_active: Boolean(row.is_active),
      updated_at: (row.updated_at as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
    }))
    return { data: products, error: null }
  },
  ["products-featured"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Best sellers ────────────────────────────────────────────────────────── */

export const getBestSellersCached = unstable_cache(
  async (): Promise<Result<ProductWithCategory[]>> => {
    const { data, error } = await db()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_best_seller", true)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12)
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const products = (data ?? [])
      .map((row) => mapProduct(row as unknown as ProductRow))
      .filter((p): p is ProductWithCategory => p !== null)
    return { data: products, error: null }
  },
  ["products-best-sellers"],
  { revalidate: 120, tags: ["products", "best-sellers"] }
)

/* ── Top searches (chips de "Más buscados") ──────────────────────────────── */

export type TopSearchItem = {
  id: string
  label: string
  href: string | null
}

export const getTopSearchesCached = unstable_cache(
  async (): Promise<Result<TopSearchItem[]>> => {
    const { data, error } = await db()
      .from("top_searches")
      .select("id, label, href, position")
      .eq("is_enabled", true)
      .order("position", { ascending: true })
      .limit(24)
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const items: TopSearchItem[] = (data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      href: (row.href as string | null) ?? null,
    }))
    return { data: items, error: null }
  },
  ["top-searches"],
  { revalidate: 300, tags: ["top-searches"] }
)

/* ── Announcement bar (línea superior con slides) ────────────────────────── */

export type AnnouncementItem = {
  id: string
  label: string
  href: string | null
}

export const getAnnouncementsCached = unstable_cache(
  async (): Promise<Result<AnnouncementItem[]>> => {
    const { data, error } = await db()
      .from("announcements")
      .select("id, label, href, position")
      .eq("is_enabled", true)
      .order("position", { ascending: true })
      .limit(12)
    if (error) {
      // Tabla inexistente: degrada en vacío en vez de romper el render.
      if (error.code === "42P01") return { data: [], error: null }
      return { data: null, error: { message: error.message, code: error.code } }
    }
    const items: AnnouncementItem[] = (data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      href: (row.href as string | null) ?? null,
    }))
    return { data: items, error: null }
  },
  ["announcements"],
  { revalidate: 300, tags: ["announcements"] }
)

/* ── Product by slug ─────────────────────────────────────────────────────── */

export const getProductBySlugCached = unstable_cache(
  async (slug: string): Promise<Result<ProductWithVariants>> => {
    const { data, error } = await db()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .is("deleted_at", null)
      .single()
    if (error || !data) {
      return {
        data: null,
        error: { message: error?.message ?? "Producto no encontrado", code: error?.code },
      }
    }
    const row = data as unknown as ProductRow
    const cat = row.categories
    if (!cat?.id) {
      return { data: null, error: { message: "Producto sin categoría", code: "MISSING_CATEGORY" } }
    }
    const raw = row.product_variants
    const variants = Array.isArray(raw) ? raw : raw ? [raw] : []
    const product: ProductWithVariants = {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? null,
      base_price: Number(row.base_price),
      images: row.images ?? null,
      desktop_image_mode: normalizeDesktopImageMode(row.desktop_image_mode),
      brand: row.brand ?? null,
      abrasivity: normalizeAbrasivity(row.abrasivity),
      is_featured: Boolean(row.is_featured),
      is_best_seller: Boolean(row.is_best_seller),
      is_active: Boolean(row.is_active),
      updated_at: row.updated_at ?? null,
      created_at: row.created_at ?? null,
      category: { id: cat.id, name: cat.name, slug: cat.slug },
      variants: variants.map(mapVariant),
    }
    return { data: product, error: null }
  },
  ["product-slug"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Related products ────────────────────────────────────────────────────── */

export const getRelatedProductsCached = unstable_cache(
  async (
    categoryId: string,
    brand: string | null | undefined,
    excludeId: string,
    limit: number = 4
  ): Promise<Result<ProductWithCategory[]>> => {
    const supabase = db()
    const collected: ProductWithCategory[] = []
    const seen = new Set<string>([excludeId])

    const baseQ = () =>
      supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .is("deleted_at", null)
        .neq("id", excludeId)
        .limit(limit * 3)

    const absorb = (rows: unknown[] | null) => {
      for (const row of rows ?? []) {
        if (collected.length >= limit) break
        const p = mapProduct(row as ProductRow)
        if (!p || seen.has(p.id)) continue
        seen.add(p.id)
        collected.push(p)
      }
    }

    const { data: byCat, error: e1 } = await baseQ()
      .eq("category_id", categoryId)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
    if (e1) return { data: null, error: { message: e1.message, code: e1.code } }
    absorb(byCat)

    if (collected.length < limit && brand) {
      const { data: byBrand, error: e2 } = await baseQ()
        .eq("brand", brand)
        .order("name", { ascending: true })
      if (e2) return { data: null, error: { message: e2.message, code: e2.code } }
      absorb(byBrand)
    }

    if (collected.length < limit) {
      const { data: featured, error: e3 } = await baseQ()
        .eq("is_featured", true)
        .order("updated_at", { ascending: false })
      if (e3) return { data: null, error: { message: e3.message, code: e3.code } }
      absorb(featured)
    }

    return { data: collected.slice(0, limit), error: null }
  },
  ["related-products"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Services ────────────────────────────────────────────────────────────── */

export const getServicesCached = unstable_cache(
  async (): Promise<Result<ServiceRow[]>> => {
    const { data, error } = await db()
      .from("services")
      .select("id, name, description, price, duration_min, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true })
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string | null) ?? null,
      price: Number(r.price),
      duration_min: Number(r.duration_min),
      is_active: Boolean(r.is_active),
    }))
    return { data: rows, error: null }
  },
  ["services"],
  { revalidate: 300, tags: ["services"] }
)

/* ── Professionals ───────────────────────────────────────────────────────── */

export const getProfessionalsCached = unstable_cache(
  async (): Promise<Result<ProfessionalRow[]>> => {
    const { data, error } = await db()
      .from("professionals")
      .select("id, name, bio, photo_url, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true })
    if (error) return { data: null, error: { message: error.message, code: error.code } }
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      bio: (r.bio as string | null) ?? null,
      photo_url: (r.photo_url as string | null) ?? null,
      is_active: Boolean(r.is_active),
    }))
    return { data: rows, error: null }
  },
  ["professionals"],
  { revalidate: 300, tags: ["professionals"] }
)
