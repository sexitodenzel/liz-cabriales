import { createHash, randomInt, timingSafeEqual } from "crypto"
import { createClient } from "@supabase/supabase-js"

import { sendWhatsAppTemplate } from "./whatsapp-client"
import {
  TEMPLATE_NAMES,
  TEMPLATE_LANGUAGE,
  buildPhoneVerifyOtpComponents,
} from "./templates"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
type Result<T> = { data: T; error: null } | { data: null; error: SupabaseError }

const OTP_TTL_MINUTES = 10
const SEND_COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_DAY = 10
const MAX_VERIFY_ATTEMPTS = 5

// Las columnas de límites (attempts / sends) requieren correr
// docs/delivery/sql-phone-otp-limits.sql en Supabase. Si no existen (42703),
// se degrada al comportamiento anterior sin límites para no romper el flujo.
const MISSING_LIMIT_COLUMNS_WARNING =
  "[phone-verification] Faltan columnas de límites de OTP. " +
  "Corre docs/delivery/sql-phone-otp-limits.sql en Supabase. Continuando sin límites."

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

function hashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Genera un OTP, lo guarda hasheado en users y lo envía por WhatsApp.
 * El teléfono se normaliza: si no empieza con '+', se asume México (52).
 *
 * Límites anti-abuso: cooldown de 60s entre envíos y máximo 10 códigos por día.
 */
