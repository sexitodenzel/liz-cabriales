import { NextResponse, type NextRequest } from "next/server"

/**
 * Rate limiter en memoria por instancia (ventana fija).
 *
 * En Vercel con Fluid Compute las instancias se reutilizan entre requests,
 * así que esto funciona como límite "suave" contra scripts de enumeración o
 * fuerza bruta. No es un límite garantizado entre instancias/regiones — para
 * garantías duras usar el WAF de Vercel o un store compartido (p. ej. Upstash).
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5000

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k)
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }
  return { allowed: true }
}

/** IP del cliente detrás del proxy de Vercel / Cloudflare / local. */
export function getClientIp(request: NextRequest): string {
  const fromHeaders =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("true-client-ip") ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-client-ip")

  if (fromHeaders) return normalizeLoopbackIp(fromHeaders)

  // Disponible en algunos runtimes de Next (middleware / edge).
  const fromRequest = (request as NextRequest & { ip?: string | null }).ip
  if (fromRequest) return normalizeLoopbackIp(fromRequest)

  // En desarrollo local no hay proxy: no hay headers de IP.
  if (process.env.NODE_ENV !== "production") {
    return "127.0.0.1"
  }

  return "unknown"
}

/** Unifica loopback IPv6 (::1) a 127.0.0.1 para lectura en auditoría. */
function normalizeLoopbackIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase()
  if (
    trimmed === "::1" ||
    trimmed === "0:0:0:0:0:0:0:1" ||
    trimmed === "::ffff:127.0.0.1"
  ) {
    return "127.0.0.1"
  }
  return ip.trim()
}

/** Headers estándar para comunicar el límite al cliente. */
export function rateLimitHeaders(retryAfterSeconds: number): HeadersInit {
  return {
    "Retry-After": String(retryAfterSeconds),
    "Cache-Control": "no-store",
  }
}

/** Respuesta 429 estandarizada cuando se supera el límite. */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Demasiadas solicitudes. Intenta de nuevo en unos momentos.",
      retryAfterSeconds,
    },
    { status: 429, headers: rateLimitHeaders(retryAfterSeconds) }
  )
}

/**
 * Atajo: aplica rate limit por IP con un scope y devuelve la respuesta 429 si
 * corresponde, o null si la petición puede continuar.
 */
export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  extraKey?: string
): NextResponse | null {
  const ip = getClientIp(request)
  const key = `${scope}:${extraKey ? `${extraKey}:` : ""}${ip}`
  const result = checkRateLimit(key, limit, windowMs)
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds)
  }
  return null
}
