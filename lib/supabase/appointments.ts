import { createClient as createServiceClient } from "@supabase/supabase-js"

import {
  appointmentAllowsClientCancel,
  CANCEL_MIN_HOURS,
} from "@/lib/appointmentCancelPolicy"
import type { AppointmentStatus, AppointmentType } from "@/types"

import { createClient } from "./server"
import type {
  AdminCreateAppointmentInput,
  BlockedSlotInput,
  CreateAppointmentInput,
} from "@/lib/validations/appointments"

/* ──────────────────────────────────────────────────────────────────────────
 * Cliente admin (bypass RLS) — usado para escrituras y agendas cruzadas.
 * ────────────────────────────────────────────────────────────────────── */
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

/* ──────────────────────────────────────────────────────────────────────────
 * Constantes de operación y utilidades de tiempo
 * ────────────────────────────────────────────────────────────────────── */

// Horario base de operación (ajustable). Lunes (1) a sábado (6).
export const BUSINESS_OPEN_HHMM = "09:00"
export const BUSINESS_CLOSE_HHMM = "19:00"
export const SLOT_STEP_MIN = 30
export const MIN_LEAD_MINUTES = 60
export { CANCEL_MIN_HOURS }

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number)
  return h * 60 + m
}

function minutesToHHMMSS(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

function normalizeTime(value: string): string {
  const s = value.slice(0, 5)
  return `${s}:00`
}

function isSunday(dateStr: string): boolean {
  // dateStr en formato YYYY-MM-DD (hora local del servidor)
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getDay() === 0
}

function buildSlotStarts(durationMin: number): number[] {
  const open = hhmmToMinutes(BUSINESS_OPEN_HHMM)
  const close = hhmmToMinutes(BUSINESS_CLOSE_HHMM)
  const slots: number[] = []
  for (let t = open; t + durationMin <= close; t += SLOT_STEP_MIN) {
    slots.push(t)
  }
  return slots
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tipos públicos
 * ────────────────────────────────────────────────────────────────────── */

export type ServiceRow = {
  id: string
  name: string
  description: string | null
  price: number
  duration_min: number
  is_active: boolean
}

export type ProfessionalRow = {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  is_active: boolean
}

export type AvailabilitySlot = {
  start_time: string // "HH:MM:SS"
  end_time: string // "HH:MM:SS"
  professional_id: string
}

export type AppointmentServiceLine = {
  service_id: string
  service_name: string
  unit_price: number
  duration_min: number
}

export type AppointmentRecord = {
  id: string
  user_id: string | null
  professional_id: string
  professional_name: string | null
  appointment_type: AppointmentType
  date: string
  start_time: string
  end_time: string
  total: number
  status: AppointmentStatus
  created_at: string
  services: AppointmentServiceLine[]
}

export type AppointmentWithDetails = AppointmentRecord & {
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
}

export type AdminAppointmentRow = AppointmentRecord & {
  client_first_name: string | null
  client_last_name: string | null
  client_email: string | null
}

export type BlockedSlotRow = {
  id: string
  professional_id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
  created_at: string
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lecturas básicas
 * ────────────────────────────────────────────────────────────────────── */

export async function getServices(): Promise<Result<ServiceRow[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_min, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: Number(r.price),
    duration_min: Number(r.duration_min),
    is_active: Boolean(r.is_active),
  }))

  return { data: rows, error: null }
}

