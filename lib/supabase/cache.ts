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
import type {
  ProfessionalRow,
  ServiceRow,
  ServiceWithOptions,
} from "./appointments"
import { getPublicServicesWithOptions, mapServiceRecord, queryServiceRows } from "./servicesAdmin"

function adminDb() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return db()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )
}

async function loadProfessionalFilterIdsMap(
  professionalIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (professionalIds.length === 0) return map

  try {
    const { data, error } = await adminDb()
      .from("professional_filter_links")
      .select("professional_id, filter_id")
      .in("professional_id", professionalIds)

    if (error) return map

    for (const row of data ?? []) {
      const professionalId = row.professional_id as string
      const filterId = row.filter_id as string
      const current = map.get(professionalId) ?? []
      current.push(filterId)
      map.set(professionalId, current)
    }
  } catch {
    return map
  }

  return map
}

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

/**
 * Ejecuta una consulta que devuelve `{ data, error }` reintentando ante fallos
 * transitorios (timeouts, cold starts, límites de conexión de Supabase). Si tras
 * los reintentos sigue fallando, LANZA — a propósito, para que `unstable_cache`
 * NO cachee el error (evita envenenar la caché y mostrar el mensaje de error a
 * todos los visitantes durante toda la ventana de revalidación).
 */
async function withRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: DbError | null }>,
  opts: { tries?: number; passthroughCodes?: string[] } = {}
): Promise<T | null> {
  const { tries = 3, passthroughCodes = [] } = opts
  let lastError: DbError | null = null
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const { data, error } = await fn()
      if (!error) return data
      // Errores esperados (p. ej. tabla/columna inexistente): no reintentar ni
      // lanzar; degradar en `null` para que el llamador use un valor por defecto.
      if (error.code && passthroughCodes.includes(error.code)) return null
      lastError = error
    } catch (e) {
      lastError = { message: e instanceof Error ? e.message : "query failed" }
    }
    if (attempt < tries - 1) {
      await new Promise((res) => setTimeout(res, 150 * (attempt + 1)))
    }
  }
  throw new Error(lastError?.message ?? "query failed")
}

/**
 * Envuelve una función que LANZA ante error en una versión cacheada que devuelve
 * el contrato `Result`. Como la función interna lanza (en vez de devolver un
 * error), `unstable_cache` nunca cachea fallos: el siguiente request reintenta.
 */
function cachedResult<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  keyParts: string[],
  opts: { revalidate: number; tags: string[] }
): (...args: A) => Promise<Result<T>> {
  const inner = unstable_cache(fn, keyParts, opts)
  return async (...args: A) => {
    try {
      return { data: await inner(...args), error: null }
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : "query failed" },
      }
    }
  }
}

/**
 * Ejecuta un constructor de consulta de Supabase con reintentos y devuelve las
 * filas tipadas. `make` DEBE reconstruir la consulta en cada llamada (los
 * builders de Supabase solo se ejecutan una vez), por eso recibe una fábrica.
 */
function retryRows<T>(
  make: () => PromiseLike<unknown>,
  passthroughCodes?: string[]
): Promise<T[] | null> {
  return withRetry<T[]>(
    () => make() as unknown as PromiseLike<{ data: T[] | null; error: DbError | null }>,
    { passthroughCodes }
  )
}

// Ejecuta una consulta de catálogo (PRODUCT_SELECT) con reintentos y mapea filas.
async function retryProductList(
  make: () => PromiseLike<unknown>
): Promise<ProductWithCategory[]> {
  const rows = await retryRows<ProductRow>(make)
  return (rows ?? [])
    .map(mapProduct)
    .filter((p): p is ProductWithCategory => p !== null)
}
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
  color_hex?: string | null
  color_name?: string | null
  size_label?: string | null
  is_limited_edition?: boolean | null
}

type ProductRow = {
  id: string
  category_id: string
  name: string
  slug: string
  subcategory?: string | null
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
  id, category_id, name, slug, subcategory, description, long_description, application_text, base_price, discount_percent, images, desktop_image_mode, brand, abrasivity,
  is_featured, is_best_seller, is_active, updated_at, created_at, deleted_at,
  categories ( id, name, slug ),
  product_variants ( id, product_id, sku, variant_name, price, stock, is_active, color_hex, color_name, size_label, is_limited_edition )
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
    color_hex: v.color_hex ?? null,
    color_name: v.color_name ?? null,
    size_label: v.size_label ?? null,
    is_limited_edition: Boolean(v.is_limited_edition ?? false),
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
    subcategory: row.subcategory ?? null,
    description: row.description ?? null,
    long_description: row.long_description ?? null,
    application_text: row.application_text ?? null,
    base_price: Number(row.base_price),
    discount_percent: Number(row.discount_percent ?? 0),
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

export const getCategoriesCached = cachedResult(
  async (): Promise<Category[]> => {
    const data = await withRetry<Category[]>(() =>
      db()
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true })
    )
    return (data ?? []) as Category[]
  },
  ["categories"],
  { revalidate: 300, tags: ["categories"] }
)

