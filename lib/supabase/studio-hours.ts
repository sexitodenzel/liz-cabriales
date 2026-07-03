import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import {
  DEFAULT_STUDIO_WEEKLY_HOURS,
  normalizeStudioTime,
  type StudioWeeklyHourRow,
} from "@/lib/appointments/studio-hours"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

function mapRow(r: Record<string, unknown>): StudioWeeklyHourRow {
  const open = String(r.open_time ?? "09:00").slice(0, 5)
  const closeRaw = String(r.close_time ?? "19:00")
  const close =
    closeRaw.startsWith("23:59") || closeRaw.startsWith("24:")
      ? "24:00"
      : closeRaw.slice(0, 5)
  return {
    day_of_week: Number(r.day_of_week) as StudioWeeklyHourRow["day_of_week"],
    is_open: Boolean(r.is_open),
    open_time: open,
    close_time: close,
  }
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return (
    error.code === "42P01" ||
    error.message?.includes("studio_weekly_hours") === true
  )
}

async function loadStudioWeeklyHours(): Promise<StudioWeeklyHourRow[]> {
  const { data, error } = await supabaseAdmin
    .from("studio_weekly_hours")
    .select("day_of_week, is_open, open_time, close_time")
    .order("day_of_week", { ascending: true })

  if (error) {
    if (isMissingTableError(error)) return DEFAULT_STUDIO_WEEKLY_HOURS
    throw new Error(error.message)
  }

  if (!data || data.length === 0) return DEFAULT_STUDIO_WEEKLY_HOURS

  const byDay = new Map(
    data.map((row) => {
      const mapped = mapRow(row as Record<string, unknown>)
      return [mapped.day_of_week, mapped] as const
    })
  )
  return DEFAULT_STUDIO_WEEKLY_HOURS.map(
    (fallback) => byDay.get(fallback.day_of_week) ?? fallback
  )
}

export const getStudioWeeklyHoursCached = unstable_cache(
  loadStudioWeeklyHours,
  ["studio-weekly-hours"],
  { revalidate: 60, tags: ["studio-hours"] }
)

export async function getStudioWeeklyHours(): Promise<
  Result<StudioWeeklyHourRow[]>
> {
  try {
    const data = await loadStudioWeeklyHours()
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : "No se pudo cargar el horario del estudio",
      },
    }
  }
}

export type StudioWeeklyHourInput = {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

export async function saveStudioWeeklyHours(
  rows: StudioWeeklyHourInput[]
): Promise<Result<StudioWeeklyHourRow[]>> {
  const payload = rows.map((row) => ({
    day_of_week: row.day_of_week,
    is_open: row.is_open,
    open_time: `${normalizeStudioTime(row.open_time)}:00`,
    close_time:
      normalizeStudioTime(row.close_time) === "24:00"
        ? "23:59:59"
        : `${normalizeStudioTime(row.close_time)}:00`,
    updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabaseAdmin
    .from("studio_weekly_hours")
    .upsert(payload, { onConflict: "day_of_week" })
    .select("day_of_week, is_open, open_time, close_time")

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return {
    data: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    error: null,
  }
}
