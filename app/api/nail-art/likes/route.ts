import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { toggleNailArtLike } from "@/lib/supabase/nail-art"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const LIKE_RATE_LIMIT = 60
const LIKE_RATE_WINDOW_MS = 60_000

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(
      `nail-art-like:${getClientIp(request)}`,
      LIKE_RATE_LIMIT,
      LIKE_RATE_WINDOW_MS
    )
    if (!rate.allowed) {
      return NextResponse.json(
        { data: null, error: { message: "Demasiadas acciones", code: "RATE_LIMITED" } },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "Inicia sesión para dar like", code: "UNAUTHENTICATED" } },
        { status: 401 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: "Cuerpo inválido" } },
        { status: 400 }
      )
    }

    const postId = (body as { post_id?: unknown }).post_id
    if (typeof postId !== "string" || !postId) {
      return NextResponse.json(
        { data: null, error: { message: "post_id es requerido" } },
        { status: 400 }
      )
    }

    const result = await toggleNailArtLike(postId, user.id)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: { message: result.error } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: { liked: result.liked, likes_count: result.likes_count },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno" } },
      { status: 500 }
    )
  }
}
