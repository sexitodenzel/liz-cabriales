import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  getApprovedServiceReviews,
  upsertServiceReview,
} from "@/lib/supabase/service-reviews"

export async function GET() {
  const { reviews, summary } = await getApprovedServiceReviews()
  return NextResponse.json({ data: { reviews, summary }, error: null })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Inicia sesión para enviar una reseña",
            code: "UNAUTHENTICATED",
          },
        },
        { status: 401 }
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
    const comment = typeof body.comment === "string" ? body.comment : null

    const result = await upsertServiceReview({
      userId: user.id,
      rating,
      comment,
    })

    if (!result.data) {
      const status =
        result.error?.code === "VALIDATION_ERROR"
          ? 400
          : result.error?.code === "FORBIDDEN"
            ? 403
            : 500
      return NextResponse.json({ data: null, error: result.error }, { status })
    }

    return NextResponse.json({ data: { review: result.data }, error: null })
  } catch (err) {
    console.error("[api/service-reviews POST]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
