import { createHash, randomInt } from "crypto"
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

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

/**
 * Genera un OTP, lo guarda hasheado en users y lo envía por WhatsApp.
 * El teléfono se normaliza: si no empieza con '+', se asume México (52).
 */
export async function sendPhoneOtp(
  userId: string,
  phone: string
): Promise<Result<null>> {
  const normalized = phone.startsWith("+") ? phone : `+${phone}`
  const code = randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      phone: normalized,
      phone_verified: false,
      phone_verification_code_hash: hashCode(code),
      phone_verification_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
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
 */
export async function verifyPhoneOtp(
  userId: string,
  code: string
): Promise<Result<null>> {
  const { data: user, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("phone_verification_code_hash, phone_verification_expires_at")
    .eq("id", userId)
    .maybeSingle()

  if (fetchError) {
    return { data: null, error: { message: fetchError.message, code: fetchError.code } }
  }

  if (!user) {
    return { data: null, error: { message: "Usuario no encontrado", code: "NOT_FOUND" } }
  }

  const row = user as {
    phone_verification_code_hash: string | null
    phone_verification_expires_at: string | null
  }

  if (!row.phone_verification_code_hash || !row.phone_verification_expires_at) {
    return { data: null, error: { message: "No hay código pendiente de verificación", code: "NO_CODE" } }
  }

  if (new Date(row.phone_verification_expires_at) < new Date()) {
    return { data: null, error: { message: "El código expiró. Solicita uno nuevo.", code: "CODE_EXPIRED" } }
  }

  if (hashCode(code) !== row.phone_verification_code_hash) {
    return { data: null, error: { message: "Código incorrecto", code: "INVALID_CODE" } }
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      phone_verified: true,
      phone_verification_code_hash: null,
      phone_verification_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    return { data: null, error: { message: updateError.message, code: updateError.code } }
  }

  return { data: null, error: null }
}
