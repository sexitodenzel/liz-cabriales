import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  getProductReviews,
  getProductReviewEligibility,
  upsertProductReview,
  type ProductReviewEligibility,
} from "@/lib/supabase/product-reviews"

type Params = Promise<{ id: string }>

/**
 * GET: reseñas aprobadas + resumen y, si hay sesión, elegibilidad de la
 * usuaria (compra verificada + su propia reseña aunque esté oculta).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const [{ reviews, summary }, eligibility] = await Promise.all([
      getProductReviews(id),
      user
        ? getProductReviewEligibility(id, user.id)
        : Promise.resolve<ProductReviewEligibility>({
            canReview: false,
            ownReview: null,
          }),
    ])

    return NextResponse.json({
      data: {
        reviews,
        summary,
        canReview: eligibility.canReview,
        ownReview: eligibility.ownReview,
      },
      error: null,
    })
  } catch (err) {
    console.error("[api/products/reviews GET] Error inesperado:", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
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

    const result = await upsertProductReview({
      productId: id,
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
    console.error("[api/products/reviews POST] Error inesperado:", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
