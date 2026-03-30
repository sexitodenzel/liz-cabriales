export type CartItem = {
  productId: string
  variantId: string
  quantity: number
  price: number
  name: string
  brand: string | null
  image: string | null
}

export type GuestCartSnapshot = {
  items: CartItem[]
  updatedAt: string
}

const STORAGE_KEY = "liz_cart"

export function readGuestCart(): GuestCartSnapshot {
  if (typeof window === "undefined") {
    return { items: [], updatedAt: new Date(0).toISOString() }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { items: [], updatedAt: new Date(0).toISOString() }
    }
    const parsed = JSON.parse(raw) as GuestCartSnapshot
    if (!Array.isArray(parsed.items)) {
      return { items: [], updatedAt: new Date(0).toISOString() }
    }
    return parsed
  } catch {
    return { items: [], updatedAt: new Date(0).toISOString() }
  }
}

export function writeGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return
  const snapshot: GuestCartSnapshot = {
    items,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function mergeCartItems(
  a: CartItem[],
  b: CartItem[]
): CartItem[] {
  const map = new Map<string, CartItem>()

  const addAll = (items: CartItem[]) => {
    for (const item of items) {
      const key = item.variantId
      const existing = map.get(key)
      if (existing) {
        map.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        })
      } else {
        map.set(key, { ...item })
      }
    }
  }

  addAll(a)
  addAll(b)

  return Array.from(map.values())
}

export function computeItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function computeSubtotal(items: CartItem[]): number {
  return items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  )
}

