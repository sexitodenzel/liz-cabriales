import { z } from "zod"

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z
    .enum(["all", "pending", "paid", "shipped", "delivered", "cancelled"])
    .default("all"),
})

export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>

export const adminOrderStatusPatchSchema = z.object({
  status: z.enum(["shipped", "delivered", "cancelled"]),
})

export type AdminOrderStatusPatchInput = z.infer<typeof adminOrderStatusPatchSchema>
