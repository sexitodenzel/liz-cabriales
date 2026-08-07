"use client"

/** Búsquedas recientes de la visitante (solo en su navegador). */

const STORAGE_KEY = "lc:recent-searches"
const MAX_ITEMS = 6

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function pushRecentSearch(query: string): string[] {
  const trimmed = query.trim()
  if (typeof window === "undefined" || trimmed.length < 2) {
    return readRecentSearches()
  }
  const current = readRecentSearches()
  const next = [
    trimmed,
    ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_ITEMS)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* Modo privado / cuota llena: las recientes son un extra, no se rompe nada. */
  }
  return next
}

export function clearRecentSearches(): string[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* idem */
    }
  }
  return []
}
