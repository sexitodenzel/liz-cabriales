import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import {
  getUpcomingCourseDays,
  createCourseDay,
} from "@/lib/supabase/appointments"
import { getAdminCourses } from "@/lib/supabase/courses"

function errorResponse(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdminOrReceptionist(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return errorResponse(authResult.error.message, status)
    }

    const today = new Date().toISOString().split("T")[0]

    const [coursesRes, daysRes] = await Promise.all([
      getAdminCourses(),
      getUpcomingCourseDays(),
    ])

    const upcomingCourses = (coursesRes.data ?? []).filter(
      (c) => c.start_date >= today
    )
    const courseDays = daysRes.data ?? []

    // Match each course to its course_day entry (if any)
    const courseDatesWithEntry = new Set(
      courseDays
        .filter((cd) => upcomingCourses.some((c) => c.start_date === cd.date))
        .map((cd) => cd.date)
    )

    const registered_courses = upcomingCourses.map((course) => {
      const linked = courseDays.find((cd) => cd.date === course.start_date) ?? null
      return {
        course: {
          id: course.id,
          title: course.title,
          start_date: course.start_date,
          start_time: course.start_time,
        },
        course_day: linked
          ? { id: linked.id, start_time: linked.start_time, end_time: linked.end_time }
          : null,
      }
    })

    // Manual days = course_days not matched to any upcoming course
    const manual_days = courseDays
      .filter((cd) => !courseDatesWithEntry.has(cd.date))
      .map((cd) => ({
        id: cd.id,
        date: cd.date,
        start_time: cd.start_time,
        end_time: cd.end_time,
        reason: cd.reason,
      }))

    return NextResponse.json({
      data: { registered_courses, manual_days },
      error: null,
    })
  } catch (err) {
    console.error("[api/admin/course-days GET]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authResult = await requireAdminOrReceptionist(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return errorResponse(authResult.error.message, status)
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return errorResponse("Cuerpo inválido", 400)
    }

    const body = json as {
      date?: string
      start_time?: string
      end_time?: string
      course_name?: string
    }

    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return errorResponse("Fecha inválida", 400)
    }

    const result = await createCourseDay(
      body.date,
      body.start_time ?? "10:00",
      body.end_time ?? "14:00",
      body.course_name,
    )

    if (!result.data) {
      return errorResponse(result.error.message, 500)
    }

    return NextResponse.json({ data: { course_day: result.data }, error: null })
  } catch (err) {
    console.error("[api/admin/course-days POST]", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
