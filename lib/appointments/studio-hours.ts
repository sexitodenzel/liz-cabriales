/** 0=Domingo … 6=Sábado (igual que Date.getDay()) */
export type StudioDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type StudioWeeklyHourRow = {
  day_of_week: StudioDayOfWeek
  is_open: boolean
  open_time: string
  close_time: string
}

export const STUDIO_WEEK_DAYS: Array<{
  day_of_week: StudioDayOfWeek
  label: string
}> = [
  { day_of_week: 1, label: "Lunes" },
  { day_of_week: 2, label: "Martes" },
  { day_of_week: 3, label: "Miércoles" },
  { day_of_week: 4, label: "Jueves" },
  { day_of_week: 5, label: "Viernes" },
  { day_of_week: 6, label: "Sábado" },
  { day_of_week: 0, label: "Domingo" },
]

export const DEFAULT_STUDIO_WEEKLY_HOURS: StudioWeeklyHourRow[] = [
  { day_of_week: 0, is_open: false, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 1, is_open: true, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 2, is_open: true, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 3, is_open: true, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 4, is_open: true, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 5, is_open: true, open_time: "09:00", close_time: "19:00" },
  { day_of_week: 6, is_open: true, open_time: "09:00", close_time: "19:00" },
]

/** Opciones cada 30 min desde las 6:00 hasta medianoche (24:00). */
export function buildStudioTimeOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  for (let minutes = 6 * 60; minutes <= 24 * 60; minutes += 30) {
    const value = minutesToHHMM(minutes)
    options.push({ value, label: formatStudioTimeLabel(value) })
  }
  return options
}

export function minutesToHHMM(totalMin: number): string {
  const clamped = Math.min(Math.max(totalMin, 0), 24 * 60)
  if (clamped >= 24 * 60) return "24:00"
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function hhmmToMinutes(hhmm: string): number {
  if (hhmm.startsWith("24:")) return 24 * 60
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number)
  return h * 60 + m
}

export function formatStudioTimeLabel(hhmm: string): string {
  if (hhmm.startsWith("24:")) return "12:00 a.m."
  const total = hhmmToMinutes(hhmm)
  const h = Math.floor(total / 60)
  const m = total % 60
  const ampm = h >= 12 ? "p.m." : "a.m."
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

export function dayOfWeekFromDateString(dateStr: string): StudioDayOfWeek {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).getDay() as StudioDayOfWeek
}

export function normalizeStudioTime(value: string): string {
  const trimmed = value.trim().slice(0, 5)
  if (trimmed.startsWith("24")) return "24:00"
  return trimmed
}

export function resolveStudioDayHours(
  dateStr: string,
  weeklyHours: StudioWeeklyHourRow[]
): StudioWeeklyHourRow | null {
  const dow = dayOfWeekFromDateString(dateStr)
  const row =
    weeklyHours.find((h) => h.day_of_week === dow) ??
    DEFAULT_STUDIO_WEEKLY_HOURS.find((h) => h.day_of_week === dow)
  if (!row || !row.is_open) return null
  const open = hhmmToMinutes(normalizeStudioTime(row.open_time))
  const close = hhmmToMinutes(normalizeStudioTime(row.close_time))
  if (close <= open) return null
  return row
}

export function buildSlotStartsForDay(
  durationMin: number,
  openHHMM: string,
  closeHHMM: string,
  stepMin = 30
): number[] {
  const open = hhmmToMinutes(normalizeStudioTime(openHHMM))
  const close = hhmmToMinutes(normalizeStudioTime(closeHHMM))
  const slots: number[] = []
  for (let t = open; t + durationMin <= close; t += stepMin) {
    slots.push(t)
  }
  return slots
}

/** Bloqueo vigente si aún no pasó la hora de fin en la fecha del bloqueo. */
export function isBlockedSlotActive(
  block: { date: string; end_time: string },
  now = new Date()
): boolean {
  const [y, m, d] = block.date.split("-").map(Number)
  if (block.end_time.startsWith("23:59")) {
    const endAt = new Date(y, m - 1, d, 23, 59, 59, 999)
    return now.getTime() < endAt.getTime()
  }
  const endMin = hhmmToMinutes(block.end_time)
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  const endAt = new Date(y, m - 1, d, endH, endM, 0, 0)
  return now.getTime() < endAt.getTime()
}

export function eachDateInclusive(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  const out: string[] = []
  while (cursor.getTime() <= last.getTime()) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, "0")
    const d = String(cursor.getDate()).padStart(2, "0")
    out.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Fechas seleccionables según studio_weekly_hours (días con is_open = false se omiten). */
export function buildBookableDates(
  daysAhead: number,
  weeklyHours: StudioWeeklyHourRow[],
  fromDate = new Date()
): Date[] {
  const out: Date[] = []
  const start = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  )
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(start.getTime() + i * MS_PER_DAY)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const dateStr = `${y}-${m}-${dd}`
    if (resolveStudioDayHours(dateStr, weeklyHours)) {
      out.push(d)
    }
  }
  return out
}
