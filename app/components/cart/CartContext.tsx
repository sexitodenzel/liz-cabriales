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
  removedCount: number
  addItem: (item: CartItem) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  adjustItem: (variantId: string, delta: number, min?: number) => void
  clearCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  isProgrammatic: () => boolean
  clearProgrammatic: () => void
  dismissRemovedNotification: () => void
}

type CartApiData = {
  cart_id: string
  items: CartItem[]
  total: number
  removed_count?: number
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
  const [removedCount, setRemovedCount] = useState(0)
  const programmaticRef = useRef(false)
  const itemsRef = useRef<CartItem[]>([])
  const userIdRef = useRef<string | null>(null)
  const loadInFlightRef = useRef(false)
  const debounceApiRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const applySnapshot = useCallback((snapshot: CartApiData) => {
    setItems(snapshot.items)
    if (snapshot.removed_count && snapshot.removed_count > 0) {
      setRemovedCount((prev) => prev + snapshot.removed_count!)
    }
  }, [])

  const itemCount = useMemo(() => computeItemCount(items), [items])
  const subtotal = useMemo(() => computeSubtotal(items), [items])

  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    const supabase = createClient()

    let isMounted = true

    const loadAuthenticatedCart = async (
      nextUserId: string,
      mergeGuest: boolean
    ) => {
      if (loadInFlightRef.current || !isMounted) return
      loadInFlightRef.current = true

      userIdRef.current = nextUserId
      setUserId(nextUserId)

      let guestItems: CartItem[] = []
      if (mergeGuest) {
        guestItems = readGuestCart().items
        if (guestItems.length > 0) {
          clearGuestCart()
        }
      }

      try {
        const snapshot =
          guestItems.length > 0
            ? await requestCartSnapshot("POST", {
                action: "merge",
                guestItems,
              })
            : await requestCartSnapshot("GET")

        if (!isMounted) return

        applySnapshot(snapshot)
        clearGuestCart()
      } catch {
        if (!isMounted) return
        if (mergeGuest && guestItems.length > 0) {
          writeGuestCart(guestItems)
          setItems(guestItems)
        }
      } finally {
        loadInFlightRef.current = false
      }
    }

    const init = async () => {
      if (!isMounted) return
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (!user) {
        userIdRef.current = null
        const snapshot = readGuestCart()
        setItems(snapshot.items)
        setUserId(null)
        setIsLoading(false)
        return
      }

      try {
        await loadAuthenticatedCart(user.id, false)
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    }

    const initFrame = requestAnimationFrame(() => {
      void init()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return

      queueMicrotask(() => {
        if (!isMounted) return

        if (event === "SIGNED_IN" && session?.user) {
          void loadAuthenticatedCart(session.user.id, true)
          return
        }

        if (event === "SIGNED_OUT") {
          userIdRef.current = null
          setUserId(null)
          setItems(readGuestCart().items)
        }
      })
    })

    return () => {
      isMounted = false
      cancelAnimationFrame(initFrame)
      subscription.unsubscribe()
    }
  }, [applySnapshot])

  const persistGuest = useCallback((next: CartItem[]) => {
    if (!userIdRef.current) {
      writeGuestCart(next)
    }
  }, [])

  const addItem = useCallback(
    async (item: CartItem) => {
      setItems((prev) => {
        const merged = mergeCartItems(prev, [item])
        persistGuest(merged)
        return merged
      })

      if (userIdRef.current) {
        try {
          const snapshot = await requestCartSnapshot("POST", {
            action: "add",
            item,
          })
          applySnapshot(snapshot)
          clearGuestCart()
        } catch {
          // se reintentara en la siguiente mutacion
        }
      }
    },
    [applySnapshot, persistGuest]
  )

  const removeItem = useCallback(
    async (variantId: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.variantId !== variantId)
        persistGuest(next)
        return next
      })

      if (userIdRef.current) {
        clearGuestCart()
        try {
          const snapshot = await requestCartSnapshot("DELETE", { variantId })
          applySnapshot(snapshot)
        } catch {
          // ignore
        }
      }
    },
    [applySnapshot, persistGuest]
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

      if (userIdRef.current) {
        try {
          const snapshot = await requestCartSnapshot("PATCH", {
            variantId,
            quantity,
          })
          applySnapshot(snapshot)
          clearGuestCart()
        } catch {
          // ignore
        }
      }
    },
    [applySnapshot, persistGuest, removeItem]
  )

  const adjustItem = useCallback(
    (variantId: string, delta: number, min = 1) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.variantId !== variantId
            ? item
            : { ...item, quantity: Math.max(min, item.quantity + delta) }
        )
        persistGuest(next)
        return next
      })

      if (!userIdRef.current) return

      const existing = debounceApiRef.current.get(variantId)
      if (existing !== undefined) clearTimeout(existing)

      const timer = setTimeout(() => {
        debounceApiRef.current.delete(variantId)
        const current = itemsRef.current.find((i) => i.variantId === variantId)
        if (!current) return
        requestCartSnapshot("PATCH", { variantId, quantity: current.quantity })
          .then(applySnapshot)
          .catch(() => {})
      }, 400)

      debounceApiRef.current.set(variantId, timer)
    },
    [applySnapshot]
  )

  const clearCart = useCallback(async () => {
    setItems([])
    clearGuestCart()

    if (userIdRef.current) {
      try {
        const snapshot = await requestCartSnapshot("DELETE", {
          clearAll: true,
        })
        applySnapshot(snapshot)
      } catch {
        // ignore
      }
    }
  }, [applySnapshot])

  const dismissRemovedNotification = useCallback(() => {
    setRemovedCount(0)
  }, [])

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
    removedCount,
    addItem,
    removeItem,
    updateQuantity,
    adjustItem,
    clearCart,
    openCart,
    closeCart,
    isProgrammatic,
    clearProgrammatic,
    dismissRemovedNotification,
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
