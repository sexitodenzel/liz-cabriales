import { NextResponse } from "next/server"

import {
  addCartItem,
  clearCartItems,
  getActiveCartSnapshot,
  getCartItems,
  getOrCreateCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartSnapshot,
} from "@/lib/supabase/cart"
import { createClient } from "@/lib/supabase/server"
import {
  cartActionSchema,
  deleteCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart"

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

function errorResponse<T>(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        code,
      },
    },
    { status }
  )
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      userId: null,
      response: errorResponse("No autorizado", 401, "UNAUTHORIZED") as NextResponse<
        ApiResponse<unknown>
      >,
    }
  }

  return {
    userId: user.id as string,
    response: null as NextResponse<ApiResponse<unknown>> | null,
  }
}

async function loadCartSnapshot(
  userId: string
): Promise<NextResponse<ApiResponse<CartSnapshot>> | CartSnapshot> {
  const snapshotResult = await getActiveCartSnapshot(userId)

  if (!snapshotResult.data) {
    return errorResponse(
      snapshotResult.error.message,
      500,
      snapshotResult.error.code
    )
  }

  return snapshotResult.data
}

export async function GET(): Promise<NextResponse<ApiResponse<CartSnapshot>>> {
  const { userId, response } = await requireUser()
  if (!userId || response) {
    return response as NextResponse<ApiResponse<CartSnapshot>>
  }

  const snapshot = await loadCartSnapshot(userId)
  if (snapshot instanceof NextResponse) {
    return snapshot
  }

  return NextResponse.json({ data: snapshot, error: null })
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<CartSnapshot>>> {
  const { userId, response } = await requireUser()
  if (!userId || response) {
    return response as NextResponse<ApiResponse<CartSnapshot>>
  }

  let json: unknown

  try {
    json = await request.json()
  } catch {
    return errorResponse("Body invalido", 400, "VALIDATION_ERROR")
  }

  const parseResult = cartActionSchema.safeParse(json)
  if (!parseResult.success) {
    return errorResponse("Datos invalidos", 400, "VALIDATION_ERROR")
  }

  if (parseResult.data.action === "merge") {
    const mergeResult = await mergeGuestCart(
      userId,
      parseResult.data.guestItems
    )

    if (mergeResult.error) {
      return errorResponse(
        mergeResult.error.message,
        500,
        mergeResult.error.code
      )
    }
  } else {
    const cartResult = await getOrCreateCart(userId)
    if (!cartResult.data) {
      return errorResponse(
        cartResult.error.message,
        500,
        cartResult.error.code
      )
    }

    const addResult = await addCartItem(cartResult.data.id, parseResult.data.item)
    if (addResult.error) {
      return errorResponse(
        addResult.error.message,
        500,
        addResult.error.code
      )
    }
  }

  const snapshot = await loadCartSnapshot(userId)
  if (snapshot instanceof NextResponse) {
    return snapshot
  }

  return NextResponse.json({ data: snapshot, error: null })
}

export async function PATCH(
  request: Request
): Promise<NextResponse<ApiResponse<CartSnapshot>>> {
  const { userId, response } = await requireUser()
  if (!userId || response) {
    return response as NextResponse<ApiResponse<CartSnapshot>>
  }

  let json: unknown

  try {
    json = await request.json()
  } catch {
    return errorResponse("Body invalido", 400, "VALIDATION_ERROR")
  }

  const parseResult = updateCartItemSchema.safeParse(json)
  if (!parseResult.success) {
    return errorResponse("Datos invalidos", 400, "VALIDATION_ERROR")
  }

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return errorResponse(
      cartResult.error.message,
      500,
      cartResult.error.code
    )
  }

  const itemsResult = await getCartItems(cartResult.data.id)
  if (!itemsResult.data) {
    return errorResponse(
      itemsResult.error.message,
      500,
      itemsResult.error.code
    )
  }

  const target = itemsResult.data.find(
    (row) => row.variantId === parseResult.data.variantId
  )
  if (!target) {
    return errorResponse("Item no encontrado", 404, "NOT_FOUND")
  }

  if (parseResult.data.quantity === 0) {
    const removeResult = await removeCartItem(target.id)
    if (removeResult.error) {
      return errorResponse(
        removeResult.error.message,
        500,
        removeResult.error.code
      )
    }
  } else {
    const updateResult = await updateCartItemQuantity(
      target.id,
      parseResult.data.quantity
    )
    if (updateResult.error) {
      return errorResponse(
        updateResult.error.message,
        500,
        updateResult.error.code
      )
    }
  }

  const snapshot = await loadCartSnapshot(userId)
  if (snapshot instanceof NextResponse) {
    return snapshot
  }

  return NextResponse.json({ data: snapshot, error: null })
}

export async function DELETE(
  request: Request
): Promise<NextResponse<ApiResponse<CartSnapshot>>> {
  const { userId, response } = await requireUser()
  if (!userId || response) {
    return response as NextResponse<ApiResponse<CartSnapshot>>
  }

  let json: unknown

  try {
    json = await request.json()
  } catch {
    return errorResponse("Body invalido", 400, "VALIDATION_ERROR")
  }

  const parseResult = deleteCartItemSchema.safeParse(json)
  if (!parseResult.success) {
    return errorResponse("Datos invalidos", 400, "VALIDATION_ERROR")
  }

  const cartResult = await getOrCreateCart(userId)
  if (!cartResult.data) {
    return errorResponse(
      cartResult.error.message,
      500,
      cartResult.error.code
    )
  }

  if ("clearAll" in parseResult.data && parseResult.data.clearAll) {
    const clearResult = await clearCartItems(cartResult.data.id)
    if (clearResult.error) {
      return errorResponse(
        clearResult.error.message,
        500,
        clearResult.error.code
      )
    }
  } else {
    const variantId = "variantId" in parseResult.data
      ? parseResult.data.variantId
      : null

    if (!variantId) {
      return errorResponse("Datos invalidos", 400, "VALIDATION_ERROR")
    }

    const itemsResult = await getCartItems(cartResult.data.id)
    if (!itemsResult.data) {
      return errorResponse(
        itemsResult.error.message,
        500,
        itemsResult.error.code
      )
    }

    const target = itemsResult.data.find(
      (row) => row.variantId === variantId
    )
    if (!target) {
      return errorResponse("Item no encontrado", 404, "NOT_FOUND")
    }

    const removeResult = await removeCartItem(target.id)
    if (removeResult.error) {
      return errorResponse(
        removeResult.error.message,
        500,
        removeResult.error.code
      )
    }
  }

  const snapshot = await loadCartSnapshot(userId)
  if (snapshot instanceof NextResponse) {
    return snapshot
  }

  return NextResponse.json({ data: snapshot, error: null })
}
