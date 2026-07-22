import { checkRateLimit } from "@/lib/rate-limit"
import {
  sendAdminLoginAlertEmail,
  sendLoginBruteforceAlertEmail,
} from "@/lib/email/templates/admin-security-alerts"

/** Umbral de fallos en 15 min para disparar el correo de alerta. */
const FAIL_ALERT_THRESHOLD = 5
const FAIL_WINDOW_MS = 15 * 60_000

/** Evita spamear el mismo aviso de fuerza bruta (1 cada 30 min por IP). */
const ALERT_EMAIL_COOLDOWN_MS = 30 * 60_000

type FailBucket = { count: number; resetAt: number }
const failBuckets = new Map<string, FailBucket>()

function bumpFailedAttempts(ip: string): number {
  const now = Date.now()
  const key = ip || "unknown"
  const bucket = failBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    failBuckets.set(key, { count: 1, resetAt: now + FAIL_WINDOW_MS })
    return 1
  }
  bucket.count += 1
  return bucket.count
}

function canSendBruteforceEmail(ip: string): boolean {
  // checkRateLimit: allow 1 send per cooldown window (2nd call within window = blocked).
  const result = checkRateLimit(
    `login-bruteforce-email:${ip || "unknown"}`,
    1,
    ALERT_EMAIL_COOLDOWN_MS
  )
  return result.allowed
}

/** Aviso de login admin exitoso (best-effort, no bloquea el login). */
export function notifyAdminLoginSuccess(input: {
  fullName?: string | null
  email: string
  method: string
  ip?: string | null
  userAgent?: string | null
}): void {
  void sendAdminLoginAlertEmail(input).catch((err) => {
    console.error("[security] admin login alert email failed:", err)
  })
}

/**
 * Registra un fallo de credenciales. Al llegar al umbral, envía correo
 * (como máximo 1 cada 30 min por IP).
 */
export function trackFailedLoginAndMaybeAlert(input: {
  emailAttempted?: string | null
  ip: string
  userAgent?: string | null
}): void {
  const count = bumpFailedAttempts(input.ip)
  if (count < FAIL_ALERT_THRESHOLD) return
  if (!canSendBruteforceEmail(input.ip)) return

  void sendLoginBruteforceAlertEmail({
    emailAttempted: input.emailAttempted,
    ip: input.ip,
    userAgent: input.userAgent,
    attemptCount: count,
    kind: "failed_attempts",
  }).catch((err) => {
    console.error("[security] bruteforce alert email failed:", err)
  })
}

/** Aviso cuando el rate limit del login responde 429. */
export function notifyLoginRateLimited(input: {
  emailAttempted?: string | null
  ip: string
  userAgent?: string | null
}): void {
  if (!canSendBruteforceEmail(input.ip)) return

  const bucket = failBuckets.get(input.ip || "unknown")
  void sendLoginBruteforceAlertEmail({
    emailAttempted: input.emailAttempted,
    ip: input.ip,
    userAgent: input.userAgent,
    attemptCount: bucket?.count ?? 0,
    kind: "rate_limited",
  }).catch((err) => {
    console.error("[security] rate-limit alert email failed:", err)
  })
}
