import { z } from "zod"

// E.164: + seguido de 7-15 dígitos. Ej: 5218331234567
export const phoneE164Schema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, "Teléfono inválido. Usa formato internacional (ej. 5218331234567)")

export const sendPhoneCodeSchema = z.object({
  phone: phoneE164Schema,
})

export const verifyPhoneCodeSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos").regex(/^\d{6}$/, "Código inválido"),
})

export type SendPhoneCodeInput = z.infer<typeof sendPhoneCodeSchema>
export type VerifyPhoneCodeInput = z.infer<typeof verifyPhoneCodeSchema>
