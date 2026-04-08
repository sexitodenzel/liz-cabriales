import { z } from "zod"

const cartItemSchema = z.object({
  productId: z.string().uuid("Producto invalido"),
  variantId: z.string().uuid("Variante invalida"),
  quantity: z.coerce
    .number({ message: "La cantidad debe ser un numero" })
    .int("La cantidad debe ser entera")
    .positive("La cantidad debe ser mayor a cero"),
  price: z.coerce
    .number({ message: "El precio debe ser un numero" })
    .nonnegative("El precio no puede ser negativo"),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  brand: z.string().trim().nullable(),
  image: z.string().url("La imagen debe ser una URL valida").nullable(),
})

export const cartActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    item: cartItemSchema,
  }),
  z.object({
    action: z.literal("merge"),
    guestItems: z.array(cartItemSchema),
  }),
])

export const updateCartItemSchema = z.object({
  variantId: z.string().uuid("Variante invalida"),
  quantity: z.coerce
    .number({ message: "La cantidad debe ser un numero" })
    .int("La cantidad debe ser entera")
    .nonnegative("La cantidad no puede ser negativa"),
})

export const deleteCartItemSchema = z.union([
  z.object({
    clearAll: z.literal(true),
  }),
  z.object({
    variantId: z.string().uuid("Variante invalida"),
  }),
])

export type CartActionInput = z.infer<typeof cartActionSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type DeleteCartItemInput = z.infer<typeof deleteCartItemSchema>
