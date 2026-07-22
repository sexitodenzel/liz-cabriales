import { redirect } from "next/navigation"

import AdminDashboardClient from "./AdminDashboardClient"
import { getAdminDashboardStats } from "@/lib/supabase/adminDashboard"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"
import { getLowStockVariants } from "@/lib/supabase/adminProducts"

export default async function AdminPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(user.id)
  if (profile?.role !== "admin") redirect("/login")

  const userName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email?.split("@")[0] ||
    "Usuario"

  const [lowStockVariants, dashboardStats] = await Promise.all([
    getLowStockVariants().catch(() => []),
    getAdminDashboardStats().catch(() => ({
      ordersThisMonth: 0,
      activeClients: 0,
    })),
  ])

  return (
    <AdminDashboardClient
      userName={userName}
      lowStockCount={lowStockVariants.length}
      ordersThisMonth={dashboardStats.ordersThisMonth}
      activeClients={dashboardStats.activeClients}
    />
  )
}
