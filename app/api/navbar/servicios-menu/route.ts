import { NextResponse } from "next/server"

import { SERVICIOS_GALLERY_SLOT_KEYS } from "@/lib/media-slots"
import {
  serviciosMenuToCategories,
  serviciosMenuToTiles,
  buildServiciosMenuGroups,
} from "@/lib/navbar/servicios-menu"
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

type ServiciosMenuTile = {
  label: string
  image: string | null
  href: string
}

type ApiResponse =
  | {
      data: {
        categories: ServiciosMenuItem[]
        services: ServiciosMenuTile[]
        gallery: string[]
      }
      error: null
    }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const [filtersRes, servicesRes, portadas] = await Promise.all([
    getPublicServiceFilters(),
    getServicesCached(),
    // Fotos del megamenú de Servicios = SOLO la "Galería del estudio en
    // /servicios" que cura Mildred en /admin/media (slots servicios_gallery_*).
    // Sin fallbacks: los slots vacíos quedan como "" y se filtran, así nunca
    // aparecen placeholders ni fotos de Nail Art.
    getOrderedSlotUrls([...SERVICIOS_GALLERY_SLOT_KEYS]),
  ])

  const gallery = Array.from(
    new Set(portadas.filter((url) => url.trim().length > 0))
  )

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
  const services = serviciosMenuToTiles(groups)

  return NextResponse.json(
    {
      data: {
        categories,
        services,
        gallery,
      },
      error: null,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
