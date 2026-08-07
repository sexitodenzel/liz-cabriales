import { MercadoPagoConfig } from "mercadopago"

/**
 * Helpers compartidos de MercadoPago.
 *
 * El punto delicado es `resolveCheckoutUrl`: la API de preferencias devuelve
 * SIEMPRE `init_point` y `sandbox_init_point`, también con credenciales de
 * producción. Elegir con `sandbox_init_point ?? init_point` manda al cliente
 * al checkout de sandbox y no cobra dinero real, así que la decisión tiene que
 * salir del tipo de access token configurado, no de qué campo vino en la
 * respuesta.
 */

export function getMercadoPagoAccessToken(): string {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim()
}

/** Las credenciales de prueba empiezan con `TEST-`; las de producción con `APP_USR-`. */
export function isTestAccessToken(): boolean {
  return getMercadoPagoAccessToken().toUpperCase().startsWith("TEST-")
}

export function getMercadoPagoClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getMercadoPagoAccessToken() })
}

type PreferenceCheckoutUrls = {
  init_point?: string | null
  sandbox_init_point?: string | null
}

/**
 * URL de checkout que corresponde a las credenciales configuradas.
 *
 * En producción NO cae a `sandbox_init_point` a propósito: preferimos fallar
 * con string vacío (el route responde 502) antes que cobrar en sandbox una
 * compra real. Devuelve "" si la preferencia no trae la URL esperada.
 */
export function resolveCheckoutUrl(preference: PreferenceCheckoutUrls): string {
  if (isTestAccessToken()) {
    return preference.sandbox_init_point ?? preference.init_point ?? ""
  }
  return preference.init_point ?? ""
}
