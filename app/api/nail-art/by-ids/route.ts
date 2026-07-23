import { NextRequest, NextResponse } from "next/server"

import { getNailArtPostsByIds, toPublicNailArtPosts } from "@/lib/supabase/nail-art"

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? ""
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 48)

  if (ids.length === 0) {
    return NextResponse.json({ data: [], error: null })
  }

  const posts = await getNailArtPostsByIds(ids)
  return NextResponse.json({ data: toPublicNailArtPosts(posts), error: null })
}
