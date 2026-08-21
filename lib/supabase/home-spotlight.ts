import { createClient } from "@supabase/supabase-js"
import { timeoutFetch } from "./timeoutFetch"
import { unstable_cache } from "next/cache"

/* Datos de la sección "Spotlight" del home (collage editorial estilo OPI).
   Contenido curado por el estudio desde /admin/home-spotlight. Degrada a
   vacío si la tabla aún no existe (sql-home-spotlight.sql sin correr). */

type SupabaseError = { message: string; code?: string }
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type HomeSpotlightItem = {
  id: string
  image_url: string
  avatar_url: string | null
  label: string | null
  link_href: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT =
  "id, image_url, avatar_url, label, link_href, sort_order, is_active, created_at, updated_at"

export type HomeSpotlightSettings = {
  eyebrow: string
  title: string
  subtitle: string
  body: string
  cta_label: string
  cta_href: string
}

const SETTINGS_SELECT = "eyebrow, title, subtitle, body, cta_label, cta_href"

const EMPTY_SETTINGS: HomeSpotlightSettings = {
  eyebrow: "",
  title: "",
  subtitle: "",
  body: "",
  cta_label: "",
  cta_href: "",
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: timeoutFetch } }
  )
}

function dbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: timeoutFetch } }
  )
}

function mapRow(row: unknown): HomeSpotlightItem {
  const r = row as HomeSpotlightItem
  return {
    id: r.id,
    image_url: r.image_url,
    avatar_url: r.avatar_url ?? null,
    label: r.label ?? null,
    link_href: r.link_href ?? null,
    sort_order: Number(r.sort_order ?? 0),
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

/** Items visibles para el home, cacheados. Solo activos, en orden. */
export const getHomeSpotlightItems = unstable_cache(
  async (): Promise<HomeSpotlightItem[]> => {
    const { data, error } = await db()
      .from("home_spotlight_items")
      .select(SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) return []
    return (data ?? []).map(mapRow)
  },
  ["home-spotlight"],
  { revalidate: 300, tags: ["home-spotlight"] }
)

/** Todos los items (activos e inactivos) para el panel admin. */
export async function getAllHomeSpotlightItems(): Promise<
  Result<HomeSpotlightItem[]>
> {
  const { data, error } = await dbAdmin()
    .from("home_spotlight_items")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: (data ?? []).map(mapRow), error: null }
}

export async function createHomeSpotlightItem(input: {
  imageUrl: string
  avatarUrl?: string | null
  label?: string | null
  linkHref?: string | null
}): Promise<Result<HomeSpotlightItem>> {
  const imageUrl = input.imageUrl.trim()
  if (!imageUrl) {
    return {
      data: null,
      error: { message: "La imagen es obligatoria", code: "VALIDATION_ERROR" },
    }
  }

  const { data: maxRow } = await dbAdmin()
    .from("home_spotlight_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((maxRow?.sort_order as number | undefined) ?? -1) + 1

  const { data, error } = await dbAdmin()
    .from("home_spotlight_items")
    .insert({
      image_url: imageUrl,
      avatar_url: input.avatarUrl?.trim() || null,
      label: input.label?.trim() || null,
      link_href: input.linkHref?.trim() || null,
      sort_order: nextSort,
    })
    .select(SELECT)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el item",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data), error: null }
}

export async function updateHomeSpotlightItem(
  id: string,
  fields: {
    imageUrl?: string
    avatarUrl?: string | null
    label?: string | null
    linkHref?: string | null
    isActive?: boolean
  }
): Promise<Result<HomeSpotlightItem>> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (fields.imageUrl !== undefined) {
    const trimmed = fields.imageUrl.trim()
    if (!trimmed) {
      return {
        data: null,
        error: { message: "La imagen es obligatoria", code: "VALIDATION_ERROR" },
      }
    }
    update.image_url = trimmed
  }
  if (fields.avatarUrl !== undefined) update.avatar_url = fields.avatarUrl?.trim() || null
  if (fields.label !== undefined) update.label = fields.label?.trim() || null
  if (fields.linkHref !== undefined) update.link_href = fields.linkHref?.trim() || null
  if (fields.isActive !== undefined) update.is_active = fields.isActive

  const { data, error } = await dbAdmin()
    .from("home_spotlight_items")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el item",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data), error: null }
}

export async function deleteHomeSpotlightItem(id: string): Promise<Result<null>> {
  const { error } = await dbAdmin()
    .from("home_spotlight_items")
    .delete()
    .eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

/** Reordena por lista de ids: la posición en el arreglo pasa a ser sort_order. */
export async function reorderHomeSpotlightItems(
  orderedIds: string[]
): Promise<Result<null>> {
  const updates = orderedIds.map((id, index) =>
    dbAdmin()
      .from("home_spotlight_items")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return {
      data: null,
      error: { message: failed.error.message, code: failed.error.code },
    }
  }
  return { data: null, error: null }
}

function mapSettings(row: unknown): HomeSpotlightSettings {
  const r = (row ?? {}) as Partial<HomeSpotlightSettings>
  return {
    eyebrow: r.eyebrow ?? "",
    title: r.title ?? "",
    subtitle: r.subtitle ?? "",
    body: r.body ?? "",
    cta_label: r.cta_label ?? "",
    cta_href: r.cta_href ?? "",
  }
}

/** Textos del encabezado para el home, cacheados. Degrada a vacío. */
export const getHomeSpotlightSettings = unstable_cache(
  async (): Promise<HomeSpotlightSettings> => {
    const { data, error } = await db()
      .from("home_spotlight_settings")
      .select(SETTINGS_SELECT)
      .eq("id", "default")
      .maybeSingle()

    if (error || !data) return EMPTY_SETTINGS
    return mapSettings(data)
  },
  ["home-spotlight-settings"],
  { revalidate: 300, tags: ["home-spotlight"] }
)

/** Lectura fresca para el panel admin (sin caché). */
export async function getHomeSpotlightSettingsAdmin(): Promise<
  Result<HomeSpotlightSettings>
> {
  const { data, error } = await dbAdmin()
    .from("home_spotlight_settings")
    .select(SETTINGS_SELECT)
    .eq("id", "default")
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: mapSettings(data), error: null }
}

export async function updateHomeSpotlightSettings(
  fields: Partial<HomeSpotlightSettings>
): Promise<Result<HomeSpotlightSettings>> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of [
    "eyebrow",
    "title",
    "subtitle",
    "body",
    "cta_label",
    "cta_href",
  ] as const) {
    if (fields[key] !== undefined) update[key] = String(fields[key] ?? "")
  }

  const { data, error } = await dbAdmin()
    .from("home_spotlight_settings")
    .upsert({ id: "default", ...update }, { onConflict: "id" })
    .select(SETTINGS_SELECT)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudieron guardar los textos",
        code: error?.code,
      },
    }
  }
  return { data: mapSettings(data), error: null }
}
