import { NextResponse } from "next/server"

import { getTopSearchesCached } from "@/lib/supabase/cache"
import { resolveTopSearchHref } from "@/lib/supabase/top-searches"

export const dynamic = "force-dynamic"

type PublicTopSearchItem = {
  id: string
  label: string
  href: string
}

type ApiResponse =
  | { data: PublicTopSearchItem[]; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const result = await getTopSearchesCached()

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: { message: result.error.message, code: result.error.code },
      },
      { status: 500 }
    )
  }

  const items: PublicTopSearchItem[] = result.data.map((item) => ({
    id: item.id,
    label: item.label,
    href: resolveTopSearchHref(item),
  }))

  return NextResponse.json(
    { data: items, error: null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
