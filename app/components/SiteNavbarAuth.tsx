import { getAuthUser } from "@/lib/supabase/auth-server"

import SiteNavbar from "./SiteNavbar"

export default async function SiteNavbarAuth() {
  try {
    const user = await getAuthUser()
    return <SiteNavbar isLoggedIn={Boolean(user)} />
  } catch {
    // Si auth/Supabase falla o el stream SSR se corta, no tumbar el
    // Suspense del layout: navbar como invitado y el cliente rehidrata.
    return <SiteNavbar isLoggedIn={false} />
  }
}
