import { z } from "zod"

export const createAdminClientSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "Nombre demasiado largo"),
  last_name: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio")
    .max(80, "Apellido demasiado largo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(200, "Email demasiado largo"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .min(10, "Ingresa el número de celular (10 dígitos)")
        .max(10, "El celular debe tener 10 dígitos")
        .regex(/^\d{10}$/, "El celular debe tener 10 dígitos")
    ),
})

export type CreateAdminClientInput = z.infer<typeof createAdminClientSchema>
