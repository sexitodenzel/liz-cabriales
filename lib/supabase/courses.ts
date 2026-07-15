import { createClient as createServiceClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import type { CourseLevel, RegistrationStatus } from "@/types"

import type {
  CreateCourseInput,
  ManualRegistrationInput,
  UpdateCourseInput,
} from "@/lib/validations/courses"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

/* ──────────────────────────────────────────────────────────────────────────
 * Tipos públicos
 * ────────────────────────────────────────────────────────────────────── */

export type InstructorRow = {
  id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  created_at: string
}

export type CourseRow = {
  id: string
  instructor_id: string
  title: string
  short_description: string | null
  description: string
  cover_image: string | null
  price: number
  capacity: number
  level: CourseLevel
  start_date: string
  end_date: string | null
  start_time: string
  location: string
  diploma_included: boolean
  highlights: string[]
  is_published: boolean
  allow_online_registration: boolean
  show_price_public: boolean
  show_capacity_public: boolean
  public_registered_count: number | null
  public_capacity: number | null
  created_at: string
  updated_at: string
}

export type CourseImage = {
  id: string
  course_id: string
  image_url: string
  is_cover: boolean
  position: number
  created_at: string
}

export type CourseGalleryItem = {
  id: string
  course_id: string
  type: "image" | "video"
  url: string
  thumbnail_url: string | null
  caption: string | null
  position: number
  is_cover: boolean
  created_at: string
}

export type CourseWithInstructor = CourseRow & {
  instructor: InstructorRow | null
  co_instructors: InstructorRow[]
  co_organizers: InstructorRow[]
  images: CourseImage[]
}

export type CourseWithStats = CourseWithInstructor & {
  confirmed_count: number
  spots_remaining: number
  public_confirmed_count: number
  public_display_capacity: number
  public_spots_remaining: number
}

export type RegistrationRow = {
  id: string
  course_id: string
  user_id: string | null
  attendees: number
  status: RegistrationStatus
  added_by_admin: boolean
  created_at: string
}

export type RegistrationWithCourse = RegistrationRow & {
  course: CourseWithInstructor | null
  payment_amount: number | null
  payment_status: string | null
}

export type AdminRegistrationRow = RegistrationRow & {
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
  payment_amount: number | null
  payment_status: string | null
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers de mapeo
 * ────────────────────────────────────────────────────────────────────── */

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

type RawInstructor = {
  id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  created_at: string
}

type RawCourseImage = {
  id: string
  image_url: string
  is_cover: boolean
  position: number
  created_at: string
}

type RawCourseRow = {
  id: string
  instructor_id: string
  title: string
  short_description: string | null
  description: string
  cover_image: string | null
  price: number | string
  capacity: number | string
  level: string
  start_date: string
  end_date: string | null
  start_time: string
  location: string
  diploma_included: boolean | null
  highlights: string[] | null
  is_published: boolean
  allow_online_registration: boolean
  show_price_public: boolean
  show_capacity_public: boolean
  public_registered_count: number | string | null
  public_capacity: number | string | null
  created_at: string
  updated_at: string
  instructors?: RawInstructor | RawInstructor[] | null
  course_images?: RawCourseImage[] | null
}

function mapInstructor(ins: RawInstructor): InstructorRow {
  return {
    id: ins.id,
    name: ins.name,
    title: ins.title ?? null,
    bio: ins.bio ?? null,
    photo_url: ins.photo_url ?? null,
    created_at: ins.created_at,
  }
}

function mapCourseRow(row: RawCourseRow): CourseWithInstructor {
  const ins = unwrap(row.instructors)
  const rawImages = Array.isArray(row.course_images) ? row.course_images : []
  const images: CourseImage[] = rawImages
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      id: img.id,
      course_id: row.id,
      image_url: img.image_url,
      is_cover: Boolean(img.is_cover),
      position: img.position,
      created_at: img.created_at,
    }))
  return {
    id: row.id,
    instructor_id: row.instructor_id,
    title: row.title,
    short_description: row.short_description ?? null,
    description: row.description,
    cover_image: row.cover_image,
    price: Number(row.price),
    capacity: Number(row.capacity),
    level: row.level as CourseLevel,
    start_date: row.start_date,
    end_date: row.end_date,
    start_time: row.start_time,
    location: row.location,
    diploma_included: row.diploma_included == null ? true : Boolean(row.diploma_included),
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    is_published: Boolean(row.is_published),
    allow_online_registration: Boolean(row.allow_online_registration),
    show_price_public: Boolean(row.show_price_public),
    show_capacity_public: Boolean(row.show_capacity_public),
    public_registered_count:
      row.public_registered_count == null
        ? null
        : Number(row.public_registered_count),
    public_capacity:
      row.public_capacity == null ? null : Number(row.public_capacity),
    created_at: row.created_at,
    updated_at: row.updated_at,
    instructor: ins ? mapInstructor(ins) : null,
    co_instructors: [],
    co_organizers: [],
    images,
  }
}

