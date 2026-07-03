import { z } from "zod"

const uuid = z.string().uuid("ID inválido")

export const serviceOptionTypeSchema = z.enum(["extra", "nail_type"])

export const adminServiceCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  duration_min: z.coerce
    .number()
    .int()
    .min(15, "Duración mínima 15 minutos")
    .max(600, "Duración máxima 600 minutos"),
  show_options: z.boolean().optional(),
  filter_id: uuid.optional().nullable(),
})

export const adminServiceUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.coerce.number().min(0).optional(),
    duration_min: z.coerce.number().int().min(15).max(600).optional(),
    is_active: z.boolean().optional(),
    show_options: z.boolean().optional(),
    filter_id: uuid.optional().nullable(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.price !== undefined ||
      value.duration_min !== undefined ||
      value.is_active !== undefined ||
      value.show_options !== undefined ||
      value.filter_id !== undefined,
    { message: "Debes indicar al menos un campo a actualizar" }
  )

export const adminServiceOptionCreateSchema = z.object({
  label: z.string().trim().min(1, "La etiqueta es obligatoria").max(120),
  option_type: serviceOptionTypeSchema,
  price_delta: z.coerce.number().min(0).optional(),
  duration_delta: z.coerce.number().int().min(0).max(240).optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
})

export const adminServiceOptionUpdateSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    option_type: serviceOptionTypeSchema.optional(),
    price_delta: z.coerce.number().min(0).optional(),
    duration_delta: z.coerce.number().int().min(0).max(240).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.coerce.number().int().min(0).max(999).optional(),
  })
  .refine(
    (value) =>
      value.label !== undefined ||
      value.option_type !== undefined ||
      value.price_delta !== undefined ||
      value.duration_delta !== undefined ||
      value.is_active !== undefined ||
      value.sort_order !== undefined,
    { message: "Debes indicar al menos un campo a actualizar" }
  )

export const serviceOptionLinkSchema = z.object({
  option_id: uuid,
  is_enabled: z.boolean(),
})

export const adminServiceOptionLinksSchema = z.object({
  links: z.array(serviceOptionLinkSchema),
})

export const adminServiceInlineOptionSchema = z.object({
  label: z.string().trim().min(1, "El complemento es obligatorio").max(120),
  price_delta: z.coerce.number().min(0).optional(),
  duration_delta: z.coerce.number().int().min(0).max(240).optional(),
  option_type: serviceOptionTypeSchema.optional(),
})

export const adminServiceFilterCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
})

export const serviceSelectionSchema = z.object({
  service_id: uuid,
  option_ids: z.array(uuid).max(20),
})

export type AdminServiceCreateInput = z.infer<typeof adminServiceCreateSchema>
export type AdminServiceUpdateInput = z.infer<typeof adminServiceUpdateSchema>
export type AdminServiceOptionCreateInput = z.infer<
  typeof adminServiceOptionCreateSchema
>
export type AdminServiceOptionUpdateInput = z.infer<
  typeof adminServiceOptionUpdateSchema
>
export type ServiceSelectionInput = z.infer<typeof serviceSelectionSchema>
