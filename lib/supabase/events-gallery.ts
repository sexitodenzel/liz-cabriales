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

export type PastCourseGalleryRow = {
  id: string
  title: string
  description: string
  cover_image: string
  start_date: string
}

type RawGalleryEmbed = {
  url: string
  type: string
  position: number
  is_cover?: boolean
}

type RawPastCourseRow = {
  id: string
  title: string
  description: string
  cover_image: string | null
  start_date: string
  course_gallery: RawGalleryEmbed[] | null
}

/**
 * Foto que representa al curso en la galería de eventos:
 * 1) imagen de su galería marcada como portada de galería (is_cover),
 * 2) primera imagen de su galería,
 * 3) portada del curso (cover_image, normalmente el flyer).
 */
function pickGalleryPhoto(row: RawPastCourseRow): string | null {
  const images = (row.course_gallery ?? [])
    .filter((g) => g.type === "image")
    .sort((a, b) => a.position - b.position)
  const marked = images.find((g) => g.is_cover)
  return marked?.url ?? images[0]?.url ?? row.cover_image ?? null
}

export type PastCoursesGalleryData = {
  courses: PastCourseGalleryRow[]
  /** URLs de todas las fotos ligadas a cursos, para deduplicar liz_events */
  knownUrls: string[]
}

/**
 * Cursos pasados publicados con foto — la fuente principal de la galería de
 * eventos. La foto lleva directo a la página del curso (/academia/[id]).
 */
export const getPastCoursesForGallery = unstable_cache(
  async (): Promise<PastCoursesGalleryData> => {
    const today = new Date().toISOString().slice(0, 10)
    // course_gallery(*) tolera que is_cover aún no exista en la tabla
    const { data, error } = await db()
      .from("courses")
      .select(
        "id, title, description, cover_image, start_date, course_gallery ( * )"
      )
      .eq("is_published", true)
      .lt("start_date", today)
      .order("start_date", { ascending: false })

    if (error) return { courses: [], knownUrls: [] }

    const courses: PastCourseGalleryRow[] = []
    const knownUrls = new Set<string>()
    for (const raw of (data ?? []) as unknown as RawPastCourseRow[]) {
      if (raw.cover_image) knownUrls.add(raw.cover_image)
      for (const g of raw.course_gallery ?? []) {
        if (g.type === "image") knownUrls.add(g.url)
      }
      const photo = pickGalleryPhoto(raw)
      if (!photo) continue
      courses.push({
        id: raw.id,
        title: raw.title,
        description: raw.description,
        cover_image: photo,
        start_date: raw.start_date,
      })
    }
    return { courses, knownUrls: Array.from(knownUrls) }
  },
  ["past-courses-gallery"],
  { revalidate: 300, tags: ["courses", "liz-events"] }
)

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
