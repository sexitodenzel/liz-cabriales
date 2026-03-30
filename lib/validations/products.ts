import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  slug: z
    .string()
    .min(1, "El slug es obligatorio")
    .regex(/^[a-z0-9-]+$/, {
      message:
        "El slug solo puede contener letras minúsculas, números y guiones",
    }),
  description: z.string().nullable().optional(),
  basePrice: z.coerce
    .number({ message: "El precio base debe ser un número" })
    .nonnegative("El precio base no puede ser negativo"),
  categoryId: z.string().uuid("Categoría inválida"),
  brand: z.string().nullable().optional(),
  images: z.array(z.string().url("URL de imagen inválida")).optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

