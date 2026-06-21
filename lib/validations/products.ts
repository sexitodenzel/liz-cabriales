import { z } from "zod"

const PRICE_MAX = 10_000_000
const STOCK_MAX = 1_000_000

const abrasivityField = z
  .enum(["extra-suave", "suave", "media", "fuerte"])
  .nullable()
  .optional()

export const variantSchema = z.object({
  variantName: z
    .string()
    .min(1, "El nombre de la presentación es obligatorio")
    .max(120, "El nombre de la presentación es demasiado largo"),
  sku: z.string().max(64, "El SKU es demasiado largo").nullable().optional(),
  price: z.coerce
    .number()
    .nonnegative("El precio no puede ser negativo")
    .max(PRICE_MAX, "El precio está fuera de rango"),
  stock: z.coerce
    .number()
    .int()
    .nonnegative("El stock no puede ser negativo")
    .max(STOCK_MAX, "El stock está fuera de rango"),
  isActive: z.boolean().optional().default(true),
})

export const createVariantSchema = variantSchema
export const updateVariantSchema = variantSchema.partial()

export type VariantInput = z.infer<typeof variantSchema>

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre es demasiado largo"),
  slug: z
    .string()
    .min(1, "El slug es obligatorio")
    .max(200, "El slug es demasiado largo")
    .regex(/^[a-z0-9-]+$/, {
      message:
        "El slug solo puede contener letras minúsculas, números y guiones",
    }),
  sku: z.string().max(64, "El SKU es demasiado largo").nullable().optional(),
  description: z
    .string()
    .max(2000, "La descripción es demasiado larga")
    .nullable()
    .optional(),
  longDescription: z
    .string()
    .max(20000, "La descripción larga es demasiado larga")
    .nullable()
    .optional(),
  basePrice: z.coerce
    .number({ message: "El precio de venta debe ser un número" })
    .nonnegative("El precio de venta no puede ser negativo")
    .max(PRICE_MAX, "El precio de venta está fuera de rango"),
  costPrice: z.coerce
    .number()
    .nonnegative()
    .max(PRICE_MAX, "El precio costo está fuera de rango")
    .nullable()
    .optional(),
  wholesalePrice: z.coerce
    .number()
    .nonnegative()
    .max(PRICE_MAX, "El precio de mayoreo está fuera de rango")
    .nullable()
    .optional(),
  categoryId: z.string().uuid("Categoría inválida"),
  subcategory: z
    .string()
    .max(120, "La subcategoría es demasiado larga")
    .nullable()
    .optional(),
  brand: z.string().max(120, "La marca es demasiado larga").nullable().optional(),
  department: z
    .string()
    .max(120, "El departamento es demasiado largo")
    .nullable()
    .optional(),
  abrasivity: abrasivityField,
  images: z
    .array(z.string().url("URL de imagen inválida").max(2000))
    .max(20, "Demasiadas imágenes")
    .optional(),
  desktopImageMode: z.enum(["carousel", "hover"]).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  initialStock: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(STOCK_MAX, "El inventario inicial está fuera de rango")
    .optional(),
  minStock: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(STOCK_MAX, "El inventario mínimo está fuera de rango")
    .optional(),
  stock: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(STOCK_MAX, "El inventario está fuera de rango")
    .nullable()
    .optional(),
  variants: z
    .array(variantSchema)
    .max(50, "Demasiadas presentaciones")
    .optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
})

export const createSubcategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  categoryId: z.string().uuid("Categoría inválida"),
})

export const updateSubcategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
})

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  logoUrl: z.string().url("URL de logo inválida").nullable().optional(),
  showOnHome: z.boolean().optional(),
})

export const updateBrandSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  logoUrl: z.string().url("URL de logo inválida").nullable().optional(),
  showOnHome: z.boolean().optional(),
})

export const deleteCategorySchema = z.object({
  id: z.string().uuid("Categoría inválida"),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>
export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