type CourseInstructorGroups = {
  masters: InstructorRow[]
  organizers: InstructorRow[]
}

/**
 * Trae los instructores adicionales (maestros y organizadores) de uno o varios
 * cursos, ordenados por posición. Resiliente: si la tabla puente aún no existe
 * (migración sin correr) devuelve un mapa vacío en vez de romper la lectura.
 */
async function fetchCoInstructorsMap(
  courseIds: string[]
): Promise<Map<string, CourseInstructorGroups>> {
  const map = new Map<string, CourseInstructorGroups>()
  if (courseIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from("course_instructors")
    .select(
      "course_id, position, role, instructors ( id, name, title, bio, photo_url, created_at )"
    )
    .in("course_id", courseIds)
    .order("position", { ascending: true })

  if (error || !data) return map

  for (const raw of data as unknown as Array<{
    course_id: string
    role: string | null
    instructors: RawInstructor | RawInstructor[] | null
  }>) {
    const ins = unwrap(raw.instructors)
    if (!ins) continue
    const groups = map.get(raw.course_id) ?? { masters: [], organizers: [] }
    if (raw.role === "organizer") groups.organizers.push(mapInstructor(ins))
    else groups.masters.push(mapInstructor(ins))
    map.set(raw.course_id, groups)
  }
  return map
}

/** Rellena co_instructors y co_organizers de un curso (excluye al principal). */
async function attachCoInstructors(
  course: CourseWithInstructor
): Promise<CourseWithInstructor> {
  const map = await fetchCoInstructorsMap([course.id])
  const groups = map.get(course.id) ?? { masters: [], organizers: [] }
  const notPrimary = (i: InstructorRow) => i.id !== course.instructor_id
  return {
    ...course,
    co_instructors: groups.masters.filter(notPrimary),
    co_organizers: groups.organizers.filter(notPrimary),
  }
}

/** Versión en lote de attachCoInstructors: una sola consulta para varios cursos. */
async function attachCoInstructorsMany(
  courses: CourseWithInstructor[]
): Promise<CourseWithInstructor[]> {
  if (courses.length === 0) return courses
  const map = await fetchCoInstructorsMap(courses.map((c) => c.id))
  return courses.map((course) => {
    const groups = map.get(course.id) ?? { masters: [], organizers: [] }
    const notPrimary = (i: InstructorRow) => i.id !== course.instructor_id
    return {
      ...course,
      co_instructors: groups.masters.filter(notPrimary),
      co_organizers: groups.organizers.filter(notPrimary),
    }
  })
}

async function getPaidCountsForCourses(
  courseIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (courseIds.length === 0) return map

  const { data } = await supabaseAdmin
    .from("course_registrations")
    .select("course_id, attendees, status")
    .in("course_id", courseIds)
    .eq("status", "paid")

  for (const row of (data ?? []) as Array<{
    course_id: string
    attendees: number | string
  }>) {
    const prev = map.get(row.course_id) ?? 0
    map.set(row.course_id, prev + Number(row.attendees))
  }
  return map
}

function attachStats(
  course: CourseWithInstructor,
  paidCount: number
): CourseWithStats {
  const publicConfirmed = course.public_registered_count ?? paidCount
  const publicCapacity = course.public_capacity ?? course.capacity
  return {
    ...course,
    confirmed_count: paidCount,
    spots_remaining: Math.max(0, course.capacity - paidCount),
    public_confirmed_count: publicConfirmed,
    public_display_capacity: publicCapacity,
    public_spots_remaining: Math.max(0, publicCapacity - publicConfirmed),
  }
}

const COURSE_COLUMNS = `
  id, instructor_id, title, short_description, description, cover_image, price, capacity,
  level, start_date, end_date, start_time, location, diploma_included, highlights, is_published,
  allow_online_registration, show_price_public, show_capacity_public,
  public_registered_count, public_capacity,
  created_at, updated_at,
  instructors!courses_instructor_id_fkey ( id, name, title, bio, photo_url, created_at ),
  course_images ( id, image_url, is_cover, position, created_at )
`

/* ──────────────────────────────────────────────────────────────────────────
 * Galería retrospectiva
 * ────────────────────────────────────────────────────────────────────── */

export async function getCourseGallery(
  courseId: string
): Promise<Result<CourseGalleryItem[]>> {
  // select("*") para tolerar que is_cover aún no exista en la tabla
  const { data, error } = await supabaseAdmin
    .from("course_gallery")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const items = (data ?? []).map((raw) => ({
    ...(raw as CourseGalleryItem),
    is_cover: Boolean((raw as { is_cover?: boolean }).is_cover),
  }))
  return { data: items, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lecturas públicas
 * ────────────────────────────────────────────────────────────────────── */

async function loadPublishedCourses(): Promise<Result<CourseWithStats[]>> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("is_published", true)
    .order("start_date", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawCourseRow[]
  const courses = await attachCoInstructorsMany(rows.map(mapCourseRow))
  const paidMap = await getPaidCountsForCourses(courses.map((c) => c.id))

  const withStats = courses.map((c) => attachStats(c, paidMap.get(c.id) ?? 0))
  return { data: withStats, error: null }
}

export const getPublishedCoursesCached = unstable_cache(
  loadPublishedCourses,
  ["published-courses"],
  { revalidate: 60, tags: ["courses"] }
)

export async function getPublishedCourses(): Promise<Result<CourseWithStats[]>> {
  return getPublishedCoursesCached()
}

export async function getCourseById(
  id: string
): Promise<Result<CourseWithStats>> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Curso no encontrado", code: "NOT_FOUND" },
    }
  }

  const course = await attachCoInstructors(
    mapCourseRow(data as unknown as RawCourseRow)
  )
  const paidMap = await getPaidCountsForCourses([course.id])
  return {
    data: attachStats(course, paidMap.get(course.id) ?? 0),
    error: null,
  }
}