/* ── Brands ──────────────────────────────────────────────────────────────── */

export const getBrandsCached = cachedResult(
  async (): Promise<string[]> => {
    const rows = await retryRows<{ name: string | null }>(() =>
      dbAdminReadonly().from("brands").select("name").order("name", { ascending: true })
    )
    return (rows ?? []).flatMap((row) =>
      typeof row.name === "string" && row.name.trim() ? [row.name] : []
    )
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

// Filtra marcas válidas; opcionalmente exige logo.
function normalizeBrandRows(
  rows: BrandRow[] | null,
  requireLogo: boolean
): HomeBrandItem[] {
  return (rows ?? []).map(mapBrandRow).filter((b) => {
    if (typeof b.name !== "string" || b.name.trim().length === 0) return false
    if (!requireLogo) return true
    return typeof b.logo_url === "string" && b.logo_url.trim().length > 0
  })
}

async function fetchBrandsWithLogo(): Promise<HomeBrandItem[]> {
  const withDescription = await retryRows<BrandRow>(
    () =>
      dbAdminReadonly()
        .from("brands")
        .select("id, name, slug, logo_url, show_on_home, description")
        .not("logo_url", "is", null)
        .neq("logo_url", "")
        .order("name", { ascending: true }),
    ["42703"]
  )
  if (withDescription) return normalizeBrandRows(withDescription, true)

  // Columna description no existe — fallback sin ella.
  const fallback = await retryRows<BrandRow>(
    () =>
      dbAdminReadonly()
        .from("brands")
        .select("id, name, slug, logo_url, show_on_home")
        .not("logo_url", "is", null)
        .neq("logo_url", "")
        .order("name", { ascending: true }),
    ["42703"]
  )
  return normalizeBrandRows(fallback, true)
}

export const getBrandsWithLogoCached = cachedResult(
  fetchBrandsWithLogo,
  ["brands-with-logo"],
  { revalidate: 300, tags: ["brands"] }
)

async function fetchAllBrandsFull(): Promise<HomeBrandItem[]> {
  const withDescription = await retryRows<BrandRow>(
    () =>
      dbAdminReadonly()
        .from("brands")
        .select("id, name, slug, logo_url, show_on_home, description")
        .order("name", { ascending: true }),
    ["42703"]
  )
  if (withDescription) return normalizeBrandRows(withDescription, false)

  const fallback = await retryRows<BrandRow>(
    () =>
      dbAdminReadonly()
        .from("brands")
        .select("id, name, slug, logo_url, show_on_home")
        .order("name", { ascending: true }),
    ["42703"]
  )
  return normalizeBrandRows(fallback, false)
}

export const getAllBrandsFullCached = cachedResult(
  fetchAllBrandsFull,
  ["brands-all-full"],
  { revalidate: 300, tags: ["brands"] }
)

export const getHomeBrandsCached = cachedResult(
  async (): Promise<HomeBrandItem[]> => {
    const primary = await retryRows<BrandRow>(
      () =>
        dbAdminReadonly()
          .from("brands")
          .select("id, name, slug, logo_url, show_on_home")
          .eq("show_on_home", true)
          .order("name", { ascending: true }),
      ["42703"]
    )
    if (primary) {
      return primary
        .map(mapBrandRow)
        .filter((b) => typeof b.name === "string" && b.name.trim().length > 0)
    }

    // Columna show_on_home no existe — deriva de la presencia de logo.
    const fallback = await retryRows<BrandRow>(
      () =>
        dbAdminReadonly()
          .from("brands")
          .select("id, name, slug, logo_url")
          .order("name", { ascending: true }),
      ["42703"]
    )
    return (fallback ?? [])
      .map((row) => {
        const item = mapBrandRow(row)
        return {
          ...item,
          show_on_home:
            typeof item.logo_url === "string" && item.logo_url.trim().length > 0,
        }
      })
      .filter((b) => b.show_on_home)
  },
  ["home-brands"],
  { revalidate: 300, tags: ["brands"] }
)

/* ── All products (full catalog, no filters) ─────────────────────────────── */

export const RECENT_PRODUCTS_LIMIT = 21

export const getAllProductsCached = cachedResult(
  async (): Promise<ProductWithCategory[]> =>
    retryProductList(() =>
      db()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name", { ascending: true })
    ),
  ["products-all"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Newest products (mega menu + /tienda/nuevos) ──────────────────────── */

export const getNewestProductsCached = cachedResult(
  async (): Promise<ProductWithCategory[]> =>
    retryProductList(() =>
      db()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(RECENT_PRODUCTS_LIMIT)
    ),
  ["products-newest"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Featured products ───────────────────────────────────────────────────── */

export const getFeaturedProductsCached = cachedResult(
  async (): Promise<Product[]> => {
    const data = await retryRows<Record<string, unknown>>(() =>
      db()
        .from("products")
        .select(
          "id, category_id, name, slug, subcategory, description, long_description, application_text, base_price, discount_percent, images, desktop_image_mode, brand, abrasivity, is_featured, is_best_seller, is_active, updated_at, created_at"
        )
        .eq("is_featured", true)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12)
    )
    return (data ?? []).map((row) => ({
      id: row.id as string,
      category_id: row.category_id as string,
      name: row.name as string,
      slug: row.slug as string,
      subcategory:
        ((row as { subcategory?: string | null }).subcategory as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      long_description:
        ((row as { long_description?: string | null }).long_description as string | null) ?? null,
      application_text:
        ((row as { application_text?: string | null }).application_text as string | null) ?? null,
      base_price: Number(row.base_price),
      discount_percent: Number((row as { discount_percent?: number | string | null }).discount_percent ?? 0),
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
  },
  ["products-featured"],
  { revalidate: 120, tags: ["products"] }
)

/* ── On sale products (discount_percent > 0) ─────────────────────────────── */

export const getOnSaleProductsCached = cachedResult(
  async (): Promise<ProductWithCategory[]> =>
    retryProductList(() =>
      db()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .is("deleted_at", null)
        .gt("discount_percent", 0)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
    ),
  ["products-on-sale"],
  { revalidate: 120, tags: ["products", "on-sale"] }
)

export const getOnSaleCountCached = cachedResult(
  async (): Promise<number> => {
    const count = await withRetry<number>(async () => {
      const { count: c, error } = await db()
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("deleted_at", null)
        .gt("discount_percent", 0)
      return { data: c ?? 0, error: error ? { message: error.message, code: error.code } : null }
    })
    return count ?? 0
  },
  ["products-on-sale-count"],
  { revalidate: 120, tags: ["products", "on-sale"] }
)

/* ── Best sellers ────────────────────────────────────────────────────────── */

export const getBestSellersCached = cachedResult(
  async (): Promise<ProductWithCategory[]> =>
    retryProductList(() =>
      db()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_best_seller", true)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12)
    ),
  ["products-best-sellers"],
  { revalidate: 120, tags: ["products", "best-sellers"] }
)

/* ── Top searches (chips de "Más buscados") ──────────────────────────────── */

export type TopSearchItem = {
  id: string
  label: string
  href: string | null
}

export const getTopSearchesCached = cachedResult(
  async (): Promise<TopSearchItem[]> => {
    const data = await retryRows<Record<string, unknown>>(() =>
      db()
        .from("top_searches")
        .select("id, label, href, position")
        .eq("is_enabled", true)
        .order("position", { ascending: true })
        .limit(24)
    )
    return (data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      href: (row.href as string | null) ?? null,
    }))
  },
  ["top-searches"],
  { revalidate: 300, tags: ["top-searches"] }
)

/* ── Announcement bar (línea superior con slides) ────────────────────────── */

export const getAnnouncementBarEnabledCached = unstable_cache(
  async (): Promise<boolean> => {
    try {
      // dbAdminReadonly (no db()): `app_settings` tiene RLS sin política de
      // lectura pública, así que con la anon key esta consulta devuelve SIEMPRE
      // vacío → el flag se leía como false y la barra no podía encenderse por
      // más que el panel la marcara. Es una lectura de servidor, cacheada y de
      // un único valor booleano público; el service key nunca sale de aquí.
      const row = await withRetry<{ value: unknown }>(
        async () => {
          const { data, error } = await dbAdminReadonly()
            .from("app_settings")
            .select("value")
            .eq("key", "announcement_bar_enabled")
            .maybeSingle()
          return {
            data: data as { value: unknown } | null,
            error: error ? { message: error.message, code: error.code } : null,
          }
        },
        { passthroughCodes: ["42P01"] }
      )
      const value = row?.value
      return value === true || value === "true"
    } catch {
      // Fallo persistente: degrada ocultando la barra (default seguro).
      return false
    }
  },
  ["announcement-bar-enabled"],
  { revalidate: 300, tags: ["announcement-bar-settings"] }
)

export type AnnouncementItem = {
  id: string
  label: string
  href: string | null
}

export const getAnnouncementsCached = cachedResult(
  async (): Promise<AnnouncementItem[]> => {
    // 42P01 (tabla inexistente): degrada en vacío en vez de romper el render.
    const data = await retryRows<Record<string, unknown>>(
      () =>
        db()
          .from("announcements")
          .select("id, label, href, position")
          .eq("is_enabled", true)
          .order("position", { ascending: true })
          .limit(12),
      ["42P01"]
    )
    return (data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      href: (row.href as string | null) ?? null,
    }))
  },
  ["announcements"],
  { revalidate: 300, tags: ["announcements"] }
)

/* ── Product by slug ─────────────────────────────────────────────────────── */

export const getProductBySlugCached = cachedResult(
  async (slug: string): Promise<ProductWithVariants> => {
    // PGRST116 (0 filas) es un "no encontrado" legítimo, no un fallo transitorio.
    const row = await withRetry<ProductRow>(
      async () => {
        const { data, error } = await db()
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("slug", slug)
          .is("deleted_at", null)
          .single()
        return {
          data: data as unknown as ProductRow | null,
          error: error ? { message: error.message, code: error.code } : null,
        }
      },
      { passthroughCodes: ["PGRST116"] }
    )
    if (!row) throw new Error("Producto no encontrado")
    const cat = row.categories
    if (!cat?.id) {
      throw new Error("Producto sin categoría")
    }
    const raw = row.product_variants
    const variants = Array.isArray(raw) ? raw : raw ? [raw] : []
    const product: ProductWithVariants = {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      subcategory: row.subcategory ?? null,
      description: row.description ?? null,
      long_description: row.long_description ?? null,
      application_text: row.application_text ?? null,
      base_price: Number(row.base_price),
      discount_percent: Number(row.discount_percent ?? 0),
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
    return product
  },
  ["product-slug"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Related products ────────────────────────────────────────────────────── */

export const getRelatedProductsCached = cachedResult(
  async (
    categoryId: string,
    brand: string | null | undefined,
    excludeId: string,
    limit: number = 4
  ): Promise<ProductWithCategory[]> => {
    const collected: ProductWithCategory[] = []
    const seen = new Set<string>([excludeId])

    const baseQ = () =>
      db()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .is("deleted_at", null)
        .neq("id", excludeId)
        .limit(limit * 3)

    const absorb = (rows: ProductRow[] | null) => {
      for (const row of rows ?? []) {
        if (collected.length >= limit) break
        const p = mapProduct(row)
        if (!p || seen.has(p.id)) continue
        seen.add(p.id)
        collected.push(p)
      }
    }

    absorb(
      await retryRows<ProductRow>(() =>
        baseQ()
          .eq("category_id", categoryId)
          .order("is_featured", { ascending: false })
          .order("name", { ascending: true })
      )
    )

    if (collected.length < limit && brand) {
      absorb(
        await retryRows<ProductRow>(() =>
          baseQ().eq("brand", brand).order("name", { ascending: true })
        )
      )
    }

    if (collected.length < limit) {
      absorb(
        await retryRows<ProductRow>(() =>
          baseQ().eq("is_featured", true).order("updated_at", { ascending: false })
        )
      )
    }

    return collected.slice(0, limit)
  },
  ["related-products"],
  { revalidate: 120, tags: ["products"] }
)

/* ── Services ────────────────────────────────────────────────────────────── */

export const getServicesCached = cachedResult(
  async (): Promise<ServiceRow[]> => {
    const rows = await withRetry(async () => {
      const result = await queryServiceRows(db(), { activeOnly: true })
      return {
        data: result.data,
        error: result.error
          ? { message: result.error.message, code: result.error.code }
          : null,
      }
    })
    return (rows ?? []).map(mapServiceRecord)
  },
  ["services"],
  { revalidate: 300, tags: ["services"] }
)

export const getServicesWithOptionsCached = cachedResult(
  async (): Promise<ServiceWithOptions[]> => {
    const data = await withRetry(async () => {
      const result = await getPublicServicesWithOptions()
      return { data: result.data, error: result.error ?? null }
    })
    return data ?? []
  },
  ["services-with-options"],
  { revalidate: 300, tags: ["services"] }
)

/* ── Professionals ───────────────────────────────────────────────────────── */

export const getProfessionalsCached = cachedResult(
  async (): Promise<ProfessionalRow[]> => {
    const data = await retryRows<Record<string, unknown>>(() =>
      adminDb()
        .from("professionals")
        .select("id, name, bio, photo_url, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true })
    )

    const professionalIds = (data ?? []).map((row) => row.id as string)
    const filterIdsByProfessional =
      await loadProfessionalFilterIdsMap(professionalIds)

    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      bio: (r.bio as string | null) ?? null,
      photo_url: (r.photo_url as string | null) ?? null,
      is_active: Boolean(r.is_active),
      filter_ids: filterIdsByProfessional.get(r.id as string) ?? [],
    }))
  },
  ["professionals"],
  { revalidate: 60, tags: ["professionals"] }
)
