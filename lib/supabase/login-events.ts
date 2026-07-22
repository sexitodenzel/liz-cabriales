import { createClient as createServiceClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

import { getClientIp } from "@/lib/rate-limit"
import type {
  LoginEvent,
  RecordLoginEventInput,
} from "@/lib/supabase/login-events-shared"

export type {
  LoginEvent,
  LoginMethod,
  RecordLoginEventInput,
} from "@/lib/supabase/login-events-shared"
export { formatLoginMethod } from "@/lib/supabase/login-events-shared"

const RETENTION_DAYS = 90

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
 * Registra un inicio de sesión exitoso y purga registros > 90 días.
 * No debe bloquear el login si falla la auditoría.
 */
export async function recordLoginEvent(
  input: RecordLoginEventInput
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

    await supabaseAdmin
      .from("login_events")
      .delete()
      .lt("created_at", cutoff.toISOString())

    const { error } = await supabaseAdmin.from("login_events").insert({
      user_id: input.userId,
      email: input.email?.trim() || null,
      full_name: input.fullName?.trim() || null,
      role: input.role ?? null,
      method: input.method,
      ip: input.ip?.trim() || null,
      user_agent: input.userAgent?.slice(0, 500) || null,
    })

    if (error) {
      console.error("[login_events] insert failed:", error.message)
    }
  } catch (err) {
    console.error("[login_events] unexpected error:", err)
  }
}

/** Extrae IP + User-Agent de un Request para auditoría. */
export function loginEventRequestMeta(request: NextRequest): {
  ip: string
  userAgent: string | null
} {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  }
}

/** Lista eventos de los últimos 90 días (más recientes primero). */
export async function getLoginEventsLastMonths(
  limit = 500
): Promise<{ data: LoginEvent[]; error: string | null }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

    const { data, error } = await supabaseAdmin
      .from("login_events")
      .select(
        "id, user_id, email, full_name, role, method, ip, user_agent, created_at"
      )
      .eq("role", "admin")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: (data ?? []) as LoginEvent[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar accesos"
    return { data: [], error: message }
  }
}
