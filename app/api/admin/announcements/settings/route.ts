import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  getAnnouncementBarEnabled,
  setAnnouncementBarEnabled,
} from "@/lib/supabase/announcement-bar-settings"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
  if (code === "VALIDATION_ERROR") return 400
  return 500
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authResult = await requireAdmin(user?.id)
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  const result = await getAnnouncementBarEnabled()
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { barEnabled: result.data }, error: null })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authResult = await requireAdmin(user?.id)
  if (authResult.error) {
    return NextResponse.json(
      { data: null, error: authResult.error },
      { status: mapStatus(authResult.error.code) }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Cuerpo inválido", code: "VALIDATION_ERROR" } },
      { status: 400 }
    )
  }

  const body = json as { barEnabled?: unknown }
  if (typeof body.barEnabled !== "boolean") {
    return NextResponse.json(
      {
        data: null,
        error: { message: "barEnabled debe ser booleano", code: "VALIDATION_ERROR" },
      },
      { status: 400 }
    )
  }

  const result = await setAnnouncementBarEnabled(body.barEnabled)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }

  revalidateTag("announcement-bar-settings", "max")

  return NextResponse.json({ data: { barEnabled: result.data }, error: null })
}