export async function getProfessionals(): Promise<Result<ProfessionalRow[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("professionals")
    .select("id, name, bio, photo_url, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    bio: (r.bio as string | null) ?? null,
    photo_url: (r.photo_url as string | null) ?? null,
    is_active: Boolean(r.is_active),
  }))

  return { data: rows, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Disponibilidad
 * ────────────────────────────────────────────────────────────────────── */

type BusySlot = { startMin: number; endMin: number; professionalId: string }

async function loadBusySlots(
  date: string,
  professionalIds: string[]
): Promise<Result<BusySlot[]>> {
  if (professionalIds.length === 0) return { data: [], error: null }

  const { data: appts, error: apptError } = await supabaseAdmin
    .from("appointments")
    .select("professional_id, start_time, end_time, status")
    .eq("date", date)
    .in("professional_id", professionalIds)
    .neq("status", "cancelled")

  if (apptError) {
    return {
      data: null,
      error: { message: apptError.message, code: apptError.code },
    }
  }

  const { data: blocks, error: blockError } = await supabaseAdmin
    .from("blocked_slots")
    .select("professional_id, start_time, end_time")
    .eq("date", date)
    .in("professional_id", professionalIds)

  if (blockError) {
    return {
      data: null,
      error: { message: blockError.message, code: blockError.code },
    }
  }

  const busy: BusySlot[] = []

  for (const row of appts ?? []) {
    const r = row as {
      professional_id: string
      start_time: string
      end_time: string
    }
    busy.push({
      professionalId: r.professional_id,
      startMin: hhmmToMinutes(r.start_time),
      endMin: hhmmToMinutes(r.end_time),
    })
  }

  for (const row of blocks ?? []) {
    const r = row as {
      professional_id: string
      start_time: string
      end_time: string
    }
    busy.push({
      professionalId: r.professional_id,
      startMin: hhmmToMinutes(r.start_time),
      endMin: hhmmToMinutes(r.end_time),
    })
  }

  return { data: busy, error: null }
}

function filterAvailableStartsForProfessional(
  slots: number[],
  durationMin: number,
  busy: BusySlot[],
  professionalId: string,
  minStartMin: number | null
): number[] {
  return slots.filter((startMin) => {
    if (minStartMin !== null && startMin < minStartMin) return false
    const endMin = startMin + durationMin
    for (const b of busy) {
      if (b.professionalId !== professionalId) continue
      if (overlaps(startMin, endMin, b.startMin, b.endMin)) return false
    }
    return true
  })
}

/**
 * Calcula slots disponibles. Si professionalId === "any" devuelve la unión
 * de slots entre los profesionales activos (asignando uno disponible).
 * Considera: horario 9-19, intervalos de 30 min, mínimo 1 hora de anticipación,
 * sin domingos, sin traslapes con citas ni bloqueos.
 */
export async function getAvailableSlots(
  date: string,
  professionalId: string,
  durationMin: number
): Promise<Result<AvailabilitySlot[]>> {
  if (durationMin <= 0) {
    return {
      data: null,
      error: { message: "Duración inválida", code: "VALIDATION_ERROR" },
    }
  }

  if (isSunday(date)) {
    return { data: [], error: null }
  }

  // Profesionales considerados
  let targetProfessionalIds: string[]
  if (professionalId === "any") {
    const profs = await getProfessionals()
    if (!profs.data) return profs
    targetProfessionalIds = profs.data.map((p) => p.id)
  } else {
    targetProfessionalIds = [professionalId]
  }

  if (targetProfessionalIds.length === 0) return { data: [], error: null }

  const busyResult = await loadBusySlots(date, targetProfessionalIds)
  if (!busyResult.data) return busyResult

  const now = new Date()
  const [y, m, d] = date.split("-").map(Number)
  const dayDate = new Date(y, m - 1, d)
  const isToday =
    dayDate.getFullYear() === now.getFullYear() &&
    dayDate.getMonth() === now.getMonth() &&
    dayDate.getDate() === now.getDate()

  let minStartMin: number | null = null
  if (isToday) {
    const nowPlusLead = new Date(now.getTime() + MIN_LEAD_MINUTES * 60 * 1000)
    minStartMin = nowPlusLead.getHours() * 60 + nowPlusLead.getMinutes()
  } else if (dayDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    // Fecha en el pasado
    return { data: [], error: null }
  }

  const baseSlots = buildSlotStarts(durationMin)

  const slotsOut: AvailabilitySlot[] = []
  const seenMinutes = new Set<number>()

  for (const pid of targetProfessionalIds) {
    const avail = filterAvailableStartsForProfessional(
      baseSlots,
      durationMin,
      busyResult.data,
      pid,
      minStartMin
    )
    for (const startMin of avail) {
      if (professionalId === "any" && seenMinutes.has(startMin)) continue
      seenMinutes.add(startMin)
      slotsOut.push({
        start_time: minutesToHHMMSS(startMin),
        end_time: minutesToHHMMSS(startMin + durationMin),
        professional_id: pid,
      })
    }
  }

  slotsOut.sort((a, b) =>
    a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0
  )

  return { data: slotsOut, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Creación, cancelación y lecturas de citas
 * ────────────────────────────────────────────────────────────────────── */

async function loadServicesForIds(
  serviceIds: string[]
): Promise<Result<ServiceRow[]>> {
  if (serviceIds.length === 0) {
    return {
      data: null,
      error: {
        message: "Debes seleccionar al menos un servicio",
        code: "VALIDATION_ERROR",
      },
    }
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id, name, description, price, duration_min, is_active")
    .in("id", serviceIds)
    .eq("is_active", true)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: Number(r.price),
    duration_min: Number(r.duration_min),
    is_active: Boolean(r.is_active),
  }))

  if (rows.length !== serviceIds.length) {
    return {
      data: null,
      error: {
        message: "Uno o más servicios no están disponibles",
        code: "SERVICE_NOT_FOUND",
      },
    }
  }

  return { data: rows, error: null }
}

type CreateAppointmentArgs = CreateAppointmentInput & {
  user_id: string
  appointment_type?: AppointmentType
  skip_user_active_check?: boolean
  force_status?: AppointmentStatus
}

export async function createAppointment(
  input: CreateAppointmentArgs
): Promise<Result<{ appointment_id: string; total: number; end_time: string }>> {
  // 1) Validación de servicios
  const servicesResult = await loadServicesForIds(input.service_ids)
  if (!servicesResult.data) return servicesResult
  const services = servicesResult.data

  const totalDuration = services.reduce((a, s) => a + s.duration_min, 0)
  const total = services.reduce((a, s) => a + s.price, 0)
  const startMin = hhmmToMinutes(input.start_time)
  const endMin = startMin + totalDuration
  const closeMin = hhmmToMinutes(BUSINESS_CLOSE_HHMM)

  if (endMin > closeMin) {
    return {
      data: null,
      error: {
        message: "El horario excede el cierre del negocio",
        code: "OUT_OF_BUSINESS_HOURS",
      },
    }
  }

  if (isSunday(input.date)) {
    return {
      data: null,
      error: {
        message: "No se atiende los domingos",
        code: "CLOSED_DAY",
      },
    }
  }

  // 2) Resolver profesional ("any" → primero disponible)
  const allProfs = await getProfessionals()
  if (!allProfs.data) return allProfs

  let resolvedProfId: string
  if (input.professional_id === "any") {
    const busy = await loadBusySlots(
      input.date,
      allProfs.data.map((p) => p.id)
    )
    if (!busy.data) return busy
    const candidate = allProfs.data.find((p) => {
      for (const b of busy.data!) {
        if (b.professionalId !== p.id) continue
        if (overlaps(startMin, endMin, b.startMin, b.endMin)) return false
      }
      return true
    })
    if (!candidate) {
      return {
        data: null,
        error: {
          message: "No hay profesionales disponibles en ese horario",
          code: "SLOT_UNAVAILABLE",
        },
      }
    }
    resolvedProfId = candidate.id
  } else {
    resolvedProfId = input.professional_id
    const busy = await loadBusySlots(input.date, [resolvedProfId])
    if (!busy.data) return busy
    for (const b of busy.data) {
      if (overlaps(startMin, endMin, b.startMin, b.endMin)) {
        return {
          data: null,
          error: {
            message: "El horario seleccionado ya no está disponible",
            code: "SLOT_UNAVAILABLE",
          },
        }
      }
    }
  }

  // 3) Mínimo 1h de anticipación
  if (!input.force_status) {
    const [yy, mm, dd] = input.date.split("-").map(Number)
    const h = Math.floor(startMin / 60)
    const m = startMin % 60
    const apptDate = new Date(yy, mm - 1, dd, h, m, 0, 0)
    const nowPlus = new Date(Date.now() + MIN_LEAD_MINUTES * 60 * 1000)
    if (apptDate.getTime() < nowPlus.getTime()) {
      return {
        data: null,
        error: {
          message: "Debes reservar con al menos 1 hora de anticipación",
          code: "TOO_SOON",
        },
      }
    }
  }

  // 4) Un usuario solo puede tener 1 cita activa
  if (!input.skip_user_active_check) {
    const active = await getUserActiveAppointment(input.user_id)
    if (active.data) {
      return {
        data: null,
        error: {
          message: "Ya tienes una cita activa. Cancélala antes de crear otra.",
          code: "ACTIVE_APPOINTMENT_EXISTS",
        },
      }
    }
  }

  // 5) Insertar appointment
  const status: AppointmentStatus = input.force_status ?? "pending"
  const startTime = normalizeTime(input.start_time)
  const endTime = minutesToHHMMSS(endMin)

  const { data: appt, error: apptError } = await supabaseAdmin
    .from("appointments")
    .insert({
      user_id: input.user_id,
      professional_id: resolvedProfId,
      appointment_type: input.appointment_type ?? "individual",
      date: input.date,
      start_time: startTime,
      end_time: endTime,
      total,
      status,
    })
    .select("id")
    .single()

  if (apptError || !appt) {
    return {
      data: null,
      error: {
        message: apptError?.message ?? "No se pudo crear la cita",
        code: apptError?.code ?? "APPOINTMENT_CREATE_FAILED",
      },
    }
  }

  const apptId = appt.id as string

  // 6) Insertar appointment_services
  const lines = services.map((s) => ({
    appointment_id: apptId,
    service_id: s.id,
    unit_price: s.price,
  }))

  const { error: linesError } = await supabaseAdmin
    .from("appointment_services")
    .insert(lines)

  if (linesError) {
    // rollback manual
    await supabaseAdmin.from("appointments").delete().eq("id", apptId)
    return {
      data: null,
      error: {
        message: linesError.message,
        code: linesError.code,
      },
    }
  }

  return {
    data: { appointment_id: apptId, total, end_time: endTime },
    error: null,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lecturas de citas con datos agregados
 * ────────────────────────────────────────────────────────────────────── */

type RawApptRow = {
  id: string
  user_id: string | null
  professional_id: string
  appointment_type: string
  date: string
  start_time: string
  end_time: string
  total: number | string
  status: string
  created_at: string
  professionals: { name?: string } | { name?: string }[] | null
  appointment_services:
    | Array<{
        service_id: string
        unit_price: number | string
        services: { name?: string; duration_min?: number }
          | { name?: string; duration_min?: number }[]
          | null
      }>
    | null
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function mapApptRow(row: RawApptRow): AppointmentRecord {
  const prof = unwrap(row.professionals)
  const services: AppointmentServiceLine[] = (row.appointment_services ?? []).map(
    (line) => {
      const svc = unwrap(line.services)
      return {
        service_id: line.service_id,
        service_name: svc?.name ?? "Servicio",
        unit_price: Number(line.unit_price),
        duration_min: Number(svc?.duration_min ?? 0),
      }
    }
  )
  return {
    id: row.id,
    user_id: row.user_id,
    professional_id: row.professional_id,
    professional_name: prof?.name ?? null,
    appointment_type: row.appointment_type as AppointmentType,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    total: Number(row.total),
    status: row.status as AppointmentStatus,
    created_at: row.created_at,
    services,
  }
}

export async function listAppointmentsForUser(
  userId: string
): Promise<Result<AppointmentRecord[]>> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      `id, user_id, professional_id, appointment_type, date, start_time, end_time,
       total, status, created_at,
       professionals ( name ),
       appointment_services (
         service_id, unit_price,
         services ( name, duration_min )
       )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawApptRow[]
  return { data: rows.map(mapApptRow), error: null }
}

export async function getUserActiveAppointment(
  userId: string
): Promise<Result<AppointmentRecord | null>> {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  const todayStr = `${yyyy}-${mm}-${dd}`

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      `id, user_id, professional_id, appointment_type, date, start_time, end_time,
       total, status, created_at,
       professionals ( name ),
       appointment_services (
         service_id, unit_price,
         services ( name, duration_min )
       )`
    )
    .eq("user_id", userId)
    .in("status", ["pending", "paid"])
    .gte("date", todayStr)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawApptRow[]
  if (rows.length === 0) return { data: null, error: null }

  return { data: mapApptRow(rows[0]), error: null }
}

export async function getAppointmentForUser(
  appointmentId: string,
  userId: string
): Promise<Result<AppointmentRecord>> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      `id, user_id, professional_id, appointment_type, date, start_time, end_time,
       total, status, created_at,
       professionals ( name ),
       appointment_services (
         service_id, unit_price,
         services ( name, duration_min )
       )`
    )
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  if (!data) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }

  const row = data as unknown as RawApptRow
  if (row.user_id !== userId) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }

  return { data: mapApptRow(row), error: null }
}

/**
 * Obtiene todos los datos necesarios para enviar un email de cita:
 * servicios, profesional y datos del usuario (email, nombre).
 */
export async function getAppointmentWithDetails(
  appointmentId: string
): Promise<Result<AppointmentWithDetails>> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(
      `id, user_id, professional_id, appointment_type, date, start_time, end_time,
       total, status, created_at,
       professionals ( name ),
       users ( first_name, last_name, email ),
       appointment_services (
         service_id, unit_price,
         services ( name, duration_min )
       )`
    )
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }

  const row = data as unknown as RawAdminApptRow
  const base = mapApptRow(row)
  const user = unwrap(row.users)

  return {
    data: {
      ...base,
      client_first_name: user?.first_name ?? null,
      client_last_name: user?.last_name ?? null,
      client_email: user?.email ?? null,
    },
    error: null,
  }
}

export async function getAppointmentForPayment(
  appointmentId: string,
  userId: string
): Promise<Result<AppointmentRecord>> {
  const result = await getAppointmentForUser(appointmentId, userId)
  if (!result.data) return result
  if (result.data.status !== "pending") {
    return {
      data: null,
      error: {
        message: "La cita ya no está pendiente de pago",
        code: "VALIDATION_ERROR",
      },
    }
  }
  return result
}

export async function cancelAppointment(
  appointmentId: string,
  userId: string
): Promise<Result<null>> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id, user_id, date, start_time, status")
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }

  const r = data as {
    id: string
    user_id: string | null
    date: string
    start_time: string
    status: string
  }

  if (r.user_id !== userId) {
    return {
      data: null,
      error: { message: "No autorizado", code: "FORBIDDEN" },
    }
  }

  if (r.status === "cancelled") {
    return {
      data: null,
      error: { message: "La cita ya está cancelada", code: "ALREADY_CANCELLED" },
    }
  }

  if (r.status === "completed") {
    return {
      data: null,
      error: {
        message: "No puedes cancelar una cita completada",
        code: "ALREADY_COMPLETED",
      },
    }
  }

  if (
    !appointmentAllowsClientCancel({
      date: r.date,
      start_time: r.start_time,
      status: r.status as AppointmentStatus,
    })
  ) {
    return {
      data: null,
      error: {
        message: "Las cancelaciones requieren al menos 24 horas de anticipación",
        code: "CANCEL_TOO_LATE",
      },
    }
  }

  const { error: updError } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)

  if (updError) {
    return {
      data: null,
      error: { message: updError.message, code: updError.code },
    }
  }

  return { data: null, error: null }
}

export async function adminCancelAppointment(
  appointmentId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export type RescheduleAppointmentInput = {
  date: string
  start_time: string
  professional_id?: string
}

export type RescheduleAppointmentResult = {
  appointment_id: string
  previous_date: string
  previous_start_time: string
  previous_end_time: string
  previous_professional_id: string
  new_date: string
  new_start_time: string
  new_end_time: string
  new_professional_id: string
  total: number
}

/**
 * Reprograma una cita existente a una nueva fecha/hora y opcionalmente a otro
 * profesional. Verifica disponibilidad del nuevo slot y preserva los datos
 * previos para poder notificar al cliente.
 */
export async function rescheduleAppointment(
  appointmentId: string,
  input: RescheduleAppointmentInput
): Promise<Result<RescheduleAppointmentResult>> {
  // 1) Cargar cita actual + servicios para recalcular duración
  const { data: apptRow, error: apptErr } = await supabaseAdmin
    .from("appointments")
    .select(
      `id, professional_id, date, start_time, end_time, total, status,
       appointment_services ( service_id, unit_price, services ( duration_min ) )`
    )
    .eq("id", appointmentId)
    .maybeSingle()

  if (apptErr) {
    return {
      data: null,
      error: { message: apptErr.message, code: apptErr.code },
    }
  }
  if (!apptRow) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }

  type ApptSvcRow = {
    service_id: string
    unit_price: number | string
    services:
      | { duration_min?: number }
      | { duration_min?: number }[]
      | null
  }

  const row = apptRow as unknown as {
    id: string
    professional_id: string
    date: string
    start_time: string
    end_time: string
    total: number | string
    status: string
    appointment_services: ApptSvcRow[] | null
  }

  if (row.status === "cancelled" || row.status === "completed") {
    return {
      data: null,
      error: {
        message: "No se puede reprogramar una cita cancelada o completada",
        code: "INVALID_STATUS",
      },
    }
  }

  // 2) Calcular duración total en base a los servicios actuales de la cita
  const lines = row.appointment_services ?? []
  let totalDuration = 0
  for (const line of lines) {
    const svc = unwrap(line.services)
    totalDuration += Number(svc?.duration_min ?? 0)
  }
  if (totalDuration <= 0) {
    return {
      data: null,
      error: {
        message:
          "No se pudo calcular la duración de la cita para reprogramarla",
        code: "VALIDATION_ERROR",
      },
    }
  }

  // 3) Validar nuevo horario
  if (isSunday(input.date)) {
    return {
      data: null,
      error: { message: "No se atiende los domingos", code: "CLOSED_DAY" },
    }
  }

  const newStartMin = hhmmToMinutes(input.start_time)
  const newEndMin = newStartMin + totalDuration
  const closeMin = hhmmToMinutes(BUSINESS_CLOSE_HHMM)
  if (newEndMin > closeMin) {
    return {
      data: null,
      error: {
        message: "El horario excede el cierre del negocio",
        code: "OUT_OF_BUSINESS_HOURS",
      },
    }
  }

  const targetProfId = input.professional_id ?? row.professional_id

  // 4) Verificar disponibilidad del nuevo slot (excluyendo la cita misma)
  const busyRes = await loadBusySlots(input.date, [targetProfId])
  if (!busyRes.data) return busyRes

  // Filtrar conflictos que correspondan a la misma cita (caso: misma fecha/hora)
  // loadBusySlots no retorna id, por lo que recargamos citas del día para comparar
  const { data: dayAppts, error: dayErr } = await supabaseAdmin
    .from("appointments")
    .select("id, professional_id, start_time, end_time, status")
    .eq("date", input.date)
    .eq("professional_id", targetProfId)
    .neq("status", "cancelled")

  if (dayErr) {
    return {
      data: null,
      error: { message: dayErr.message, code: dayErr.code },
    }
  }

  for (const a of (dayAppts ?? []) as Array<{
    id: string
    start_time: string
    end_time: string
  }>) {
    if (a.id === appointmentId) continue
    const bStart = hhmmToMinutes(a.start_time)
    const bEnd = hhmmToMinutes(a.end_time)
    if (overlaps(newStartMin, newEndMin, bStart, bEnd)) {
      return {
        data: null,
        error: {
          message: "El horario seleccionado ya no está disponible",
          code: "SLOT_UNAVAILABLE",
        },
      }
    }
  }

  const { data: dayBlocks, error: blkErr } = await supabaseAdmin
    .from("blocked_slots")
    .select("start_time, end_time")
    .eq("date", input.date)
    .eq("professional_id", targetProfId)

  if (blkErr) {
    return {
      data: null,
      error: { message: blkErr.message, code: blkErr.code },
    }
  }

  for (const b of (dayBlocks ?? []) as Array<{
    start_time: string
    end_time: string
  }>) {
    const bStart = hhmmToMinutes(b.start_time)
    const bEnd = hhmmToMinutes(b.end_time)
    if (overlaps(newStartMin, newEndMin, bStart, bEnd)) {
      return {
        data: null,
        error: {
          message: "El horario seleccionado ya no está disponible",
          code: "SLOT_UNAVAILABLE",
        },
      }
    }
  }

  // 5) Actualizar
  const newStartTime = normalizeTime(input.start_time)
  const newEndTime = minutesToHHMMSS(newEndMin)

  const { error: updErr } = await supabaseAdmin
    .from("appointments")
    .update({
      date: input.date,
      start_time: newStartTime,
      end_time: newEndTime,
      professional_id: targetProfId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)

  if (updErr) {
    return {
      data: null,
      error: { message: updErr.message, code: updErr.code },
    }
  }

  return {
    data: {
      appointment_id: appointmentId,
      previous_date: row.date,
      previous_start_time: row.start_time,
      previous_end_time: row.end_time,
      previous_professional_id: row.professional_id,
      new_date: input.date,
      new_start_time: newStartTime,
      new_end_time: newEndTime,
      new_professional_id: targetProfId,
      total: Number(row.total),
    },
    error: null,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Agenda admin
 * ────────────────────────────────────────────────────────────────────── */

type RawAdminApptRow = RawApptRow & {
  users:
    | { first_name?: string; last_name?: string; email?: string }
    | { first_name?: string; last_name?: string; email?: string }[]
    | null
}

export async function getAdminAppointments(
  date?: string,
  professionalId?: string
): Promise<Result<AdminAppointmentRow[]>> {
  let query = supabaseAdmin
    .from("appointments")
    .select(
      `id, user_id, professional_id, appointment_type, date, start_time, end_time,
       total, status, created_at,
       professionals ( name ),
       users ( first_name, last_name, email ),
       appointment_services (
         service_id, unit_price,
         services ( name, duration_min )
       )`
    )
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (date) query = query.eq("date", date)
  if (professionalId) query = query.eq("professional_id", professionalId)

  const { data, error } = await query

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = (data ?? []) as unknown as RawAdminApptRow[]
  const result: AdminAppointmentRow[] = rows.map((row) => {
    const base = mapApptRow(row)
    const user = unwrap(row.users)
    return {
      ...base,
      client_first_name: user?.first_name ?? null,
      client_last_name: user?.last_name ?? null,
      client_email: user?.email ?? null,
    }
  })

  return { data: result, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Bloqueos de horario
 * ────────────────────────────────────────────────────────────────────── */

export async function createBlockedSlot(
  input: BlockedSlotInput
): Promise<Result<BlockedSlotRow>> {
  const { data, error } = await supabaseAdmin
    .from("blocked_slots")
    .insert({
      professional_id: input.professional_id,
      date: input.date,
      start_time: normalizeTime(input.start_time),
      end_time: normalizeTime(input.end_time),
      reason: input.reason ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo bloquear el horario",
        code: error?.code,
      },
    }
  }

  return { data: data as BlockedSlotRow, error: null }
}

export async function deleteBlockedSlot(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("blocked_slots")
    .delete()
    .eq("id", id)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: null, error: null }
}

export async function getBlockedSlotsForDate(
  date: string,
  professionalId?: string
): Promise<Result<BlockedSlotRow[]>> {
  let query = supabaseAdmin
    .from("blocked_slots")
    .select("id, professional_id, date, start_time, end_time, reason, created_at")
    .eq("date", date)
    .order("start_time", { ascending: true })

  if (professionalId) query = query.eq("professional_id", professionalId)

  const { data, error } = await query

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: (data ?? []) as BlockedSlotRow[], error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Pagos / webhook helpers
 * ────────────────────────────────────────────────────────────────────── */

export async function getAppointmentForPaymentWebhook(
  appointmentId: string
): Promise<Result<{ id: string; status: string; user_id: string | null }>> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id, status, user_id")
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  if (!data) {
    return {
      data: null,
      error: { message: "Cita no encontrada", code: "NOT_FOUND" },
    }
  }
  return {
    data: data as { id: string; status: string; user_id: string | null },
    error: null,
  }
}

export async function claimApprovedPaymentForAppointment(
  appointmentId: string
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
    .eq("appointment_id", appointmentId)
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

export async function markAppointmentPaymentRejected(
  appointmentId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("appointment_id", appointmentId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function updateAppointmentStatusToPaid(
  appointmentId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function updateAppointmentStatusToCancelledFromPayment(
  appointmentId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("status", "pending")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helper expuesto para el admin: crear cita manual
 * ────────────────────────────────────────────────────────────────────── */

export async function adminCreateManualAppointment(
  input: AdminCreateAppointmentInput
): Promise<Result<{ appointment_id: string; total: number }>> {
  if (!input.user_id) {
    return {
      data: null,
      error: {
        message:
          "Se requiere vincular un usuario existente para registrar la cita",
        code: "USER_REQUIRED",
      },
    }
  }

  const result = await createAppointment({
    user_id: input.user_id,
    service_ids: input.service_ids,
    professional_id: input.professional_id,
    date: input.date,
    start_time: input.start_time,
    appointment_type: "individual",
    skip_user_active_check: true,
    force_status: "paid",
  })

  if (!result.data) return result

  return {
    data: {
      appointment_id: result.data.appointment_id,
      total: result.data.total,
    },
    error: null,
  }
}
