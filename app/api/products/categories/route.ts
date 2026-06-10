import { NextResponse } from "next/server"

import { getCategories } from "@/lib/supabase/products"

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<
  NextResponse<ApiResponse<Array<{ id: string; name: string; slug: string }>>>
> {
  const result = await getCategories()

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
    data: result.data.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    error: null,
  })
}
