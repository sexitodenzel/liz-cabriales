import { NextResponse } from "next/server"

import { getAllBrandsFullCached } from "@/lib/supabase/cache"

export const revalidate = 300

export async function GET() {
  const result = await getAllBrandsFullCached()
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }

  const data = result.data.map((brand) => ({
    name: brand.name,
    slug: brand.slug,
    logo_url: brand.logo_url ?? null,
  }))

  return NextResponse.json({ data, error: null })
}
