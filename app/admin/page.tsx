import { redirect } from "next/navigation"

import AdminDashboardClient from "./AdminDashboardClient"
import { createClient } from "@/lib/supabase/server"
import { getLowStockVariants } from "@/lib/supabase/adminProducts"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/login")
  }

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
