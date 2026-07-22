import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getLoginEventsLastMonths } from "@/lib/supabase/login-events"

function mapStatus(code?: string): number {
  if (code === "UNAUTHENTICATED") return 401
  if (code === "FORBIDDEN") return 403
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

  const result = await getLoginEventsLastMonths(500)
  if (result.error) {
    return NextResponse.json(
      { data: null, error: { message: result.error } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: result.data, error: null })
}
