import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  listFavoritedNailArtPosts,
  setNailArtFavorite,
  toPublicNailArtPosts,
} from "@/lib/supabase/nail-art"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const FAV_RATE_LIMIT = 60
const FAV_RATE_WINDOW_MS = 60_000

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "Inicia sesión", code: "UNAUTHENTICATED" } },
        { status: 401 }
      )
    }

    const posts = await listFavoritedNailArtPosts(user.id)
    return NextResponse.json({ data: toPublicNailArtPosts(posts), error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno" } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(
      `nail-art-fav:${getClientIp(request)}`,
      FAV_RATE_LIMIT,
      FAV_RATE_WINDOW_MS
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
        {
          data: null,
          error: { message: "Inicia sesión para guardar favoritos", code: "UNAUTHENTICATED" },
        },
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

    const parsed = body as { post_id?: unknown; favorited?: unknown }
    const postId = parsed.post_id
    if (typeof postId !== "string" || !postId) {
      return NextResponse.json(
        { data: null, error: { message: "post_id es requerido" } },
        { status: 400 }
      )
    }

    if (typeof parsed.favorited !== "boolean") {
      return NextResponse.json(
        { data: null, error: { message: "favorited (boolean) es requerido" } },
        { status: 400 }
      )
    }

    const result = await setNailArtFavorite(postId, user.id, parsed.favorited)
    if (result.error) {
      return NextResponse.json(
        { data: null, error: { message: result.error } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: { favorited: result.favorited },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno" } },
      { status: 500 }
    )
  }
}
