import { createClient as createServerClient } from "./server"
import type { CartItem } from "../cart"

type SupabaseError = {
  message: string
  code?: string
}

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

type CartRow = {
  id: string
  user_id: string
}

export type CartItemRow = {
  id: string
  cart_id: string
  product_id: string
  variant_id: string
  quantity: number
  price: number
  name: string
  brand: string | null
  image: string | null
}

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

export async function getOrCreateCart(
  userId: string
): Promise<Result<CartRow>> {
  const supabase = await createServerClient()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_SECONDS * 1000)

  const { data: existing, error: fetchError } = await supabase
    .from("carts")
    .select("id, user_id, expires_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError && fetchError.code !== "PGRST116") {
    return {
      data: null,
      error: { message: fetchError.message, code: fetchError.code },
    }
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("carts")
      .update({ expires_at: expiresAt.toISOString() })
      .eq("id", existing.id)
      .select("id, user_id")
      .single()

    if (updateError || !updated) {
      return {
        data: null,
        error: {
          message: updateError?.message ?? "No se pudo actualizar el carrito",
          code: updateError?.code,
        },
      }
    }

    return { data: updated as CartRow, error: null }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("carts")
    .insert({
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, user_id")
    .single()

  if (insertError || !inserted) {
    return {
      data: null,
      error: {
        message: insertError?.message ?? "No se pudo crear el carrito",
        code: insertError?.code,
      },
    }
  }

  return { data: inserted as CartRow, error: null }
}

export async function getCartItems(
  cartId: string
): Promise<Result<CartItemRow[]>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      price,
      name,
      brand,
      image
    `
    )
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: (data ?? []) as CartItemRow[], error: null }
}

export async function addCartItem(
  cartId: string,
  item: CartItem
): Promise<Result<CartItemRow[]>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("cart_items")
    .upsert(
      {
        cart_id: cartId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        brand: item.brand,
        image: item.image,
      },
      {
        onConflict: "cart_id,variant_id",
      }
    )
    .select(
      `
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      price,
      name,
      brand,
      image
    `
    )

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: (data ?? []) as CartItemRow[], error: null }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<Result<CartItemRow>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .select(
      `
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      price,
      name,
      brand,
      image
    `
    )
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo actualizar el item",
        code: error?.code,
      },
    }
  }

  return { data: data as CartItemRow, error: null }
}

export async function removeCartItem(
  cartItemId: string
): Promise<Result<null>> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: null, error: null }
}

export async function mergeGuestCart(
  userId: string,
  guestItems: CartItem[]
): Promise<Result<CartItemRow[]>> {
  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return { data: null, error: cartResult.error }
  }

  const cartId = cartResult.data.id
  const currentResult = await getCartItems(cartId)
  if (!currentResult.data) {
    return { data: null, error: currentResult.error }
  }

  const existingByVariant = new Map<string, CartItemRow>()
  for (const row of currentResult.data) {
    existingByVariant.set(row.variant_id, row)
  }

  const upserts: CartItem[] = guestItems.map((item) => {
    const existing = existingByVariant.get(item.variantId)
    if (!existing) return item
    return {
      ...item,
      quantity: existing.quantity + item.quantity,
    }
  })

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("cart_items")
    .upsert(
      upserts.map((item) => ({
        cart_id: cartId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        brand: item.brand,
        image: item.image,
      })),
      {
        onConflict: "cart_id,variant_id",
      }
    )
    .select(
      `
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      price,
      name,
      brand,
      image
    `
    )

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data: (data ?? []) as CartItemRow[], error: null }
}

