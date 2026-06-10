import { z } from "zod"

import { phoneE164Schema } from "./phone"

const SQL_CONTROL_PATTERN = /(?:--|\/\*|\*\/|;|\x00)/

function hasNoSqlControlTokens(value: string) {
  return !SQL_CONTROL_PATTERN.test(value)
}

function requiredSafeText(fieldName: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} es obligatorio.`)
    .max(maxLength, `${fieldName} es demasiado largo.`)
    .refine(hasNoSqlControlTokens, `${fieldName} contiene caracteres no permitidos.`)
}

function optionalSafeText(fieldName: string, maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `${fieldName} es demasiado largo.`)
    .refine(hasNoSqlControlTokens, `${fieldName} contiene caracteres no permitidos.`)
    .transform((value) => value || undefined)
}

export const authEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingresa un correo electrónico válido.")
  .max(200, "El correo electrónico es demasiado largo.")
  .refine(hasNoSqlControlTokens, "El correo electrónico contiene caracteres no permitidos.")

export const loginCredentialsSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
})

export const registerAccountSchema = z.object({
  firstName: requiredSafeText("El nombre", 80),
  lastName: requiredSafeText("El apellido", 80),
  address: optionalSafeText("La dirección", 160),
  state: optionalSafeText("El estado", 80),
  city: optionalSafeText("La ciudad", 80),
  email: authEmailSchema,
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .max(72, "La contraseña es demasiado larga."),
  phone: z.preprocess((value) => {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    return trimmed || undefined
  }, phoneE164Schema.optional()),
})

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>
export type RegisterAccountInput = z.infer<typeof registerAccountSchema>
