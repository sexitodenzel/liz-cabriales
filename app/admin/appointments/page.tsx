import { getAdminProfessionals } from "@/lib/supabase/appointments"
import {
  getAdminServices,
  getPublicServicesWithOptions,
  getServiceFilters,
} from "@/lib/supabase/servicesAdmin"

import AdminAppointmentsClient from "./AdminAppointmentsClient"

export default async function AdminAppointmentsPage() {
  const [profsRes, servicesRes, bookingServicesRes, filtersRes] =
    await Promise.all([
      getAdminProfessionals(),
      getAdminServices(),
      getPublicServicesWithOptions(),
      getServiceFilters(false),
    ])

  return (
    <AdminAppointmentsClient
      professionals={profsRes.data ?? []}
      services={servicesRes.data ?? []}
      bookingServices={bookingServicesRes.data ?? []}
      filters={filtersRes.data ?? []}
    />
  )
}
