import { createClient as createServiceClient } from "@supabase/supabase-js"

import type { CourseLevel, RegistrationStatus } from "@/types"

import { createClient } from "./server"
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
  bio: string | null
  photo_url: string | null
  created_at: string
}

export type CourseRow = {
  id: string
  instructor_id: string
  title: string
  description: string
  cover_image: string | null
  price: number
  capacity: number
  level: CourseLevel
  start_date: string
  end_date: string | null
  start_time: string
  location: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export type CourseWithInstructor = CourseRow & {
  instructor: InstructorRow | null
}

export type CourseWithStats = CourseWithInstructor & {
  confirmed_count: number
  spots_remaining: number
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
  bio: string | null
  photo_url: string | null
  created_at: string
}

type RawCourseRow = {
  id: string
  instructor_id: string
  title: string
  description: string
  cover_image: string | null
  price: number | string
  capacity: number | string
  level: string
  start_date: string
  end_date: string | null
  start_time: string
  location: string
  is_published: boolean
  created_at: string
  updated_at: string
  instructors?: RawInstructor | RawInstructor[] | null
}

function mapCourseRow(row: RawCourseRow): CourseWithInstructor {
  const ins = unwrap(row.instructors)
  return {
    id: row.id,
    instructor_id: row.instructor_id,
    title: row.title,
    description: row.description,
    cover_image: row.cover_image,
    price: Number(row.price),
    capacity: Number(row.capacity),
    level: row.level as CourseLevel,
    start_date: row.start_date,
    end_date: row.end_date,
    start_time: row.start_time,
    location: row.location,
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
    updated_at: row.updated_at,
    instructor: ins
      ? {
          id: ins.id,
          name: ins.name,
          bio: ins.bio ?? null,
          photo_url: ins.photo_url ?? null,
          created_at: ins.created_at,
        }
      : null,
  }
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
  return {
    ...course,
    confirmed_count: paidCount,
    spots_remaining: Math.max(0, course.capacity - paidCount),
  }
}

const COURSE_COLUMNS = `
  id, instructor_id, title, description, cover_image, price, capacity,
  level, start_date, end_date, start_time, location, is_published,
  created_at, updated_at,
  instructors ( id, name, bio, photo_url, created_at )
`

/* ──────────────────────────────────────────────────────────────────────────
 * Lecturas públicas
 * ────────────────────────────────────────────────────────────────────── */

export async function getPublishedCourses(): Promise<Result<CourseWithStats[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("is_published", true)
    .order("start_date", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawCourseRow[]
  const courses = rows.map(mapCourseRow)
  const paidMap = await getPaidCountsForCourses(courses.map((c) => c.id))

  const withStats = courses.map((c) => attachStats(c, paidMap.get(c.id) ?? 0))
  return { data: withStats, error: null }
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

  const course = mapCourseRow(data as unknown as RawCourseRow)
  const paidMap = await getPaidCountsForCourses([course.id])
  return {
    data: attachStats(course, paidMap.get(course.id) ?? 0),
    error: null,
  }
}

export async function getInstructors(): Promise<Result<InstructorRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("instructors")
    .select("id, name, bio, photo_url, created_at")
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

  if (course.spots_remaining < attendees) {
    return {
      data: null,
      error: {
        message: "No hay lugares suficientes para esta inscripción",
        code: "COURSE_FULL",
      },
    }
  }

  // 2) Prevenir inscripción duplicada (pendiente o pagada)
  const existing = await findExistingActiveRegistration(courseId, userId)
  if (existing) {
    return {
      data: null,
      error: {
        message:
          existing.status === "paid"
            ? "Ya estás inscrito en este curso"
            : "Ya tienes una inscripción pendiente de pago para este curso",
        code:
          existing.status === "paid"
            ? "ALREADY_REGISTERED"
            : "PENDING_REGISTRATION_EXISTS",
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
  const courses = rows.map(mapCourseRow)
  const paidMap = await getPaidCountsForCourses(courses.map((c) => c.id))

  const withStats = courses.map((c) => attachStats(c, paidMap.get(c.id) ?? 0))
  return { data: withStats, error: null }
}

function normalizeCoursePayload(
  input: Partial<CreateCourseInput>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.title !== undefined) payload.title = input.title
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
  if (input.cover_image !== undefined)
    payload.cover_image =
      input.cover_image && input.cover_image.length > 0 ? input.cover_image : null
  if (input.is_published !== undefined)
    payload.is_published = input.is_published
  return payload
}

export async function createCourse(
  input: CreateCourseInput
): Promise<Result<CourseWithInstructor>> {
  const payload = normalizeCoursePayload(input)

  const { data, error } = await supabaseAdmin
    .from("courses")
    .insert(payload)
    .select(COURSE_COLUMNS)
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

  return { data: mapCourseRow(data as unknown as RawCourseRow), error: null }
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
    .select(COURSE_COLUMNS)
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

  return { data: mapCourseRow(data as unknown as RawCourseRow), error: null }
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