export async function getInstructors(): Promise<Result<InstructorRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("instructors")
    .select("id, name, title, bio, photo_url, created_at")
    .order("name", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: (data ?? []) as InstructorRow[], error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Registro (inscripciones) de usuarios
 * ────────────────────────────────────────────────────────────────────── */

async function findExistingActiveRegistration(
  courseId: string,
  userId: string
): Promise<RegistrationRow | null> {
  const { data } = await supabaseAdmin
    .from("course_registrations")
    .select("id, course_id, user_id, attendees, status, added_by_admin, created_at")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .in("status", ["pending", "paid"])
    .maybeSingle()

  return (data as RegistrationRow | null) ?? null
}

export async function createRegistration(
  courseId: string,
  userId: string,
  attendees: number
): Promise<Result<{ registration_id: string; total: number }>> {
  // 1) Validar curso publicado y cupo
  const courseRes = await getCourseById(courseId)
  if (!courseRes.data) return courseRes

  const course = courseRes.data

  if (!course.is_published) {
    return {
      data: null,
      error: {
        message: "El curso no está disponible",
        code: "COURSE_NOT_PUBLISHED",
      },
    }
  }

  if (!course.allow_online_registration) {
    return {
      data: null,
      error: {
        message:
          "Este curso solo recibe inscripciones por WhatsApp. Escríbenos para pedir información.",
        code: "ONLINE_REGISTRATION_DISABLED",
      },
    }
  }

  if (course.spots_remaining < attendees) {
    return {
      data: null,
      error: {
        message: "No hay lugares suficientes para esta inscripción",
        code: "COURSE_FULL",
      },
    }
  }

  // 2) Auto-cancelar inscripciones pendientes abandonadas para este curso/usuario.
  //    Las inscripciones 'paid' siguen bloqueando (no se cancelan automáticamente).
  await supabaseAdmin
    .from("course_registrations")
    .update({ status: "cancelled" })
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .eq("status", "pending")

  // 3) Prevenir inscripción duplicada solo si ya hay una pagada
  const existing = await findExistingActiveRegistration(courseId, userId)
  if (existing) {
    return {
      data: null,
      error: {
        message: "Ya estás inscrito en este curso",
        code: "ALREADY_REGISTERED",
      },
    }
  }

  // 3) Insertar registration
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .insert({
      course_id: courseId,
      user_id: userId,
      attendees,
      status: "pending",
      added_by_admin: false,
    })
    .select("id")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo registrar la inscripción",
        code: error?.code ?? "REGISTRATION_CREATE_FAILED",
      },
    }
  }

  return {
    data: {
      registration_id: (data as { id: string }).id,
      total: course.price * attendees,
    },
    error: null,
  }
}

