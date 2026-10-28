/**
 * Cookie de un solo uso que `/forgot-password` deja antes de pedir el correo de
 * recuperación y que `/auth/callback` consume para saber que ese `?code=` es de
 * una recuperación de contraseña.
 *
 * Existe porque el `redirectTo` del correo debe ser EXACTAMENTE la URL que está
 * en la lista de Redirect URLs de Supabase (`/auth/callback`); con un
 * `?type=recovery` pegado, Supabase puede rechazarlo y mandar al usuario al
 * Site URL (la portada) en vez de a restablecer. El PKCE ya obliga a abrir el
 * enlace en el mismo navegador, así que la cookie siempre viaja con el usuario.
 */
export const RECOVERY_MARKER_COOKIE = "lc_pw_recovery"

/** Una hora: el mismo margen que tiene el enlace del correo. */
export const RECOVERY_MARKER_MAX_AGE_SECONDS = 60 * 60
