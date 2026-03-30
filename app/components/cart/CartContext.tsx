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

const CartContext = createContext<CartContextValue | null>(null)

async function syncWithApi(
  method: "POST" | "DELETE" | "PATCH",
  body: unknown
): Promise<void> {
  await fetch("/api/cart", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const programmaticRef = useRef(false)

  const itemCount = useMemo(() => computeItemCount(items), [items])
  const subtotal = useMemo(() => computeSubtotal(items), [items])

  // Cargar estado inicial
  useEffect(() => {
    const supabase = createClient()

    let isMounted = true

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

      setUserId(user.id)

      // merge guest cart → supabase
      const guest = readGuestCart()
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "merge",
            guestItems: guest.items,
          }),
        })
        const json = (await response.json()) as {
          data:
            | {
                items: CartItem[]
              }
            | null
          error: { message: string } | null
        }
        if (json.data?.items) {
          setItems(json.data.items)
          clearGuestCart()
        } else if (!json.error) {
          setItems([])
        }
      } catch {
        // fallo silencioso, mantenemos guest cart en memoria
        setItems(guest.items)
      } finally {
        setIsLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
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
          await syncWithApi("POST", { action: "add", item })
        } catch {
          // se reintentará en la siguiente mutación
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
          await syncWithApi("DELETE", { variantId })
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
          await syncWithApi("PATCH", { variantId, quantity })
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
        await syncWithApi("DELETE", { clearAll: true })
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

