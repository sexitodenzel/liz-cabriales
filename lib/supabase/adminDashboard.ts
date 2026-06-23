import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AdminDashboardStats = {
  ordersThisMonth: number
  activeClients: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [ordersRes, clientsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .neq("status", "cancelled"),
    supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client"),
  ])

  return {
    ordersThisMonth: ordersRes.count ?? 0,
    activeClients: clientsRes.count ?? 0,
  }
}
