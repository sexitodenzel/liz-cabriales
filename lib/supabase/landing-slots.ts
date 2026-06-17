import { createClient } from "@supabase/supabase-js"

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

/** Devuelve un mapa key→url para uso en Server Components (landing page). */
export async function getLandingSlots(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("landing_slots")
      .select("key, url")

    if (error) return {}
    return Object.fromEntries((data ?? []).map((r) => [r.key as string, r.url as string]))
  } catch {
    return {}
  }
}

/** Devuelve los 3 slides del hero con datos de link para la landing page. */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("landing_slots")
      .select("key, url, link_type, link_value, cta_label, cta_subtext, subtitle, text_position, show_title, show_subtitle")
      .eq("section", "hero")
      .order("key")

    if (error) return []
    return (data ?? []) as HeroSlide[]
  } catch {
    return []
  }
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
    .map((r) => parseInt((r.key as string).replace("hero_", ""), 10))
    .filter((n) => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  const key = `hero_${next}`

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
  fields: { url?: string; link_type?: string; link_value?: string; cta_label?: string; cta_subtext?: string; subtitle?: string; text_position?: string; show_title?: boolean; show_subtitle?: boolean }
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
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
