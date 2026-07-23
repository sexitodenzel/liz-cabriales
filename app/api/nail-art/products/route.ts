import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { searchProductsForNailArt } from "@/lib/supabase/nail-art"

/** Búsqueda de productos para el formulario UGC (requiere sesión). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autenticado", code: "UNAUTHENTICATED" } },
        { status: 401 }
      )
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
    if (q.length < 2) {
      return NextResponse.json({ data: [], error: null })
    }

    const products = await searchProductsForNailArt(q, 15)
    return NextResponse.json({ data: products, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno" } },
      { status: 500 }
    )
  }
}
