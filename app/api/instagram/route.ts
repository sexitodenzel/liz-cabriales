import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const revalidate = 3600

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

export type InstagramPost = {
  id: string
  caption: string | null
  media_type: "IMAGE" | "VIDEO"
  media_url: string
  thumbnail_url: string | null
  permalink: string
  timestamp: string
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getInstagramToken(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "instagram_access_token")
    .maybeSingle()

  if (!error && data?.value) return data.value as string
  return process.env.INSTAGRAM_ACCESS_TOKEN ?? null
}

export async function GET(): Promise<NextResponse<ApiResponse<InstagramPost[]>>> {
  try {
    const token = await getInstagramToken()

    if (!token) {
      return NextResponse.json({ data: [], error: null })
    }

    const url = new URL("https://graph.instagram.com/me/media")
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
    )
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

    if (!res.ok) {
      console.error("[api/instagram] Error de Graph API:", res.status)
      return NextResponse.json({ data: [], error: null })
    }

    const json = (await res.json()) as {
      data?: Array<{
        id: string
        caption?: string
        media_type: string
        media_url?: string
        thumbnail_url?: string
        permalink: string
        timestamp: string
      }>
    }

    const posts: InstagramPost[] = (json.data ?? [])
      .filter((p) => p.media_type === "IMAGE" || p.media_type === "VIDEO")
      .map((p) => ({
        id: p.id,
        caption: p.caption ?? null,
        media_type: p.media_type as "IMAGE" | "VIDEO",
        media_url: p.media_url ?? "",
        thumbnail_url: p.thumbnail_url ?? null,
        permalink: p.permalink,
        timestamp: p.timestamp,
      }))

    return NextResponse.json({ data: posts, error: null })
  } catch (err) {
    console.error("[api/instagram] Error inesperado:", err)
    return NextResponse.json({ data: [], error: null })
  }
}
