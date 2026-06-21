import { NextResponse } from "next/server"

import { getNailArtPosts } from "@/lib/supabase/nail-art"

export const revalidate = 60

type NailArtListItem = {
  id: string
  title: string
  slug: string
  cover_image: string | null
}

type ApiResponse = { data: NailArtListItem[] }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const posts = await getNailArtPosts(8)
  const data: NailArtListItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    cover_image: post.cover_image,
  }))
  return NextResponse.json({ data })
}
