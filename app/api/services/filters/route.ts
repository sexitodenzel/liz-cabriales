import { NextResponse } from "next/server"

import { getPublicServiceFilters } from "@/lib/supabase/servicesAdmin"

export async function GET() {
  try {
    const result = await getPublicServiceFilters()
    if (!result.data) {
      return NextResponse.json(
        { data: null, error: { message: result.error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { filters: result.data },
      error: null,
    })
  } catch (err) {
    console.error("[api/services/filters GET]", err)
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
