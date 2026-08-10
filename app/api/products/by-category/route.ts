import { NextResponse } from "next/server"

import {
  getCategoryShowcaseCached,
  type CategoryShowcaseProduct,
} from "@/lib/supabase/cache"

export const dynamic = "force-dynamic"

type ApiResponse =
  | { data: CategoryShowcaseProduct[]; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url)
  // Acepta una o varias categorías separadas por coma (grupos del menú,
  // p. ej. Nail art = nail-art,decoracion,glitter…).
  const categorySlugs = (searchParams.get("categoria") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (categorySlugs.length === 0) {
    return NextResponse.json({ data: [], error: null })
  }

  // Orden estable: el megamenú manda los slugs siempre igual, pero normalizar
  // aquí evita duplicar entradas de caché si alguna vez cambia el orden.
  const result = await getCategoryShowcaseCached([...categorySlugs].sort())

  if (!result.data) {
    return NextResponse.json(
      {
        data: null,
        error: { message: result.error.message, code: result.error.code },
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: result.data, error: null },
    {
      headers: {
        // Catálogo público sin datos por usuario: se puede servir desde el CDN.
        // Antes iba con `no-store`, así que las 19 llamadas del menú pegaban a
        // Supabase en cada visita.
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  )
}
