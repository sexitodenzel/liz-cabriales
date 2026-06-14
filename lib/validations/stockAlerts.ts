import { z } from "zod"

export const stockAlertVariantSchema = z.object({
  variantId: z.string().uuid("ID de presentación inválido"),
})

export type StockAlertVariantInput = z.infer<typeof stockAlertVariantSchema>
