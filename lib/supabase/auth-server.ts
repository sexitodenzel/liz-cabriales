import { cache } from "react"

import { createClient } from "./server"

export type AuthUserProfile = {
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  address: string | null
  state: string | null
  city: string | null
  colonia: string | null
  cp: string | null
  municipio: string | null
  entre_calles: string | null
  referencia: string | null
}

/** Una sola llamada a getUser() por request (layout + páginas). */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** Perfil de usuario cacheado por request. */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("users")
    .select(
      "first_name, last_name, email, role, address, state, city, colonia, cp, municipio, entre_calles, referencia"
    )
    .eq("id", userId)
    .single()

  return profile as AuthUserProfile | null
})
