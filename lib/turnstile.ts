import { NextResponse, type NextRequest } from "next/server"

import { getClientIp } from "@/lib/rate-limit"

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type TurnstileFailureCode = "TURNSTILE_MISSING" | "TURNSTILE_FAILED"

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; message: string; code: TurnstileFailureCode }

type SiteverifyResponse = {
  success?: boolean
  "error-codes"?: string[]
}

/**
 * Valida un token de Cloudflare Turnstile contra siteverify.
 * Solo usar en servidor (necesita TURNSTILE_SECRET_KEY).
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  options?: { ip?: string }
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return {
      ok: false,
      message: "Verificación anti-bot no configurada en el servidor.",
      code: "TURNSTILE_FAILED",
    }
  }

  const trimmed = typeof token === "string" ? token.trim() : ""
  if (!trimmed) {
    return {
      ok: false,
      message: "Completa la verificación de seguridad (CAPTCHA).",
      code: "TURNSTILE_MISSING",
    }
  }

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", trimmed)
  if (options?.ip && options.ip !== "unknown") {
    body.set("remoteip", options.ip)
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      return {
        ok: false,
        message: "No se pudo validar la verificación de seguridad. Intenta de nuevo.",
        code: "TURNSTILE_FAILED",
      }
    }

    const data = (await res.json()) as SiteverifyResponse
    if (!data.success) {
      return {
        ok: false,
        message: "La verificación de seguridad falló o expiró. Inténtalo de nuevo.",
        code: "TURNSTILE_FAILED",
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      message: "No se pudo validar la verificación de seguridad. Intenta de nuevo.",
      code: "TURNSTILE_FAILED",
    }
  }
}

/** Extrae `turnstileToken` de un body JSON sin mutar el resto de la lógica. */
export function extractTurnstileToken(json: unknown): string | null {
  if (!json || typeof json !== "object") return null
  const value = (json as { turnstileToken?: unknown }).turnstileToken
  return typeof value === "string" ? value : null
}

/**
 * Atajo para rutas API: valida Turnstile y, si falla, devuelve 403.
 * Retorna null si el token es válido.
 */
export async function requireTurnstile(
  request: NextRequest,
  token: string | null | undefined
): Promise<NextResponse | null> {
  const result = await verifyTurnstileToken(token, { ip: getClientIp(request) })
  if (result.ok) return null

  return NextResponse.json(
    {
      data: null,
      error: { message: result.message, code: result.code },
    },
    { status: 403 }
  )
}
