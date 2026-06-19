import { getAuthUser } from "@/lib/supabase/auth-server"

import SiteNavbar from "./SiteNavbar"

export default async function SiteNavbarAuth() {
  const user = await getAuthUser()
  return <SiteNavbar isLoggedIn={Boolean(user)} />
}
