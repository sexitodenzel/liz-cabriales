import { z } from "zod"

const optionalAddressField = z.string().trim().optional()

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
  .transform((value) => ({
    delivery_type: value.delivery_type,
    shipping_address: normalizeOptionalField(value.shipping_address),
    shipping_state: normalizeOptionalField(value.shipping_state),
    shipping_city: normalizeOptionalField(value.shipping_city),
  }))

export type CreateOrderInput = z.infer<typeof createOrderSchema>
