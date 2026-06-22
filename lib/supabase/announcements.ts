import { createClient } from "@supabase/supabase-js"

type SupabaseError = { message: string; code?: string }
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type AnnouncementRow = {
  id: string
  label: string
  href: string | null
  position: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mapRow(row: unknown): AnnouncementRow {
  const r = row as AnnouncementRow
  return {
    id: r.id,
    label: r.label,
    href: r.href ?? null,
    position: Number(r.position ?? 0),
    is_enabled: Boolean(r.is_enabled),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export async function getAllAnnouncements(): Promise<Result<AnnouncementRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("id, label, href, position, is_enabled, created_at, updated_at")
    .order("position", { ascending: true })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: (data ?? []).map(mapRow), error: null }
}

export async function createAnnouncement(input: {
  label: string
  href?: string | null
  position?: number
  isEnabled?: boolean
}): Promise<Result<AnnouncementRow>> {
  const label = input.label.trim()
  if (!label) {
    return {
      data: null,
      error: { message: "El texto es obligatorio", code: "VALIDATION_ERROR" },
    }
  }

  const href = input.href?.trim() || null

  const { data: maxRow } = await supabaseAdmin
    .from("announcements")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition =
    typeof input.position === "number"
      ? input.position
      : ((maxRow?.position as number | undefined) ?? -1) + 1

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .insert({
      label,
      href,
      position: nextPosition,
      is_enabled: input.isEnabled ?? true,
    })
    .select("id, label, href, position, is_enabled, created_at, updated_at")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo crear el slide",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data), error: null }
}

export async function updateAnnouncement(
  id: string,
  input: { label?: string; href?: string | null; position?: number; isEnabled?: boolean }
): Promise<Result<AnnouncementRow>> {
  const payload: Record<string, unknown> = {}
  if (input.label !== undefined) {
    const trimmed = input.label.trim()
    if (!trimmed) {
      return {
        data: null,
        error: { message: "El texto no puede quedar vacío", code: "VALIDATION_ERROR" },
      }
    }
    payload.label = trimmed
  }
  if (input.href !== undefined) {
    const trimmed = input.href?.trim()
    payload.href = trimmed && trimmed.length > 0 ? trimmed : null
  }
  if (input.position !== undefined) payload.position = input.position
  if (input.isEnabled !== undefined) payload.is_enabled = input.isEnabled
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .update(payload)
    .eq("id", id)
    .select("id, label, href, position, is_enabled, created_at, updated_at")
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el slide",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data), error: null }
}

export async function deleteAnnouncement(id: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id)
  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}
