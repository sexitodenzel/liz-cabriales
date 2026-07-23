import { NextResponse } from "next/server"

import {
  SERVICIOS_GALLERY_FALLBACKS,
  SERVICIOS_GALLERY_SLOT_KEYS,
} from "@/lib/media-slots"
import { serviciosMenuToCategories, buildServiciosMenuGroups } from "@/lib/navbar/servicios-menu"
import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import { getServicesCached } from "@/lib/supabase/cache"
import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"

export const dynamic = "force-dynamic"

type ServiciosMenuItem = {
  label: string
  slug: string
  href: string
  subcategories: Array<{ label: string; href: string }>
}

type ApiResponse =
  | {
      data: { categories: ServiciosMenuItem[]; gallery: string[] }
      error: null
    }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const [filtersRes, servicesRes, gallery] = await Promise.all([
    getPublicServiceFilters(),
    getServicesCached(),
    getOrderedSlotUrls(
      [...SERVICIOS_GALLERY_SLOT_KEYS],
      SERVICIOS_GALLERY_FALLBACKS
    ),
  ])

  if (!servicesRes.data) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: servicesRes.error?.message ?? "No se pudieron cargar los servicios",
          code: servicesRes.error?.code,
        },
      },
      { status: 500 }
    )
  }

  const groups = buildServiciosMenuGroups(filtersRes.data ?? [], servicesRes.data)
  const categories = serviciosMenuToCategories(groups)

  return NextResponse.json(
    {
      data: {
        categories,
        gallery: gallery.filter((url) => url.trim().length > 0),
      },
      error: null,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
