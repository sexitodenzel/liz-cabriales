import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/supabase/auth-server"
import {
  createUgcSignedUrl,
  extractUgcRelativePath,
  isUgcCover,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/supabase/nail-art-storage"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RouteContext = { params: Promise<{ postId: string }> }

/**
 * Sirve la cover de un post Nail Art sin exponer el path del bucket.
 * - approved (+ active): signed URL (o redirect a cover editorial no-UGC)
 * - pending: solo dueño o admin/receptionist
 * - resto: 403
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params
    if (!postId || !/^[0-9a-f-]{36}$/i.test(postId)) {
      return NextResponse.json({ error: "postId inválido" }, { status: 400 })
    }

    const { data: post, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select("id, cover_image, status, is_active, user_id, is_editorial")
      .eq("id", postId)
      .maybeSingle()

    if (error || !post) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const status = (post.status as string) ?? "approved"
    const isApprovedPublic = status === "approved" && post.is_active === true
    const isPending = status === "pending"

    if (!isApprovedPublic && !isPending) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 })
    }

    if (isPending) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "Prohibido" }, { status: 403 })
      }

      const isOwner = post.user_id === user.id
      if (!isOwner) {
        const profile = await getUserProfile(user.id)
        const isStaff =
          profile?.role === "admin" || profile?.role === "receptionist"
        if (!isStaff) {
          return NextResponse.json({ error: "Prohibido" }, { status: 403 })
        }
      }
    }

    const cover = typeof post.cover_image === "string" ? post.cover_image.trim() : ""
    if (!cover) {
      return NextResponse.json({ error: "Sin imagen" }, { status: 404 })
    }

    // Editorial / legacy no-UGC: URL pública absoluta ajena al bucket UGC
    if (!isUgcCover(cover)) {
      if (cover.startsWith("https://") || cover.startsWith("http://")) {
        return NextResponse.redirect(cover, 302)
      }
      return NextResponse.json({ error: "Imagen no disponible" }, { status: 404 })
    }

    const relative = extractUgcRelativePath(cover)
    if (!relative) {
      return NextResponse.json({ error: "Imagen no válida" }, { status: 404 })
    }

    const signed = await createUgcSignedUrl(relative)
    if ("error" in signed) {
      return NextResponse.json({ error: "No se pudo firmar la imagen" }, { status: 502 })
    }

    const res = NextResponse.redirect(signed.signedUrl, 302)
    res.headers.set(
      "Cache-Control",
      `private, max-age=${Math.min(300, SIGNED_URL_TTL_SECONDS)}, stale-while-revalidate=60`
    )
    return res
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
