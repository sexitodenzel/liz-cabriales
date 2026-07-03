import { NextResponse } from "next/server"

import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"
import { resolveSobreLizBrandPhoto } from "@/lib/sobre-liz/brand-photo"

export const revalidate = 60

export async function GET() {
  const { slots } = await getLandingPageDataCached()
  return NextResponse.json({
    url: resolveSobreLizBrandPhoto(slots.brand_photo),
  })
}
