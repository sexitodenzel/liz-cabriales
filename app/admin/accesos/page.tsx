import { redirect } from "next/navigation"

import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"
import AccesosClient from "./AccesosClient"

export default async function AccesosPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(user.id)
  if (profile?.role !== "admin") redirect("/login")

  return <AccesosClient />
}
