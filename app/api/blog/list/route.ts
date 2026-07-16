import { NextResponse } from "next/server"

import { getBlogPosts } from "@/lib/supabase/blog"

export const revalidate = 60

type BlogListItem = {
  id: string
  title: string
  slug: string
  category: string
  cover_image: string | null
}

type ApiResponse = { data: BlogListItem[] }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const posts = await getBlogPosts({ limit: 8 })
  const data: BlogListItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    cover_image: post.cover_image,
  }))
  return NextResponse.json({ data })
}