type RawUserRegistrationRow = RegistrationRow & {
  courses: RawCourseRow | RawCourseRow[] | null
  payments:
    | { amount?: number | string; status?: string }
    | { amount?: number | string; status?: string }[]
    | null
}

export async function getUserRegistrations(
  userId: string
): Promise<Result<RegistrationWithCourse[]>> {
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .select(
      `id, course_id, user_id, attendees, status, added_by_admin, created_at,
       courses (${COURSE_COLUMNS}),
       payments ( amount, status )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawUserRegistrationRow[]

  const result: RegistrationWithCourse[] = rows.map((r) => {
    const rawCourse = unwrap(r.courses)
    const payment = unwrap(r.payments)
    return {
      id: r.id,
      course_id: r.course_id,
      user_id: r.user_id,
      attendees: Number(r.attendees),
      status: r.status,
      added_by_admin: Boolean(r.added_by_admin),
      created_at: r.created_at,
      course: rawCourse ? mapCourseRow(rawCourse) : null,
      payment_amount: payment?.amount != null ? Number(payment.amount) : null,
      payment_status: payment?.status ?? null,
    }
  })

  return { data: result, error: null }
}

export async function getRegistrationForUser(
  registrationId: string,
  userId: string
): Promise<Result<RegistrationWithCourse>> {
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .select(
      `id, course_id, user_id, attendees, status, added_by_admin, created_at,
       courses (${COURSE_COLUMNS}),
       payments ( amount, status )`
    )
    .eq("id", registrationId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Inscripción no encontrada", code: "NOT_FOUND" },
    }
  }

  const r = data as unknown as RawUserRegistrationRow

  if (r.user_id !== userId) {
    return {
      data: null,
      error: { message: "Inscripción no encontrada", code: "NOT_FOUND" },
    }
  }

  const rawCourse = unwrap(r.courses)
  const payment = unwrap(r.payments)
  return {
    data: {
      id: r.id,
      course_id: r.course_id,
      user_id: r.user_id,
      attendees: Number(r.attendees),
      status: r.status,
      added_by_admin: Boolean(r.added_by_admin),
      created_at: r.created_at,
      course: rawCourse ? mapCourseRow(rawCourse) : null,
      payment_amount: payment?.amount != null ? Number(payment.amount) : null,
      payment_status: payment?.status ?? null,
    },
    error: null,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Admin: cursos
 * ────────────────────────────────────────────────────────────────────── */

export async function getAdminCourses(): Promise<Result<CourseWithStats[]>> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_COLUMNS)
    .order("start_date", { ascending: false })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawCourseRow[]
  const courses = await attachCoInstructorsMany(rows.map(mapCourseRow))
  const paidMap = await getPaidCountsForCourses(courses.map((c) => c.id))

  const withStats = courses.map((c) => attachStats(c, paidMap.get(c.id) ?? 0))
  return { data: withStats, error: null }
}

function normalizeCoursePayload(
  input: Partial<CreateCourseInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.title !== undefined) payload.title = input.title
  if (input.short_description !== undefined)
    payload.short_description =
      input.short_description && input.short_description.length > 0
        ? input.short_description
        : null
  if (input.description !== undefined) payload.description = input.description
  if (input.instructor_id !== undefined)
    payload.instructor_id = input.instructor_id
  if (input.price !== undefined) payload.price = input.price
  if (input.capacity !== undefined) payload.capacity = input.capacity
  if (input.level !== undefined) payload.level = input.level
  if (input.start_date !== undefined) payload.start_date = input.start_date
  if (input.end_date !== undefined)
    payload.end_date = input.end_date ? input.end_date : null
  if (input.start_time !== undefined) payload.start_time = input.start_time
  if (input.location !== undefined) payload.location = input.location
  if (input.diploma_included !== undefined)
    payload.diploma_included = input.diploma_included
  if (input.highlights !== undefined)
    payload.highlights = input.highlights ?? []
  if (input.cover_image !== undefined)
    payload.cover_image =
      input.cover_image && input.cover_image.length > 0 ? input.cover_image : null
  if (input.is_published !== undefined)
    payload.is_published = input.is_published
  if (input.allow_online_registration !== undefined)
    payload.allow_online_registration = input.allow_online_registration
  if (input.show_price_public !== undefined)
    payload.show_price_public = input.show_price_public
  if (input.show_capacity_public !== undefined)
    payload.show_capacity_public = input.show_capacity_public
  if (input.public_registered_count !== undefined)
    payload.public_registered_count = input.public_registered_count
  if (input.public_capacity !== undefined)
    payload.public_capacity = input.public_capacity
  return payload
}

/**
 * Reemplaza por completo los instructores adicionales de un curso (maestros y
 * organizadores). Excluye al principal y deduplica (si un id viene en ambas
 * listas, gana 'organizer'), para no romper la PK ni mostrar dobles.
 * Listas vacías dejan el curso sin adicionales.
 */
async function syncCourseCoInstructors(
  courseId: string,
  primaryInstructorId: string | null,
  masterIds: string[],
  organizerIds: string[]
): Promise<SupabaseError | null> {
  const cleanOrganizers = organizerIds
    .filter((id) => id && id !== primaryInstructorId)
    .filter((id, i, arr) => arr.indexOf(id) === i)
  const cleanMasters = masterIds
    .filter((id) => id && id !== primaryInstructorId)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .filter((id) => !cleanOrganizers.includes(id))

  const { error: delError } = await supabaseAdmin
    .from("course_instructors")
    .delete()
    .eq("course_id", courseId)
  if (delError) return { message: delError.message, code: delError.code }

  const rows = [
    ...cleanMasters.map((instructor_id, position) => ({
      course_id: courseId,
      instructor_id,
      role: "master",
      position,
    })),
    ...cleanOrganizers.map((instructor_id, position) => ({
      course_id: courseId,
      instructor_id,
      role: "organizer",
      position,
    })),
  ]
  if (rows.length === 0) return null

  const { error: insError } = await supabaseAdmin
    .from("course_instructors")
    .insert(rows)
  if (insError) return { message: insError.message, code: insError.code }
  return null
}

async function fetchCourseRow(
  id: string
): Promise<Result<CourseWithInstructor>> {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .single()
  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo leer el curso",
        code: error?.code,
      },
    }
  }
  const course = await attachCoInstructors(
    mapCourseRow(data as unknown as RawCourseRow)
  )
  return { data: course, error: null }
}

export async function createCourse(
  input: CreateCourseInput
): Promise<Result<CourseWithInstructor>> {
  const payload = normalizeCoursePayload(input)

  const { data, error } = await supabaseAdmin
    .from("courses")
    .insert(payload)
    .select("id, instructor_id")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el curso",
        code: error?.code,
      },
    }
  }

  const created = data as { id: string; instructor_id: string }
  if (
    input.co_instructor_ids !== undefined ||
    input.co_organizer_ids !== undefined
  ) {
    const syncError = await syncCourseCoInstructors(
      created.id,
      created.instructor_id,
      input.co_instructor_ids ?? [],
      input.co_organizer_ids ?? []
    )
    if (syncError) return { data: null, error: syncError }
  }

  return fetchCourseRow(created.id)
}

export async function updateCourse(
  id: string,
  input: UpdateCourseInput
): Promise<Result<CourseWithInstructor>> {
  const payload = normalizeCoursePayload(input)
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("courses")
    .update(payload)
    .eq("id", id)
    .select("id, instructor_id")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el curso",
        code: error?.code,
      },
    }
  }

  const updated = data as { id: string; instructor_id: string }
  if (
    input.co_instructor_ids !== undefined ||
    input.co_organizer_ids !== undefined
  ) {
    const syncError = await syncCourseCoInstructors(
      updated.id,
      updated.instructor_id,
      input.co_instructor_ids ?? [],
      input.co_organizer_ids ?? []
    )
    if (syncError) return { data: null, error: syncError }
  }

  return fetchCourseRow(updated.id)
}

/**
 * Soft delete: despublica el curso para que deje de aparecer al público,
 * pero conserva inscripciones e históricos.
 */
export async function deleteCourse(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("courses")
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Admin: inscripciones
 * ────────────────────────────────────────────────────────────────────── */

type RawAdminRegistrationRow = RegistrationRow & {
  users:
    | { first_name?: string; last_name?: string; email?: string }
    | { first_name?: string; last_name?: string; email?: string }[]
    | null
  payments:
    | { amount?: number | string; status?: string }
    | { amount?: number | string; status?: string }[]
    | null
}

export async function getRegistrationsByCourse(
  courseId: string
): Promise<Result<AdminRegistrationRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .select(
      `id, course_id, user_id, attendees, status, added_by_admin, created_at,
       users ( first_name, last_name, email ),
       payments ( amount, status )`
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawAdminRegistrationRow[]

  const result: AdminRegistrationRow[] = rows.map((r) => {
    const user = unwrap(r.users)
    const payment = unwrap(r.payments)
    return {
      id: r.id,
      course_id: r.course_id,
      user_id: r.user_id,
      attendees: Number(r.attendees),
      status: r.status,
      added_by_admin: Boolean(r.added_by_admin),
      created_at: r.created_at,
      client_first_name: user?.first_name ?? null,
      client_last_name: user?.last_name ?? null,
      client_email: user?.email ?? null,
      payment_amount: payment?.amount != null ? Number(payment.amount) : null,
      payment_status: payment?.status ?? null,
    }
  })

  return { data: result, error: null }
}

/**
 * Agrega manualmente un alumno a un curso (admin).
 * Si se proporciona user_id, se vincula al usuario existente.
 * Si no, se registra sin usuario (inscripción "externa").
 *
 * NOTA: La tabla course_registrations no tiene columnas client_name/client_email
 *       hoy; si user_id es nulo, requerimos vincular a un usuario existente
 *       para poder trazar quién asiste. Esto se documenta como pendiente.
 */
export async function addManualRegistration(
  courseId: string,
  input: ManualRegistrationInput
): Promise<Result<{ registration_id: string }>> {
  // Verificar que el curso existe
  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, capacity")
    .eq("id", courseId)
    .maybeSingle()

  if (courseError) {
    return {
      data: null,
      error: { message: courseError.message, code: courseError.code },
    }
  }
  if (!course) {
    return {
      data: null,
      error: { message: "Curso no encontrado", code: "NOT_FOUND" },
    }
  }

  const paidMap = await getPaidCountsForCourses([courseId])
  const paid = paidMap.get(courseId) ?? 0
  const cap = Number((course as { capacity: number | string }).capacity)

  if (cap - paid < input.attendees) {
    return {
      data: null,
      error: {
        message: "No hay cupo suficiente",
        code: "COURSE_FULL",
      },
    }
  }

  if (!input.user_id) {
    return {
      data: null,
      error: {
        message:
          "Se requiere vincular un usuario existente para registrar la inscripción",
        code: "USER_REQUIRED",
      },
    }
  }

  // Evitar duplicado activo del mismo usuario
  const existing = await findExistingActiveRegistration(
    courseId,
    input.user_id
  )
  if (existing && existing.status === "paid") {
    return {
      data: null,
      error: {
        message: "El usuario ya está inscrito en este curso",
        code: "ALREADY_REGISTERED",
      },
    }
  }

  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .insert({
      course_id: courseId,
      user_id: input.user_id,
      attendees: input.attendees,
      status: "paid" as RegistrationStatus,
      added_by_admin: true,
    })
    .select("id")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo registrar la inscripción",
        code: error?.code,
      },
    }
  }

  return {
    data: { registration_id: (data as { id: string }).id },
    error: null,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers para pagos / webhook
 * ────────────────────────────────────────────────────────────────────── */

export async function claimApprovedPaymentForRegistration(
  registrationId: string
): Promise<
  Result<{ claimed: true; userId: string | null } | { claimed: false }>
> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "approved",
      email_sent: true,
      updated_at: new Date().toISOString(),
    })
    .eq("course_reg_id", registrationId)
    .eq("email_sent", false)
    .select("user_id")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as Array<{ user_id: string | null }>
  if (rows.length === 0) {
    return { data: { claimed: false }, error: null }
  }

  return {
    data: { claimed: true, userId: rows[0].user_id },
    error: null,
  }
}

export async function updateRegistrationStatusToPaid(
  registrationId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("course_registrations")
    .update({
      status: "paid",
    })
    .eq("id", registrationId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function markRegistrationPaymentRejected(
  registrationId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("course_reg_id", registrationId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function updateRegistrationStatusToCancelledFromPayment(
  registrationId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("course_registrations")
    .update({
      status: "cancelled",
    })
    .eq("id", registrationId)
    .eq("status", "pending")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export type RegistrationWithDetails = RegistrationWithCourse & {
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
  approved_payment_amount: number | null
}

/**
 * Obtiene todos los datos necesarios para enviar un email de inscripción:
 * registration + course + instructor + datos del usuario + pago aprobado.
 */
export async function getRegistrationWithDetails(
  registrationId: string
): Promise<Result<RegistrationWithDetails>> {
  const { data, error } = await supabaseAdmin
    .from("course_registrations")
    .select(
      `id, course_id, user_id, attendees, status, added_by_admin, created_at,
       users ( first_name, last_name, email ),
       courses (${COURSE_COLUMNS})`
    )
    .eq("id", registrationId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Inscripción no encontrada", code: "NOT_FOUND" },
    }
  }

  const row = data as unknown as RegistrationRow & {
    users:
      | { first_name?: string; last_name?: string; email?: string }
      | { first_name?: string; last_name?: string; email?: string }[]
      | null
    courses: RawCourseRow | RawCourseRow[] | null
  }
  const rawCourse = unwrap(row.courses)
  const user = unwrap(row.users)

  // Pago aprobado más reciente
  const { data: payData } = await supabaseAdmin
    .from("payments")
    .select("amount, status, created_at")
    .eq("course_reg_id", registrationId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)

  const approvedAmount =
    (payData ?? []).length > 0
      ? Number((payData as Array<{ amount: number | string }>)[0].amount)
      : null

  return {
    data: {
      id: row.id,
      course_id: row.course_id,
      user_id: row.user_id,
      attendees: Number(row.attendees),
      status: row.status,
      added_by_admin: Boolean(row.added_by_admin),
      created_at: row.created_at,
      course: rawCourse ? mapCourseRow(rawCourse) : null,
      payment_amount: approvedAmount,
      payment_status: approvedAmount != null ? "approved" : null,
      client_first_name: user?.first_name ?? null,
      client_last_name: user?.last_name ?? null,
      client_email: user?.email ?? null,
      approved_payment_amount: approvedAmount,
    },
    error: null,
  }
}

export async function getRegistrationForPayment(
  registrationId: string,
  userId: string
): Promise<Result<RegistrationWithCourse>> {
  const res = await getRegistrationForUser(registrationId, userId)
  if (!res.data) return res
  if (res.data.status !== "pending") {
    return {
      data: null,
      error: {
        message: "La inscripción ya no está pendiente de pago",
        code: "VALIDATION_ERROR",
      },
    }
  }
  return res
}
