import { NextRequest, NextResponse } from "next/server"

import {
  addCartItem,
  getCartItems,
  getOrCreateCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/supabase/cart"
import { createClient } from "@/lib/supabase/server"
import type { CartItem } from "@/lib/cart"

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

async function requireUser(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { userId: null, response: unauthorized() as NextResponse<ApiResponse<unknown>> }
  }

  return { userId: user.id as string, response: null as NextResponse<ApiResponse<unknown>> | null }
}

function unauthorized<T>(): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data: null, error: { message: "No autorizado", code: "unauthorized" } },
    { status: 401 }
  )
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ items: CartItem[] }>>> {
  const { userId, response } = await requireUser(req)
  if (!userId || response) return response as NextResponse<ApiResponse<{ items: CartItem[] }>>

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return NextResponse.json(
      { data: null, error: cartResult.error },
      { status: 500 }
    )
  }

  const itemsResult = await getCartItems(cartResult.data.id)
  if (!itemsResult.data) {
    return NextResponse.json(
      { data: null, error: itemsResult.error },
      { status: 500 }
    )
  }

  const items: CartItem[] = itemsResult.data.map((row) => ({
    productId: row.product_id,
    variantId: row.variant_id,
    quantity: row.quantity,
    price: row.price,
    name: row.name,
    brand: row.brand,
    image: row.image,
  }))

  return NextResponse.json({ data: { items }, error: null })
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ items?: CartItem[] }>>> {
  const { userId, response } = await requireUser(req)
  if (!userId || response) return response as NextResponse<ApiResponse<{ items?: CartItem[] }>>

  const body = (await req.json()) as
    | { action: "add"; item: CartItem }
    | { action: "merge"; guestItems: CartItem[] }

  if (body.action === "merge") {
    const mergeResult = await mergeGuestCart(userId, body.guestItems ?? [])
    if (!mergeResult.data) {
      return NextResponse.json(
        { data: null, error: mergeResult.error },
        { status: 500 }
      )
    }

    const items: CartItem[] = mergeResult.data.map((row) => ({
      productId: row.product_id,
      variantId: row.variant_id,
      quantity: row.quantity,
      price: row.price,
      name: row.name,
      brand: row.brand,
      image: row.image,
    }))

    return NextResponse.json({ data: { items }, error: null })
  }

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return NextResponse.json(
      { data: null, error: cartResult.error },
      { status: 500 }
    )
  }

  const addResult = await addCartItem(cartResult.data.id, body.item)
  if (!addResult.data) {
    return NextResponse.json(
      { data: null, error: addResult.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: {}, error: null })
}

export async function PATCH(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{}>>> {
  const { userId, response } = await requireUser(req)
  if (!userId || response) return response as NextResponse<ApiResponse<{}>>

  const body = (await req.json()) as { variantId: string; quantity: number }

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return NextResponse.json(
      { data: null, error: cartResult.error },
      { status: 500 }
    )
  }

  const itemsResult = await getCartItems(cartResult.data.id)
  if (!itemsResult.data) {
    return NextResponse.json(
      { data: null, error: itemsResult.error },
      { status: 500 }
    )
  }

  const target = itemsResult.data.find(
    (row) => row.variant_id === body.variantId
  )
  if (!target) {
    return NextResponse.json({
      data: null,
      error: { message: "Item no encontrado", code: "not_found" },
    })
  }

  const updateResult = await updateCartItemQuantity(target.id, body.quantity)
  if (!updateResult.data) {
    return NextResponse.json(
      { data: null, error: updateResult.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: {}, error: null })
}

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{}>>> {
  const { userId, response } = await requireUser(req)
  if (!userId || response) return response as NextResponse<ApiResponse<{}>>

  const body = (await req.json()) as
    | { clearAll: true }
    | { variantId: string }

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return NextResponse.json(
      { data: null, error: cartResult.error },
      { status: 500 }
    )
  }

  if ("clearAll" in body && body.clearAll) {
    const supabase = await createClient()
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartResult.data.id)
    if (error) {
      return NextResponse.json(
        { data: null, error: { message: error.message, code: error.code } },
        { status: 500 }
      )
    }
    return NextResponse.json({ data: {}, error: null })
  }

  const itemsResult = await getCartItems(cartResult.data.id)
  if (!itemsResult.data) {
    return NextResponse.json(
      { data: null, error: itemsResult.error },
      { status: 500 }
    )
  }

  const variantId = (body as { variantId: string }).variantId
  const target = itemsResult.data.find(
    (row) => row.variant_id === variantId
  )
  if (!target) {
    return NextResponse.json({
      data: null,
      error: { message: "Item no encontrado", code: "not_found" },
    })
  }

  const removeResult = await removeCartItem(target.id)
  if (removeResult.error) {
    return NextResponse.json(
      { data: null, error: removeResult.error },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: {}, error: null })
}

