import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  getProfessionalsCached as getProfessionals,
  getServicesCached as getServices,
} from "@/lib/supabase/cache"

import AdminAppointmentsClient from "./AdminAppointmentsClient"

export const dynamic = "force-dynamic"

export default async function AdminAppointmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "receptionist") {
    redirect("/")
  }

  const [profsRes, servicesRes] = await Promise.all([
    getProfessionals(),
    getServices(),
  ])

  return (
    <AdminAppointmentsClient
      professionals={profsRes.data ?? []}
      services={servicesRes.data ?? []}
    />
  )
}
