import Link from "next/link"

import AccountShell from "../AccountShell"
import PerfilCitasClient from "../PerfilCitasClient"
import { listAppointmentsForUser } from "@/lib/supabase/appointments"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export const dynamic = "force-dynamic"

export default async function PerfilServiciosPage() {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"
  const apptsRes = await listAppointmentsForUser(user.id)
  const appointments = apptsRes.data ?? []

  return (
    <AccountShell active="servicios" title="Servicios" breadcrumbLabel="Servicios" isAdmin={isAdmin}>
      {appointments.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No tienes citas activas. Agenda en{" "}
          <Link href="/citas" className="font-medium text-[var(--gold)] underline">
            servicios
          </Link>
          .
        </p>
      ) : (
        <PerfilCitasClient initialAppointments={appointments} />
      )}
    </AccountShell>
  )
}
