import { z } from "zod"

const optionalAddressField = z.string().trim().optional()

const rfcSchema = z
  .string()
  .trim()
  .min(12, "El RFC debe tener al menos 12 caracteres")
  .max(13, "El RFC admite como máximo 13 caracteres")
  .regex(/^[A-ZÑ&0-9]+$/i, "El RFC solo puede contener letras y números")

const razonSocialSchema = z
  .string()
  .trim()
  .min(1, "La razón social es obligatoria para facturación")
  .max(200, "La razón social es demasiado larga")

function normalizeOptionalField(value?: string): string | undefined {
  if (!value) return undefined

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const createOrderSchema = z
  .object({
    delivery_type: z.enum(["shipping", "pickup"]),
    shipping_address: optionalAddressField,
    shipping_state: optionalAddressField,
    shipping_city: optionalAddressField,
    requires_invoice: z.boolean().optional().default(false),
    rfc: z.string().trim().max(13).optional(),
    razon_social: z.string().trim().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.delivery_type !== "shipping") {
      return
    }

    if (!value.shipping_address) {
      ctx.addIssue({
        code: "custom",
        path: ["shipping_address"],
        message: "La direccion de envio es obligatoria",
      })
    }

    if (!value.shipping_state) {
      ctx.addIssue({
        code: "custom",
        path: ["shipping_state"],
        message: "El estado de envio es obligatorio",
      })
    }

    if (!value.shipping_city) {
      ctx.addIssue({
        code: "custom",
        path: ["shipping_city"],
        message: "La ciudad de envio es obligatoria",
      })
    }
  })
  .superRefine((value, ctx) => {
    if (!value.requires_invoice) return

    const rfc = value.rfc?.trim() ?? ""
    const rs = value.razon_social?.trim() ?? ""
    const rfcParsed = rfcSchema.safeParse(rfc)
    if (!rfcParsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["rfc"],
        message: rfcParsed.error.issues[0]?.message ?? "RFC inválido",
      })
    }
    const rsParsed = razonSocialSchema.safeParse(rs)
    if (!rsParsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["razon_social"],
        message: rsParsed.error.issues[0]?.message ?? "Razón social inválida",
      })
    }
  })
  .transform((value) => ({
    delivery_type: value.delivery_type,
    shipping_address: normalizeOptionalField(value.shipping_address),
    shipping_state: normalizeOptionalField(value.shipping_state),
    shipping_city: normalizeOptionalField(value.shipping_city),
    requires_invoice: Boolean(value.requires_invoice),
    rfc: value.requires_invoice
      ? (value.rfc ?? "").trim().toUpperCase()
      : undefined,
    razon_social: value.requires_invoice
      ? (value.razon_social ?? "").trim()
      : undefined,
  }))

export type CreateOrderInput = z.infer<typeof createOrderSchema>
