import { redirect } from "next/navigation"

import { getAuthUser } from "@/lib/supabase/auth-server"

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect("/login")
  return children
}
