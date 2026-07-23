import { NextRequest, NextResponse } from "next/server"

import { getNailArtPosts, type NailArtSort } from "@/lib/supabase/nail-art"
import { nailArtImageApiPath } from "@/lib/nail-art-image"

export const revalidate = 60

type NailArtListItem = {
  id: string
  title: string
  slug: string
  /** Ruta de la app (no path de Storage). */
  cover_image: string | null
}

type ApiResponse = { data: NailArtListItem[] }

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const sortParam = request.nextUrl.searchParams.get("sort")
  const sort: NailArtSort =
    sortParam === "likes" || sortParam === "recent" || sortParam === "featured"
      ? sortParam
      : "likes"

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "8")
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 24) : 8

  const posts = await getNailArtPosts(limit, sort)
  const data: NailArtListItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    cover_image: nailArtImageApiPath(post.id),
  }))
  return NextResponse.json({ data })
}
