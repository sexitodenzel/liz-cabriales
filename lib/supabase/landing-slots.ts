import { createClient } from "@supabase/supabase-js"
import { timeoutFetch } from "./timeoutFetch"
import { unstable_cache } from "next/cache"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: timeoutFetch } }
)

export type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  updated_at: string
}

/** Datos de landing en una sola consulta, cacheados 60s. */
async function loadLandingPageData(): Promise<{
  slots: Record<string, string>
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("landing_slots")
      .select("key, url")
      .order("key")

    if (error) return { slots: {} }

    const slots: Record<string, string> = {}
    for (const row of data ?? []) {
      slots[row.key as string] = (row.url as string) ?? ""
    }

    return { slots }
  } catch {
    return { slots: {} }
  }
}

export const getLandingPageDataCached = unstable_cache(
  loadLandingPageData,
  ["landing-page-data"],
  { revalidate: 60, tags: ["landing-slots"] }
)

/** Devuelve un mapa key→url para uso en Server Components (landing page). */
export async function getLandingSlots(): Promise<Record<string, string>> {
  const { slots } = await getLandingPageDataCached()
  return slots
}

/**
 * URLs en el orden de `keys`. Si un slot no existe o está vacío, usa
 * el fallback en la misma posición (así no se rompe el layout fijo).
 */
export async function getOrderedSlotUrls(
  keys: string[],
  fallbacks: string[] = []
): Promise<string[]> {
  const slots = await getLandingSlots()
  return keys.map((key, i) => {
    const url = (slots[key] ?? "").trim()
    return url || fallbacks[i] || ""
  })
}

/** URL de un slot concreto, o fallback. */
export async function getSlotUrl(
  key: string,
  fallback = ""
): Promise<string> {
  const slots = await getLandingSlots()
  const url = (slots[key] ?? "").trim()
  return url || fallback
}

/** Devuelve todos los slots con metadata para la página de administración. */
export async function getAllLandingSlots(): Promise<LandingSlot[]> {
  const { data, error } = await supabaseAdmin
    .from("landing_slots")
    .select("key, url, label, section, updated_at")
    .order("section")
    .order("key")

  if (error) return []
  return (data ?? []) as LandingSlot[]
}

export async function updateLandingSlot(
  key: string,
  fields: { label?: string; url?: string }
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.label !== undefined) update.label = fields.label
  if (fields.url !== undefined) update.url = fields.url

  const { error } = await supabaseAdmin
    .from("landing_slots")
    .update(update)
    .eq("key", key)

  if (error) return { error: error.message }
  return { error: null }
}
