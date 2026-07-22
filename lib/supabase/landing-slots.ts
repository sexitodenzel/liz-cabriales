import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LinkType = 'none' | 'product' | 'course' | 'services' | 'custom'
export type TextPosition = 'left' | 'center' | 'right'

export type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  link_type: LinkType
  link_value: string
  cta_label: string
  cta_subtext: string
  subtitle: string
  text_position: TextPosition
  show_title: boolean
  show_subtitle: boolean
  updated_at: string
}

export type HeroSlide = {
  key: string
  url: string
  link_type: LinkType
  link_value: string
  cta_label: string
  cta_subtext: string
  subtitle: string
  text_position: TextPosition
  show_title: boolean
  show_subtitle: boolean
}

/** Datos de landing en una sola consulta, cacheados 60s. */
async function loadLandingPageData(): Promise<{
  slots: Record<string, string>
  heroSlides: HeroSlide[]
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("landing_slots")
      .select(
        "key, url, section, link_type, link_value, cta_label, cta_subtext, subtitle, text_position, show_title, show_subtitle"
      )
      .order("key")

    if (error) return { slots: {}, heroSlides: [] }

    const slots: Record<string, string> = {}
    const heroSlides: HeroSlide[] = []

    for (const row of data ?? []) {
      const key = row.key as string
      slots[key] = (row.url as string) ?? ""

      if (row.section === "hero") {
        heroSlides.push({
          key,
          url: (row.url as string) ?? "",
          link_type: row.link_type as LinkType,
          link_value: (row.link_value as string) ?? "",
          cta_label: (row.cta_label as string) ?? "",
          cta_subtext: (row.cta_subtext as string) ?? "",
          subtitle: (row.subtitle as string) ?? "",
          text_position: row.text_position as TextPosition,
          show_title: Boolean(row.show_title),
          show_subtitle: Boolean(row.show_subtitle),
        })
      }
    }

    return { slots, heroSlides }
  } catch {
    return { slots: {}, heroSlides: [] }
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
    .select("key, url, label, section, link_type, link_value, cta_label, cta_subtext, subtitle, text_position, show_title, show_subtitle, updated_at")
    .order("section")
    .order("key")

  if (error) return []
  return (data ?? []) as LandingSlot[]
}

export async function createHeroSlide(): Promise<{ data: LandingSlot | null; error: string | null }> {
  const { data: existing } = await supabaseAdmin
    .from("landing_slots")
    .select("key")
    .eq("section", "hero")
    .order("key")

  const nums = (existing ?? [])
    .map((r) => {
      const key = String(r.key ?? "")
      const match = key.match(/(\d+)$/)
      return match ? parseInt(match[1], 10) : NaN
    })
    .filter((n) => !isNaN(n))
  let next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  const takenKeys = new Set((existing ?? []).map((r) => String(r.key ?? "")))
  let key = `hero_${next}`
  while (takenKeys.has(key)) {
    next += 1
    key = `hero_${next}`
  }

  const { data, error } = await supabaseAdmin
    .from("landing_slots")
    .insert({
      key,
      section: "hero",
      label: `Hero ${next}`,
      url: "",
      link_type: "none",
      link_value: "",
      cta_label: "",
      cta_subtext: "",
      subtitle: "",
      text_position: "right",
      show_title: true,
      show_subtitle: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as LandingSlot, error: null }
}

export async function updateLandingSlot(
  key: string,
  fields: { label?: string; url?: string; link_type?: string; link_value?: string; cta_label?: string; cta_subtext?: string; subtitle?: string; text_position?: string; show_title?: boolean; show_subtitle?: boolean }
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.label !== undefined) update.label = fields.label
  if (fields.url !== undefined) update.url = fields.url
  if (fields.link_type !== undefined) update.link_type = fields.link_type
  if (fields.link_value !== undefined) update.link_value = fields.link_value
  if (fields.cta_label !== undefined) update.cta_label = fields.cta_label
  if (fields.cta_subtext !== undefined) update.cta_subtext = fields.cta_subtext
  if (fields.subtitle !== undefined) update.subtitle = fields.subtitle
  if (fields.text_position !== undefined) update.text_position = fields.text_position
  if (fields.show_title !== undefined) update.show_title = fields.show_title
  if (fields.show_subtitle !== undefined) update.show_subtitle = fields.show_subtitle

  const { error } = await supabaseAdmin
    .from("landing_slots")
    .update(update)
    .eq("key", key)

  if (error) return { error: error.message }
  return { error: null }
}
