import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getProfessionals } from "@/lib/supabase/appointments"
import {
  getServicesCached,
  getServicesWithOptionsCached as getServices,
} from "@/lib/supabase/cache"
import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"
import { getStudioWeeklyHoursCached } from "@/lib/supabase/studio-hours"

import ServiciosClient from "../ServiciosClient"

export const dynamic = "force-dynamic"

export default async function ServiciosAgendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [servicesWithOptionsRes, profsRes, filtersRes, studioWeeklyHours] =
    await Promise.all([
      getServices(),
      getProfessionals(),
      getPublicServiceFilters(),
      getStudioWeeklyHoursCached(),
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
      <main className="min-h-screen bg-ivory site-container py-16 text-[#0a0a0a]">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-semibold">
            No pudimos cargar la información
          </h1>
          <p className="mt-3 text-sm text-[#737373]">
            Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  return (
    <Suspense fallback={null}>
      <ServiciosClient
        services={servicesRes.data}
        filters={filtersRes.data ?? []}
        professionals={profsRes.data}
        studioWeeklyHours={studioWeeklyHours}
        isAuthenticated={Boolean(user)}
      />
    </Suspense>
  )
}
