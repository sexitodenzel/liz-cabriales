"use client"

import { useEffect, useState } from "react"

export type ProductViewMode = "grid" | "list"

const STORAGE_KEY = "tienda-view-mode"

export function useProductViewMode() {
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "grid" || stored === "list") {
      setViewMode(stored)
    }
  }, [])

  const updateViewMode = (mode: ProductViewMode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return { viewMode, setViewMode: updateViewMode }
}
