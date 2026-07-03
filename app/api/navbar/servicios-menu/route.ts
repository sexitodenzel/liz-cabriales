import { NextResponse } from "next/server"

import { serviciosMenuToCategories, buildServiciosMenuGroups } from "@/lib/navbar/servicios-menu"
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
  | { data: ServiciosMenuItem[]; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const [filtersRes, servicesRes] = await Promise.all([
    getPublicServiceFilters(),
    getServicesCached(),
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
    { data: categories, error: null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
