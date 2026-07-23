import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/auth-server"
import {
  validateAndNormalizeUgcCover,
} from "@/lib/supabase/nail-art-storage"
import { submitNailArtInspiration } from "@/lib/supabase/nail-art"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const SUBMIT_RATE_LIMIT = 8
const SUBMIT_RATE_WINDOW_MS = 60 * 60 * 1000
const MAX_PRODUCTS = 8

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(
      `nail-art-submit:${getClientIp(request)}`,
      SUBMIT_RATE_LIMIT,
      SUBMIT_RATE_WINDOW_MS
    )
    if (!rate.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "Has enviado demasiadas inspiraciones. Intenta más tarde.",
            code: "RATE_LIMITED",
          },
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "Inicia sesión para publicar", code: "UNAUTHENTICATED" } },
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

    const { description, cover_image, product_ids } = body as Record<string, unknown>

    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { data: null, error: { message: "La descripción es requerida" } },
        { status: 400 }
      )
    }
    if (typeof cover_image !== "string" || !cover_image.trim()) {
      return NextResponse.json(
        { data: null, error: { message: "La imagen es requerida" } },
        { status: 400 }
      )
    }

    const coverCheck = validateAndNormalizeUgcCover(cover_image, user.id)
    if ("error" in coverCheck) {
      return NextResponse.json(
        { data: null, error: { message: coverCheck.error } },
        { status: 400 }
      )
    }

    if (!Array.isArray(product_ids) || product_ids.length < 1) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Selecciona al menos un producto de la tienda" },
        },
        { status: 400 }
      )
    }
    const productIds = product_ids
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, MAX_PRODUCTS)
    if (productIds.length < 1) {
      return NextResponse.json(
        { data: null, error: { message: "Productos inválidos" } },
        { status: 400 }
      )
    }

    const profile = await getUserProfile(user.id)
    const isAdmin = profile?.role === "admin"
    const nameParts = [profile?.first_name, profile?.last_name]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
    const authorDisplayName =
      nameParts.length > 0
        ? nameParts.join(" ")
        : (profile?.email?.split("@")[0] ?? user.email?.split("@")[0] ?? "Usuario")

    const result = await submitNailArtInspiration({
      userId: user.id,
      authorDisplayName,
      description: description.trim().slice(0, 2000),
      coverImage: coverCheck.path,
      productIds,
      asEditorial: isAdmin,
    })

    if (result.error) {
      return NextResponse.json(
        { data: null, error: { message: result.error } },
        { status: 400 }
      )
    }

    if (result.published) {
      revalidatePath("/nail-art")
      if (result.slug) revalidatePath(`/nail-art/${result.slug}`)
    }

    return NextResponse.json(
      {
        data: {
          id: result.id,
          slug: result.slug,
          published: result.published,
          message: result.published
            ? "Publicado en Nail Art con el sello Elaborado por Nosotros."
            : "Tu inspiración quedó en revisión.",
        },
        error: null,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno" } },
      { status: 500 }
    )
  }
}
