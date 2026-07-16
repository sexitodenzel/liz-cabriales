import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  getUserActiveAppointment,
  cancelExpiredPendingAppointments,
  completePastAppointments,
  getProfessionals,
} from "@/lib/supabase/appointments"
import {
  getServicesCached,
  getServicesWithOptionsCached as getServices,
} from "@/lib/supabase/cache"
import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"
import { getStudioWeeklyHoursCached } from "@/lib/supabase/studio-hours"
import { getStudioSettingsCached } from "@/lib/supabase/studio-settings"

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

  let activeAppointment = null
  if (user) {
    await cancelExpiredPendingAppointments({ userId: user.id })
    await completePastAppointments({ userId: user.id })

    const active = await getUserActiveAppointment(user.id)
    if (active.data) activeAppointment = active.data
  }

  const studioSettings = await getStudioSettingsCached()

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
    <Suspense fallback={null}>
      <ServiciosClient
        services={servicesRes.data}
        filters={filtersRes.data ?? []}
        professionals={profsRes.data}
        studioWeeklyHours={studioWeeklyHours}
        isAuthenticated={Boolean(user)}
        activeAppointment={activeAppointment}
        transferAccountNumber={studioSettings.transfer_account_number}
      />
    </Suspense>
  )
}
