import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type StudioSettings = {
  transfer_account_number: string
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("studio_settings") === true
  )
}

async function loadStudioSettings(): Promise<StudioSettings> {
  const { data, error } = await supabaseAdmin
    .from("studio_settings")
    .select("transfer_account_number")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return { transfer_account_number: "" }
    }
    throw new Error(error.message)
  }

  return {
    transfer_account_number: String(data?.transfer_account_number ?? "").trim(),
  }
}

export const getStudioSettingsCached = unstable_cache(
  loadStudioSettings,
  ["studio-settings"],
  { revalidate: 60, tags: ["studio-settings"] }
)

export async function getStudioSettings(): Promise<Result<StudioSettings>> {
  try {
    const data = await loadStudioSettings()
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : "No se pudo cargar la configuración del estudio",
      },
    }
  }
}

export async function saveStudioSettings(
  input: StudioSettings
): Promise<Result<StudioSettings>> {
  const transfer_account_number = input.transfer_account_number.trim()

  const { data, error } = await supabaseAdmin
    .from("studio_settings")
    .upsert(
      {
        id: 1,
        transfer_account_number,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("transfer_account_number")
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return {
        data: null,
        error: {
          message:
            "La tabla studio_settings no existe. Ejecuta la migración en Supabase.",
          code: "MISSING_TABLE",
        },
      }
    }
    return { data: null, error: { message: error.message, code: error.code } }
  }

  return {
    data: {
      transfer_account_number: String(data?.transfer_account_number ?? "").trim(),
    },
    error: null,
  }
}
