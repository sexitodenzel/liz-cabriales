"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

const STORAGE_KEY = "lc_nail_art_favorites"

type NailArtFavoritesCtx = {
  ids: string[]
  toggle: (postId: string) => boolean
  setFavorited: (postId: string, favorited: boolean) => void
  has: (postId: string) => boolean
  clearAll: () => void
  count: number
  hydrated: boolean
}

const NailArtFavoritesContext = createContext<NailArtFavoritesCtx>({
  ids: [],
  toggle: () => false,
  setFavorited: () => {},
  has: () => false,
  clearAll: () => {},
  count: 0,
  hydrated: false,
})

function persist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // noop
  }
}

function syncServer(postId: string, favorited: boolean) {
  // Best-effort; ignora 401 si no hay sesión
  void fetch("/api/nail-art/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId, favorited }),
  }).catch(() => {})
}

export function NailArtFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as unknown
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((id): id is string => typeof id === "string"))
        }
      }
    } catch {
      // noop
    }
    setHydrated(true)
  }, [])

  const setFavorited = useCallback((postId: string, favorited: boolean) => {
    setIds((prev) => {
      const exists = prev.includes(postId)
      if (favorited && exists) return prev
      if (!favorited && !exists) return prev
      const next = favorited ? [...prev, postId] : prev.filter((id) => id !== postId)
      persist(next)
      return next
    })
    syncServer(postId, favorited)
  }, [])

  const toggle = useCallback((postId: string) => {
    let nextFavorited = false
    setIds((prev) => {
      nextFavorited = !prev.includes(postId)
      const next = nextFavorited ? [...prev, postId] : prev.filter((id) => id !== postId)
      persist(next)
      return next
    })
    syncServer(postId, nextFavorited)
    return nextFavorited
  }, [])

  const has = useCallback((postId: string) => ids.includes(postId), [ids])

  const clearAll = useCallback(() => {
    setIds([])
    persist([])
  }, [])

  return (
    <NailArtFavoritesContext.Provider
      value={{
        ids,
        toggle,
        setFavorited,
        has,
        clearAll,
        count: ids.length,
        hydrated,
      }}
    >
      {children}
    </NailArtFavoritesContext.Provider>
  )
}

export function useNailArtFavorites() {
  return useContext(NailArtFavoritesContext)
}
