import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getProfessionals,
  getServices,
  getUserActiveAppointment,
} from "@/lib/supabase/appointments"

import CitasClient from "./CitasClient"

export default async function CitasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no está autenticado, al intentar reservar se redirige; pero aquí permitimos
  // que vea servicios/profesionales. Los componentes de cliente manejan el login
  // antes del POST.
  const [servicesRes, profsRes] = await Promise.all([
    getServices(),
    getProfessionals(),
  ])

  let activeAppointmentId: string | null = null
  if (user) {
    const active = await getUserActiveAppointment(user.id)
    if (active.data) activeAppointmentId = active.data.id
  }

  if (!servicesRes.data || !profsRes.data) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-16 text-[#0a0a0a]">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold">
            No pudimos cargar la información
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  return (
    <CitasClient
      services={servicesRes.data}
      professionals={profsRes.data}
      isAuthenticated={Boolean(user)}
      activeAppointmentId={activeAppointmentId}
    />
  )
}

export const dynamic = "force-dynamic"
