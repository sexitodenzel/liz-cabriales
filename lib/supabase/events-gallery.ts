import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

type SupabaseError = { message: string; code?: string }
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type LizEventRow = {
  id: string
  image_url: string
  caption: string | null
  event_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

const SELECT = "id, image_url, caption, event_date, sort_order, created_at, updated_at"

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function dbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapRow(row: unknown): LizEventRow {
  const r = row as LizEventRow
  return {
    id: r.id,
    image_url: r.image_url,
    caption: r.caption ?? null,
    event_date: r.event_date ?? null,
    sort_order: Number(r.sort_order ?? 0),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

/** Galería pública para /sobre-liz. Degrada a vacío si la tabla no existe. */
export const getEventsGallery = unstable_cache(
  async (): Promise<LizEventRow[]> => {
    const { data, error } = await db()
      .from("liz_events")
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("event_date", { ascending: false })

    if (error) return []
    return (data ?? []).map(mapRow)
  },
  ["liz-events"],
  { revalidate: 300, tags: ["liz-events"] }
)

export async function getAllEvents(): Promise<Result<LizEventRow[]>> {
  const { data, error } = await dbAdmin()
    .from("liz_events")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("event_date", { ascending: false })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: (data ?? []).map(mapRow), error: null }
}

export async function createEvent(input: {
  imageUrl: string
  caption?: string | null
  eventDate?: string | null
  sortOrder?: number
}): Promise<Result<LizEventRow>> {
  const imageUrl = input.imageUrl.trim()
  if (!imageUrl) {
    return {
      data: null,
      error: { message: "La imagen es obligatoria", code: "VALIDATION_ERROR" },
    }
  }

  const { data: maxRow } = await dbAdmin()
    .from("liz_events")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : ((maxRow?.sort_order as number | undefined) ?? -1) + 1

  const { data, error } = await dbAdmin()
    .from("liz_events")
    .insert({
      image_url: imageUrl,
      caption: input.caption?.trim() || null,
      event_date: input.eventDate?.trim() || null,
      sort_order: nextSort,
    })
    .select(SELECT)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el evento",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data), error: null }
}

export async function deleteEvent(id: string): Promise<Result<null>> {
  const { error } = await dbAdmin().from("liz_events").delete().eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}
