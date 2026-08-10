/**
 * Helpers de Turnstile para componentes cliente.
 * La validación real ocurre en el servidor (`/api/turnstile/verify` o en cada API).
 */

/**
 * Supabase Auth tiene su propio captcha de Cloudflare (panel → Authentication →
 * Attack Protection). Cuando está activo, es Supabase quien valida el token, y
 * eso es lo que cierra el hueco de verdad: el endpoint de auth es público (la
 * anon key va en el HTML), así que cualquiera puede llamarlo saltándose el
 * sitio. Validar por nuestra cuenta solo protege el camino "por la puerta".
 *
 * El token de Turnstile es de UN SOLO USO, así que las dos validaciones son
 * excluyentes: si lo quemamos en `/api/turnstile/verify`, Supabase lo rechaza
 * después por reutilizado. Este interruptor elige quién valida, y permite
 * prender el panel y desplegar el código en el orden que sea sin ventanas sin
 * protección.
 */
export const supabaseAuthCaptchaEnabled =
  process.env.NEXT_PUBLIC_SUPABASE_AUTH_CAPTCHA === "true"

export type SupabaseCaptchaResult =
  | { ok: true; captchaToken: string | undefined }
  | { ok: false; message: string }

/**
 * Deja un token listo para una llamada de Supabase Auth: lo valida aquí o lo
 * deja intacto para que lo valide Supabase, según `supabaseAuthCaptchaEnabled`.
 * `captchaToken` es lo que hay que pasar en `options` (undefined si no aplica).
 */
export async function prepareSupabaseCaptcha(
  token: string | null | undefined
): Promise<SupabaseCaptchaResult> {
  if (!token?.trim()) {
    return {
      ok: false,
      message: "Completa la verificación de seguridad (CAPTCHA).",
    }
  }

  if (supabaseAuthCaptchaEnabled) {
    return { ok: true, captchaToken: token }
  }

  const verified = await verifyTurnstileOnServer(token)
  if (!verified.ok) return verified
  return { ok: true, captchaToken: undefined }
}

export async function verifyTurnstileOnServer(
  token: string | null | undefined
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!token?.trim()) {
    return {
      ok: false,
      message: "Completa la verificación de seguridad (CAPTCHA).",
    }
  }

  try {
    const res = await fetch("/api/turnstile/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnstileToken: token }),
    })
    const json = (await res.json()) as {
      data: { ok: true } | null
      error: { message: string } | null
    }

    if (!res.ok || !json.data?.ok) {
      return {
        ok: false,
        message:
          json.error?.message ??
          "La verificación de seguridad falló. Inténtalo de nuevo.",
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      message: "No se pudo completar la verificación de seguridad.",
    }
  }
}
