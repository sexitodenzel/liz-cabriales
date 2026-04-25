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
})

export type CreateAdminClientInput = z.infer<typeof createAdminClientSchema>
