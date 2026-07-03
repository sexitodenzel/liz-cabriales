import { createClient } from "@/lib/supabase/server"
import { getUserActiveAppointment, cancelExpiredPendingAppointments } from "@/lib/supabase/appointments"
import {
  getProfessionalsCached as getProfessionals,
  getServicesCached,
  getServicesWithOptionsCached as getServices,
} from "@/lib/supabase/cache"
import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"

import ServiciosClient from "./ServiciosClient"

export const dynamic = "force-dynamic"

export default async function ServiciosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [servicesWithOptionsRes, profsRes, filtersRes] = await Promise.all([
    getServices(),
    getProfessionals(),
    getPublicServiceFilters(),
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

  let activeAppointmentId: string | null = null
  if (user) {
    await cancelExpiredPendingAppointments({ userId: user.id })

    const active = await getUserActiveAppointment(user.id)
    if (active.data) activeAppointmentId = active.data.id
  }

  if (!servicesRes.data || !profsRes.data) {
    return (
      <main className="min-h-screen bg-[#f5f5f3] site-container py-16 text-[#0a0a0a]">
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
    <ServiciosClient
      services={servicesRes.data}
      filters={filtersRes.data ?? []}
      professionals={profsRes.data}
      isAuthenticated={Boolean(user)}
      activeAppointmentId={activeAppointmentId}
    />
  )
}
