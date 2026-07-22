/**
 * Helpers de Turnstile para componentes cliente.
 * La validación real ocurre en el servidor (`/api/turnstile/verify` o en cada API).
 */

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