export async function sendPhoneOtp(
  userId: string,
  phone: string
): Promise<Result<null>> {
  const normalized = phone.startsWith("+") ? phone : `+${phone}`

  let hasLimitColumns = true
  let current: {
    phone_verification_expires_at: string | null
    phone_otp_sends_date?: string | null
    phone_otp_sends_count?: number | null
  } | null = null

  const fullSelect = await supabaseAdmin
    .from("users")
    .select(
      "phone_verification_expires_at, phone_otp_sends_date, phone_otp_sends_count"
    )
    .eq("id", userId)
    .maybeSingle()

  if (fullSelect.error?.code === "42703") {
    hasLimitColumns = false
    console.warn(MISSING_LIMIT_COLUMNS_WARNING)
    const basicSelect = await supabaseAdmin
      .from("users")
      .select("phone_verification_expires_at")
      .eq("id", userId)
      .maybeSingle()
    if (basicSelect.error) {
      return {
        data: null,
        error: { message: basicSelect.error.message, code: basicSelect.error.code },
      }
    }
    current = basicSelect.data
  } else if (fullSelect.error) {
    return {
      data: null,
      error: { message: fullSelect.error.message, code: fullSelect.error.code },
    }
  } else {
    current = fullSelect.data
  }

  if (!current) {
    return {
      data: null,
      error: { message: "Usuario no encontrado", code: "NOT_FOUND" },
    }
  }

  // Cooldown: el momento del último envío se deriva de expires_at - TTL.
  if (current.phone_verification_expires_at) {
    const lastSentAt =
      new Date(current.phone_verification_expires_at).getTime() -
      OTP_TTL_MINUTES * 60 * 1000
    if (Date.now() - lastSentAt < SEND_COOLDOWN_SECONDS * 1000) {
      return {
        data: null,
        error: {
          message: "Espera un momento antes de solicitar otro código.",
          code: "RATE_LIMITED",
        },
      }
    }
  }

  const today = utcDateString()
  const sendsToday =
    hasLimitColumns && current.phone_otp_sends_date === today
      ? Number(current.phone_otp_sends_count ?? 0)
      : 0

  if (sendsToday >= MAX_SENDS_PER_DAY) {
    return {
      data: null,
      error: {
        message: "Alcanzaste el límite de códigos por hoy. Intenta mañana.",
        code: "RATE_LIMITED",
      },
    }
  }

  const code = randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const updatePayload: Record<string, unknown> = {
    phone: normalized,
    phone_verified: false,
    phone_verification_code_hash: hashCode(code),
    phone_verification_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }
  if (hasLimitColumns) {
    updatePayload.phone_verification_attempts = 0
    updatePayload.phone_otp_sends_date = today
    updatePayload.phone_otp_sends_count = sendsToday + 1
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update(updatePayload)
    .eq("id", userId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  try {
    await sendWhatsAppTemplate(
      normalized,
      TEMPLATE_NAMES.PHONE_VERIFY_OTP,
      TEMPLATE_LANGUAGE,
      buildPhoneVerifyOtpComponents(code)
    )
  } catch (err) {
    console.error(`[phone-verification] Error enviando OTP a ${normalized}:`, err)
  }

  return { data: null, error: null }
}

/**
 * Valida el OTP. Si es correcto, marca phone_verified=true y limpia el código.
 * Tras MAX_VERIFY_ATTEMPTS intentos fallidos el código queda bloqueado y hay
 * que solicitar uno nuevo.
 */
export async function verifyPhoneOtp(
  userId: string,
  code: string
): Promise<Result<null>> {
  let hasAttemptsColumn = true
  let row: {
    phone_verification_code_hash: string | null
    phone_verification_expires_at: string | null
    phone_verification_attempts?: number | null
  } | null = null

  const fullSelect = await supabaseAdmin
    .from("users")
    .select(
      "phone_verification_code_hash, phone_verification_expires_at, phone_verification_attempts"
    )
    .eq("id", userId)
    .maybeSingle()

  if (fullSelect.error?.code === "42703") {
    hasAttemptsColumn = false
    console.warn(MISSING_LIMIT_COLUMNS_WARNING)
    const basicSelect = await supabaseAdmin
      .from("users")
      .select("phone_verification_code_hash, phone_verification_expires_at")
      .eq("id", userId)
      .maybeSingle()
    if (basicSelect.error) {
      return {
        data: null,
        error: { message: basicSelect.error.message, code: basicSelect.error.code },
      }
    }
    row = basicSelect.data
  } else if (fullSelect.error) {
    return {
      data: null,
      error: { message: fullSelect.error.message, code: fullSelect.error.code },
    }
  } else {
    row = fullSelect.data
  }

  if (!row) {
    return { data: null, error: { message: "Usuario no encontrado", code: "NOT_FOUND" } }
  }

  if (!row.phone_verification_code_hash || !row.phone_verification_expires_at) {
    return { data: null, error: { message: "No hay código pendiente de verificación", code: "NO_CODE" } }
  }

  if (new Date(row.phone_verification_expires_at) < new Date()) {
    return { data: null, error: { message: "El código expiró. Solicita uno nuevo.", code: "CODE_EXPIRED" } }
  }

  const attempts = hasAttemptsColumn
    ? Number(row.phone_verification_attempts ?? 0)
    : 0

  if (hasAttemptsColumn && attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      data: null,
      error: {
        message: "Demasiados intentos fallidos. Solicita un nuevo código.",
        code: "TOO_MANY_ATTEMPTS",
      },
    }
  }

  if (!hashesMatch(hashCode(code), row.phone_verification_code_hash)) {
    if (hasAttemptsColumn) {
      await supabaseAdmin
        .from("users")
        .update({
          phone_verification_attempts: attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (attempts + 1 >= MAX_VERIFY_ATTEMPTS) {
        return {
          data: null,
          error: {
            message: "Demasiados intentos fallidos. Solicita un nuevo código.",
            code: "TOO_MANY_ATTEMPTS",
          },
        }
      }
    }
    return { data: null, error: { message: "Código incorrecto", code: "INVALID_CODE" } }
  }

  const successPayload: Record<string, unknown> = {
    phone_verified: true,
    phone_verification_code_hash: null,
    phone_verification_expires_at: null,
    updated_at: new Date().toISOString(),
  }
  if (hasAttemptsColumn) {
    successPayload.phone_verification_attempts = 0
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update(successPayload)
    .eq("id", userId)

  if (updateError) {
    return { data: null, error: { message: updateError.message, code: updateError.code } }
  }

  return { data: null, error: null }
}
