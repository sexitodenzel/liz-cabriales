import { createClient } from "@supabase/supabase-js"

type SupabaseError = { message: string; code?: string }
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export const ANNOUNCEMENT_BAR_SETTING_KEY = "announcement_bar_enabled"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseEnabledValue(value: unknown): boolean {
  return value === true || value === "true"
}

export async function getAnnouncementBarEnabled(): Promise<Result<boolean>> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", ANNOUNCEMENT_BAR_SETTING_KEY)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01") {
      return { data: false, error: null }
    }
    return { data: null, error: { message: error.message, code: error.code } }
  }

  if (!data?.value) {
    return { data: false, error: null }
  }

  return { data: parseEnabledValue(data.value), error: null }
}

export async function setAnnouncementBarEnabled(
  enabled: boolean
): Promise<Result<boolean>> {
  const { error } = await supabaseAdmin.from("app_settings").upsert(
    { key: ANNOUNCEMENT_BAR_SETTING_KEY, value: enabled ? "true" : "false" },
    { onConflict: "key" }
  )

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return { data: enabled, error: null }
}
