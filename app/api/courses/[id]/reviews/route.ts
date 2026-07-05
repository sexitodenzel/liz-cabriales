import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  getCourseReviews,
  upsertReview,
} from "@/lib/supabase/course-reviews"
import { getCourseById } from "@/lib/supabase/courses"

type Params = Promise<{ id: string }>

function isCoursePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const { reviews, summary } = await getCourseReviews(id)
  return NextResponse.json({ data: { reviews, summary }, error: null })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Inicia sesión para reseñar", code: "UNAUTHENTICATED" },
        },
        { status: 401 }
      )
    }

    const { id } = await params

    const course = await getCourseById(id)
    if (!course.data || !course.data.is_published) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Curso no encontrado", code: "NOT_FOUND" },
        },
        { status: 404 }
      )
    }
    if (!isCoursePast(course.data.start_date)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Solo se pueden reseñar cursos ya realizados",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      )
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Cuerpo inválido", code: "VALIDATION_ERROR" },
        },
        { status: 400 }
      )
    }

    const body = json as { rating?: unknown; comment?: unknown }
    const rating = Number(body.rating)
    const comment =
      typeof body.comment === "string" ? body.comment : null

    const result = await upsertReview({
      courseId: id,
      userId: user.id,
      rating,
      comment,
    })

    if (!result.data) {
      const status =
        result.error.code === "FORBIDDEN"
          ? 403
          : result.error.code === "VALIDATION_ERROR"
            ? 400
            : 500
      return NextResponse.json({ data: null, error: result.error }, { status })
    }

    return NextResponse.json({ data: { review: result.data }, error: null })
  } catch (err) {
    console.error("[api/courses/reviews POST] Error inesperado:", err)
    return NextResponse.json(
      {
        data: null,
        error: { message: "Error interno del servidor" },
      },
      { status: 500 }
    )
  }
}
