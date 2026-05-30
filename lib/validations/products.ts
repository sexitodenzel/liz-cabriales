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
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  longDescription: z.string().nullable().optional(),
  basePrice: z.coerce
    .number({ message: "El precio de venta debe ser un número" })
    .nonnegative("El precio de venta no puede ser negativo"),
  costPrice: z.coerce.number().nonnegative().nullable().optional(),
  wholesalePrice: z.coerce.number().nonnegative().nullable().optional(),
  categoryId: z.string().uuid("Categoría inválida"),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  images: z.array(z.string().url("URL de imagen inválida")).optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  initialStock: z.coerce.number().int().nonnegative().optional(),
  minStock: z.coerce.number().int().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().nullable().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
})

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  logoUrl: z.string().url("URL de logo inválida").nullable().optional(),
})

export const deleteCategorySchema = z.object({
  id: z.string().uuid("Categoría inválida"),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateBrandInput = z.infer<typeof createBrandSchema>
