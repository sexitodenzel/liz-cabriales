import { createClient as createServiceClient } from "@supabase/supabase-js"

/** 30 minutos de inactividad para staff en /admin. */
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor."
    )
  }
  return createServiceClient(url, key)
}

/**
 * Lee last_activity_at del usuario (service role; no depende de grants RLS de UPDATE).
 */
export async function getUserLastActivityAt(
  userId: string
): Promise<Date | null> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("users")
      .select("last_activity_at")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data?.last_activity_at) return null
    const parsed = new Date(data.last_activity_at as string)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

/** Marca actividad actual. No debe tumbar el request si falla. */
export async function touchUserLastActivity(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    await supabase
      .from("users")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", userId)
  } catch (err) {
    console.error("[admin-session] touch last_activity_at failed:", err)
  }
}

export function isAdminIdleExpired(lastActivityAt: Date | null, now = Date.now()): boolean {
  // Sin marca previa: no expulsar; se tocará al dejar pasar.
  if (!lastActivityAt) return false
  return now - lastActivityAt.getTime() > ADMIN_IDLE_TIMEOUT_MS
}
