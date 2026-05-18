import { z } from "zod"

export const shippingQuoteSchema = z.object({
  shipping_amount_final: z
    .number()
    .positive("El monto de envío debe ser mayor a 0"),
  carrier: z.string().max(100).optional(),
  tracking_number: z.string().max(200).optional(),
  guide_notes: z.string().max(500).optional(),
})

export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>
