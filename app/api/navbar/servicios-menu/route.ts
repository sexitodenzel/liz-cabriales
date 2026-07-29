import { NextResponse } from "next/server"

import {
  SERVICIOS_GALLERY_FALLBACKS,
  SERVICIOS_GALLERY_SLOT_KEYS,
} from "@/lib/media-slots"
import { serviciosMenuToCategories, buildServiciosMenuGroups } from "@/lib/navbar/servicios-menu"
import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import { getServicesCached } from "@/lib/supabase/cache"
import { getNailArtPosts } from "@/lib/supabase/nail-art"
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
  const [filtersRes, servicesRes, portadas, nailArt] = await Promise.all([
    getPublicServiceFilters(),
    getServicesCached(),
    // "Portadas" curadas de la sección Servicios (las que sube Mildred).
    getOrderedSlotUrls(
      [...SERVICIOS_GALLERY_SLOT_KEYS],
      SERVICIOS_GALLERY_FALLBACKS
    ),
    // Portadas de las publicaciones de Nail Art (editorial, activas).
    getNailArtPosts(24, "featured").catch(() => []),
  ])

  // Pool de fotos reales para los tiles del megamenú: primero las portadas de
  // Nail Art, luego las portadas curadas de Servicios. Deduplicado y sin vacíos.
  const nailArtCovers = nailArt
    .map((post) => post.cover_image)
    .filter((url): url is string => Boolean(url && url.trim()))

  const gallery = Array.from(
    new Set(
      [...nailArtCovers, ...portadas].filter((url) => url.trim().length > 0)
    )
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

  return NextResponse.json(
    {
      data: {
        categories,
        gallery,
      },
      error: null,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
