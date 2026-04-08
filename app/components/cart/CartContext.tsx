"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"
import {
  CartItem,
  clearGuestCart,
  computeItemCount,
  computeSubtotal,
  mergeCartItems,
  readGuestCart,
  writeGuestCart,
} from "@/lib/cart"

type CartContextValue = {
  items: CartItem[]
  isLoading: boolean
  itemCount: number
  subtotal: number
  isCartOpen: boolean
  addItem: (item: CartItem) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  isProgrammatic: () => boolean
  clearProgrammatic: () => void
}

type CartApiData = {
  cart_id: string
  items: CartItem[]
  total: number
}

type CartApiResponse =
  | { data: CartApiData; error: null }
  | { data: null; error: { message: string; code?: string } }

const CartContext = createContext<CartContextValue | null>(null)

async function requestCartSnapshot(
  method: "GET" | "POST" | "DELETE" | "PATCH",
  body?: unknown
): Promise<CartApiData> {
  const response = await fetch("/api/cart", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = (await response.json()) as CartApiResponse

  if (!response.ok || !json.data) {
    throw new Error(json.error?.message ?? "No se pudo sincronizar el carrito")
  }

  return json.data
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const programmaticRef = useRef(false)

  const itemCount = useMemo(() => computeItemCount(items), [items])
  const subtotal = useMemo(() => computeSubtotal(items), [items])

  useEffect(() => {
    const supabase = createClient()

    let isMounted = true

    const loadAuthenticatedCart = async (nextUserId: string) => {
      setUserId(nextUserId)

      const guest = readGuestCart()

      try {
        const snapshot =
          guest.items.length > 0
            ? await requestCartSnapshot("POST", {
                action: "merge",
                guestItems: guest.items,
              })
            : await requestCartSnapshot("GET")

        if (!isMounted) return

        setItems(snapshot.items)

        if (guest.items.length > 0) {
          clearGuestCart()
        }
      } catch {
        if (!isMounted) return
        setItems(guest.items)
      }
    }

    const init = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (!user) {
        const snapshot = readGuestCart()
        setItems(snapshot.items)
        setUserId(null)
        setIsLoading(false)
        return
      }

      try {
        await loadAuthenticatedCart(user.id)
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadAuthenticatedCart(session.user.id)
      } else {
        setUserId(null)
        setItems(readGuestCart().items)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const persistGuest = useCallback(
    (next: CartItem[]) => {
      if (!userId) {
        writeGuestCart(next)
      }
    },
    [userId]
  )

  const addItem = useCallback(
    async (item: CartItem) => {
      setItems((prev) => {
        const merged = mergeCartItems(prev, [item])
        persistGuest(merged)
        return merged
      })

      if (userId) {
        try {
          const snapshot = await requestCartSnapshot("POST", {
            action: "add",
            item,
          })
          setItems(snapshot.items)
        } catch {
          // se reintentara en la siguiente mutacion
        }
      }
    },
    [persistGuest, userId]
  )

  const removeItem = useCallback(
    async (variantId: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.variantId !== variantId)
        persistGuest(next)
        return next
      })

      if (userId) {
        try {
          const snapshot = await requestCartSnapshot("DELETE", { variantId })
          setItems(snapshot.items)
        } catch {
          // ignore
        }
      }
    },
    [persistGuest, userId]
  )

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(variantId)
        return
      }

      setItems((prev) => {
        const next = prev.map((item) =>
          item.variantId === variantId ? { ...item, quantity } : item
        )
        persistGuest(next)
        return next
      })

      if (userId) {
        try {
          const snapshot = await requestCartSnapshot("PATCH", {
            variantId,
            quantity,
          })
          setItems(snapshot.items)
        } catch {
          // ignore
        }
      }
    },
    [persistGuest, removeItem, userId]
  )

  const clearCart = useCallback(async () => {
    setItems([])
    clearGuestCart()

    if (userId) {
      try {
        const snapshot = await requestCartSnapshot("DELETE", {
          clearAll: true,
        })
        setItems(snapshot.items)
      } catch {
        // ignore
      }
    }
  }, [userId])

  const openCart = useCallback(() => {
    programmaticRef.current = true
    setIsCartOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const isProgrammatic = useCallback(() => programmaticRef.current, [])

  const clearProgrammatic = useCallback(() => {
    programmaticRef.current = false
  }, [])

  const value: CartContextValue = {
    items,
    isLoading,
    itemCount,
    subtotal,
    isCartOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de CartProvider")
  }
  return ctx
}
