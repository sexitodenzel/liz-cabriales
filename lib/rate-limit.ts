import type { NextRequest } from "next/server"

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

/** IP del cliente detrás del proxy de Vercel. */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
