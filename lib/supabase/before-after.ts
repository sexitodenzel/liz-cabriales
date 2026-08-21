import { createClient } from "@supabase/supabase-js"
import { timeoutFetch } from "./timeoutFetch"
import { unstable_cache } from "next/cache"

/* Datos de la sección "Antes y Después" del home (comparador deslizable por
   servicio: quiropodia, pedicura, etc.). Contenido curado por el estudio
   desde /admin/antes-despues. Degrada a vacío si la tabla aún no existe
   (sql-before-after.sql sin correr). */

type SupabaseError = { message: string; code?: string }
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type BeforeAfterItem = {
  id: string
  before_image_url: string
  after_image_url: string
  service_label: string | null
  caption: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const SELECT =
  "id, before_image_url, after_image_url, service_label, caption, sort_order, is_active, created_at, updated_at"

export type BeforeAfterSettings = {
  eyebrow: string
  title: string
  subtitle: string
  cta_label: string
  cta_href: string
}

const SETTINGS_SELECT = "eyebrow, title, subtitle, cta_label, cta_href"

const EMPTY_SETTINGS: BeforeAfterSettings = {
  eyebrow: "",
  title: "",
  subtitle: "",
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

function mapRow(row: unknown): BeforeAfterItem {
  const r = row as BeforeAfterItem
  return {
    id: r.id,
    before_image_url: r.before_image_url,
    after_image_url: r.after_image_url,
    service_label: r.service_label ?? null,
    caption: r.caption ?? null,
    sort_order: Number(r.sort_order ?? 0),
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

/** Items visibles para el home, cacheados. Solo activos, en orden. */
export const getBeforeAfterItems = unstable_cache(
  async (): Promise<BeforeAfterItem[]> => {
    const { data, error } = await db()
      .from("before_after_items")
      .select(SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) return []
    return (data ?? []).map(mapRow)
  },
  ["before-after"],
  { revalidate: 300, tags: ["before-after"] }
)

/** Todos los items (activos e inactivos) para el panel admin. */
export async function getAllBeforeAfterItems(): Promise<
  Result<BeforeAfterItem[]>
> {
  const { data, error } = await dbAdmin()
    .from("before_after_items")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: (data ?? []).map(mapRow), error: null }
}

export async function createBeforeAfterItem(input: {
  beforeImageUrl: string
  afterImageUrl: string
  serviceLabel?: string | null
  caption?: string | null
}): Promise<Result<BeforeAfterItem>> {
  const beforeImageUrl = input.beforeImageUrl.trim()
  const afterImageUrl = input.afterImageUrl.trim()
  if (!beforeImageUrl || !afterImageUrl) {
    return {
      data: null,
      error: {
        message: "Las dos imágenes (antes y después) son obligatorias",
        code: "VALIDATION_ERROR",
      },
    }
  }

  const { data: maxRow } = await dbAdmin()
    .from("before_after_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((maxRow?.sort_order as number | undefined) ?? -1) + 1

  const { data, error } = await dbAdmin()
    .from("before_after_items")
    .insert({
      before_image_url: beforeImageUrl,
      after_image_url: afterImageUrl,
      service_label: input.serviceLabel?.trim() || null,
      caption: input.caption?.trim() || null,
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

export async function updateBeforeAfterItem(
  id: string,
  fields: {
    beforeImageUrl?: string
    afterImageUrl?: string
    serviceLabel?: string | null
    caption?: string | null
    isActive?: boolean
  }
): Promise<Result<BeforeAfterItem>> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (fields.beforeImageUrl !== undefined) {
    const trimmed = fields.beforeImageUrl.trim()
    if (!trimmed) {
      return {
        data: null,
        error: { message: "La imagen de 'antes' es obligatoria", code: "VALIDATION_ERROR" },
      }
    }
    update.before_image_url = trimmed
  }
  if (fields.afterImageUrl !== undefined) {
    const trimmed = fields.afterImageUrl.trim()
    if (!trimmed) {
      return {
        data: null,
        error: { message: "La imagen de 'después' es obligatoria", code: "VALIDATION_ERROR" },
      }
    }
    update.after_image_url = trimmed
  }
  if (fields.serviceLabel !== undefined) update.service_label = fields.serviceLabel?.trim() || null
  if (fields.caption !== undefined) update.caption = fields.caption?.trim() || null
  if (fields.isActive !== undefined) update.is_active = fields.isActive

  const { data, error } = await dbAdmin()
    .from("before_after_items")
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

export async function deleteBeforeAfterItem(id: string): Promise<Result<null>> {
  const { error } = await dbAdmin()
    .from("before_after_items")
    .delete()
    .eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

/** Reordena por lista de ids: la posición en el arreglo pasa a ser sort_order. */
export async function reorderBeforeAfterItems(
  orderedIds: string[]
): Promise<Result<null>> {
  const updates = orderedIds.map((id, index) =>
    dbAdmin()
      .from("before_after_items")
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

function mapSettings(row: unknown): BeforeAfterSettings {
  const r = (row ?? {}) as Partial<BeforeAfterSettings>
  return {
    eyebrow: r.eyebrow ?? "",
    title: r.title ?? "",
    subtitle: r.subtitle ?? "",
    cta_label: r.cta_label ?? "",
    cta_href: r.cta_href ?? "",
  }
}

/** Textos del encabezado para el home, cacheados. Degrada a vacío. */
export const getBeforeAfterSettings = unstable_cache(
  async (): Promise<BeforeAfterSettings> => {
    const { data, error } = await db()
      .from("before_after_settings")
      .select(SETTINGS_SELECT)
      .eq("id", "default")
      .maybeSingle()

    if (error || !data) return EMPTY_SETTINGS
    return mapSettings(data)
  },
  ["before-after-settings"],
  { revalidate: 300, tags: ["before-after"] }
)

/** Lectura fresca para el panel admin (sin caché). */
export async function getBeforeAfterSettingsAdmin(): Promise<
  Result<BeforeAfterSettings>
> {
  const { data, error } = await dbAdmin()
    .from("before_after_settings")
    .select(SETTINGS_SELECT)
    .eq("id", "default")
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: mapSettings(data), error: null }
}

export async function updateBeforeAfterSettings(
  fields: Partial<BeforeAfterSettings>
): Promise<Result<BeforeAfterSettings>> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of [
    "eyebrow",
    "title",
    "subtitle",
    "cta_label",
    "cta_href",
  ] as const) {
    if (fields[key] !== undefined) update[key] = String(fields[key] ?? "")
  }

  const { data, error } = await dbAdmin()
    .from("before_after_settings")
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
