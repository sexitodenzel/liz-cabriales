import { createBrowserClient } from "@supabase/ssr"
import { processLock, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Usa el lock en memoria en vez del Web Locks API del navegador: evita el
      // "Lock broken by another request with the 'steal' option" que dispara
      // StrictMode/HMR en dev al solaparse llamadas de auth.
      auth: { lock: processLock },
    }
  )
  return browserClient
}
