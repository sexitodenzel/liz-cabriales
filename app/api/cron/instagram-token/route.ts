import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type ApiError = { message: string; code?: string }
type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: { message, code } }, { status })
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ refreshed: boolean }>>> {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error("[cron/instagram-token] CRON_SECRET no configurado")
      return errorResponse(
        "Configuración incompleta del servidor",
        500,
        "CRON_SECRET_MISSING"
      )
    }

    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse("No autorizado", 401, "UNAUTHORIZED")
    }

    const { data: settingRow, error: fetchError } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "instagram_access_token")
      .maybeSingle()

    const currentToken =
      !fetchError && settingRow?.value
        ? (settingRow.value as string)
        : process.env.INSTAGRAM_ACCESS_TOKEN

    if (!currentToken) {
      return errorResponse(
        "Token de Instagram no configurado",
        400,
        "TOKEN_MISSING"
      )
    }

    const refreshUrl = new URL("https://graph.instagram.com/refresh_access_token")
    refreshUrl.searchParams.set("grant_type", "ig_refresh_token")
    refreshUrl.searchParams.set("access_token", currentToken)

    const res = await fetch(refreshUrl.toString())

    if (!res.ok) {
      console.error("[cron/instagram-token] Error al renovar token:", res.status)
      return errorResponse(
        "Error al renovar el token de Instagram",
        502,
        "REFRESH_FAILED"
      )
    }

    const json = (await res.json()) as { access_token?: string }
    const newToken = json.access_token

    if (!newToken) {
      return errorResponse("El token renovado está vacío", 502, "EMPTY_TOKEN")
    }

    const { error: upsertError } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "instagram_access_token", value: newToken }, { onConflict: "key" })

    if (upsertError) {
      console.error("[cron/instagram-token] Error guardando token:", upsertError)
      return errorResponse(upsertError.message, 500, upsertError.code)
    }

    return NextResponse.json({ data: { refreshed: true }, error: null })
  } catch (err) {
    console.error("[cron/instagram-token] Error inesperado:", err)
    return errorResponse("Error interno del servidor", 500)
  }
}
