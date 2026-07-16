import { redirect } from "next/navigation"
import { getProfessionals } from "@/lib/supabase/appointments"
import {
  getServicesCached,
  getServicesWithOptionsCached as getServices,
} from "@/lib/supabase/cache"
import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"
import { getStudioWeeklyHoursCached } from "@/lib/supabase/studio-hours"
import { getNailArtPosts } from "@/lib/supabase/nail-art"

import ServiciosLanding from "./ServiciosLanding"

export const revalidate = 60

type Props = {
  searchParams: Promise<{ categoria?: string; servicio?: string }>
}

export default async function ServiciosPage({ searchParams }: Props) {
  const { categoria, servicio } = await searchParams
  if (categoria || servicio) {
    const q = new URLSearchParams()
    if (categoria) q.set("categoria", categoria)
    if (servicio) q.set("servicio", servicio)
    redirect(`/servicios/agendar?${q.toString()}`)
  }

  const [servicesWithOptionsRes, profsRes, filtersRes, studioWeeklyHours, nailArtPosts] =
    await Promise.all([
      getServices(),
      getProfessionals(),
      getPublicServiceFilters(),
      getStudioWeeklyHoursCached(),
      getNailArtPosts(6).catch(() => []),
    ])

  let servicesRes = servicesWithOptionsRes
  if (!servicesRes.data) {
    const fallback = await getServicesCached()
    if (fallback.data) {
      servicesRes = {
        data: fallback.data.map((service) => ({ ...service, options: [] })),
        error: null,
      }
    }
  }

  if (!servicesRes.data || !profsRes.data) {
    return (
      <main className="min-h-screen bg-ivory px-8 py-16 text-[#1a1a1a]">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-semibold">No pudimos cargar la información</h1>
          <p className="mt-3 text-sm text-[#737373]">Intenta de nuevo más tarde.</p>
        </div>
      </main>
    )
  }

  const portfolioItems = nailArtPosts
    .filter((p) => p.cover_image)
    .map((p) => ({
      id: p.id,
      title: p.title,
      image: p.cover_image as string,
      href: `/nail-art/${p.slug}`,
    }))

  return (
    <ServiciosLanding
      services={servicesRes.data}
      filters={filtersRes.data ?? []}
      professionals={profsRes.data}
      studioWeeklyHours={studioWeeklyHours}
      portfolioItems={portfolioItems}
    />
  )
}
