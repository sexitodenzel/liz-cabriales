import { NextResponse } from "next/server"

import { getNewestProductsCached } from "@/lib/supabase/cache"

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<
  NextResponse<ApiResponse<Array<{ id: string; name: string; slug: string }>>>
> {
  const result = await getNewestProductsCached()

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: result.error.message,
          code: result.error.code,
        },
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: result.data.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
    })),
    error: null,
  })
}
