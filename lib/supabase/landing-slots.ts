import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  updated_at: string
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
  url: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin
    .from("landing_slots")
    .update({ url, updated_at: new Date().toISOString() })
    .eq("key", key)

  if (error) return { error: error.message }
  return { error: null }
}
