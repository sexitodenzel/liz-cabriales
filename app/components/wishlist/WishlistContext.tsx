"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

const STORAGE_KEY = "lc_wishlist"

type WishlistCtx = {
  slugs: string[]
  toggle: (slug: string) => void
  has: (slug: string) => boolean
  count: number
  hydrated: boolean
}

const WishlistContext = createContext<WishlistCtx>({
  slugs: [],
  toggle: () => {},
  has: () => false,
  count: 0,
  hydrated: false,
})

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSlugs(JSON.parse(stored) as string[])
    } catch {
      // noop
    }
    setHydrated(true)
  }, [])

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs])

  return (
    <WishlistContext.Provider
      value={{ slugs, toggle, has, count: slugs.length, hydrated }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}
