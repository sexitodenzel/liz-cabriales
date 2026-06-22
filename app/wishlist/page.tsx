import { redirect } from "next/navigation"

import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

import WishlistClient from "./WishlistClient"

export default async function WishlistPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === "admin" || profile?.role === "receptionist"

  return <WishlistClient isAdmin={isAdmin} />
}
