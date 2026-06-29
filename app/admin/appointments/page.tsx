import { getAdminProfessionals } from "@/lib/supabase/appointments"
import { getServicesCached as getServices } from "@/lib/supabase/cache"

import AdminAppointmentsClient from "./AdminAppointmentsClient"

export default async function AdminAppointmentsPage() {
  const [profsRes, servicesRes] = await Promise.all([
    getAdminProfessionals(),
    getServices(),
  ])

  return (
    <AdminAppointmentsClient
      professionals={profsRes.data ?? []}
      services={servicesRes.data ?? []}
    />
  )
}
