import { redirect } from "next/navigation"

import AdminDashboardClient from "./AdminDashboardClient"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"
import { getLowStockVariants } from "@/lib/supabase/adminProducts"

export default async function AdminPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(user.id)
  if (profile?.role !== "admin") redirect("/login")

  const userName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Administrador"

  const lowStockVariants = await getLowStockVariants().catch(() => [])

  return (
    <AdminDashboardClient
      userName={userName}
      lowStockCount={lowStockVariants.length}
    />
  )
}
