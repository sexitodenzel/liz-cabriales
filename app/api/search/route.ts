import { NextResponse, type NextRequest } from "next/server"

import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { getSearchIndex } from "@/lib/search/catalog"
import {
  groupHits,
  searchDocs,
  type SearchDoc,
  type SearchDocType,
} from "@/lib/search/engine"
import type { SearchItem, SearchPayload } from "@/lib/search/types"

/**
 * Autocompletado unificado: productos, cursos, servicios, categorías, marcas y
 * secciones en una sola respuesta.
 *
 * El ranking corre sobre un índice cacheado en memoria (ver lib/search/catalog),
 * así que la respuesta no depende de una consulta a la base por cada tecla.
 */

// Búsqueda pública de alto volumen: límite generoso por IP para frenar bots
// que enumeren el catálogo sin afectar a usuarias reales.
const RATE_LIMIT_PER_MINUTE = 240

const MIN_QUERY_LENGTH = 2

const SUGGEST_LIMITS: Partial<Record<SearchDocType, number>> = {
  product: 8,
  course: 3,
  service: 4,
  category: 5,
  brand: 4,
  page: 2,
}

type ApiResponse =
  | { data: SearchPayload; error: null }
  | { data: null; error: { message: string; code?: string } }

function toItem(doc: SearchDoc): SearchItem {
  return {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    subtitle: doc.subtitle,
    href: doc.href,
    image: doc.image,
    price: doc.price,
    originalPrice: doc.originalPrice,
    discountPercent: doc.discountPercent,
    meta: doc.meta,
  }
}

function emptyPayload(query: string): ApiResponse {
  return {
    data: {
      query,
      products: [],
      courses: [],
      services: [],
      categories: [],
      brands: [],
      pages: [],
      total: 0,
    },
    error: null,
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80)

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(emptyPayload(query), {
      headers: { "Cache-Control": "public, s-maxage=300" },
    })
  }

  const rate = checkRateLimit(
    `search:${getClientIp(request)}`,
    RATE_LIMIT_PER_MINUTE,
    60_000
  )
  if (!rate.allowed) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: "Demasiadas búsquedas. Espera un momento.",
          code: "RATE_LIMITED",
        },
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  let index
  try {
    index = await getSearchIndex()
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las sugerencias",
        },
      },
      { status: 500 }
    )
  }

  const hits = searchDocs(index, query)
  const groups = groupHits(hits, SUGGEST_LIMITS)

  return NextResponse.json(
    {
      data: {
        query,
        products: groups.product.map(toItem),
        courses: groups.course.map(toItem),
        services: groups.service.map(toItem),
        categories: groups.category.map(toItem),
        brands: groups.brand.map(toItem),
        pages: groups.page.map(toItem),
        total: hits.length,
      },
      error: null,
    },
    {
      headers: {
        // El catálogo es público: el CDN puede servir la misma consulta a
        // todas las visitantes y el índice se revalida por tags desde el panel.
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  )
}
