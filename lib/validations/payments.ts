import { z } from "zod"

export const createPaymentSchema = z.object({
  order_id: z.string().uuid("El ID de la orden debe ser un UUID válido"),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
