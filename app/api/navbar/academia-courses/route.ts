import { NextResponse } from "next/server"

import { getPublishedCoursesCached } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

export const dynamic = "force-dynamic"

const MAX_ITEMS = 2

type AcademiaCourse = {
  id: string
  title: string
  cover: string | null
  start_date: string
  level: CourseLevel
}

type ApiResponse =
  | { data: AcademiaCourse[]; error: null }
  | { data: null; error: { message: string; code?: string } }

// Fecha de hoy en formato YYYY-MM-DD (comparable con courses.start_date, que es
// una fecha sin zona horaria). Evita depender de la zona del servidor.
function todayISODate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const result = await getPublishedCoursesCached()

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: { message: result.error.message, code: result.error.code },
      },
      { status: 500 }
    )
  }

  const today = todayISODate()
  // getPublishedCoursesCached ya viene ordenado por start_date asc.
  const upcoming = result.data.filter((c) => c.start_date >= today)

  // Los 2 próximos por fecha; si no hay suficientes, se rellena con los más
  // recientes (start_date desc) para que el panel nunca abra vacío.
  const chosen = upcoming.slice(0, MAX_ITEMS)
  if (chosen.length < MAX_ITEMS) {
    const fallback = [...result.data]
      .reverse()
      .filter((c) => !chosen.some((x) => x.id === c.id))
    chosen.push(...fallback.slice(0, MAX_ITEMS - chosen.length))
  }

  const items: AcademiaCourse[] = chosen.map((course) => ({
    id: course.id,
    title: course.title,
    cover: course.cover_image ?? course.images[0]?.image_url ?? null,
    start_date: course.start_date,
    level: course.level,
  }))

  return NextResponse.json(
    { data: items, error: null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
