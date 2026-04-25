import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getUserRegistrations } from "@/lib/supabase/courses"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { message: "No autorizado", code: "UNAUTHENTICATED" },
      },
      { status: 401 }
    )
  }

  const result = await getUserRegistrations(user.id)
  if (!result.data) {
    return NextResponse.json(
      { data: null, error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { registrations: result.data },
    error: null,
  })
}
