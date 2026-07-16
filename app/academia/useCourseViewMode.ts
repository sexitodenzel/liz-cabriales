"use client"

import { useEffect, useState } from "react"

export type CourseViewMode = "grid" | "list" | "calendar"

const STORAGE_KEY = "academia-view-mode"

export function useCourseViewMode() {
  const [viewMode, setViewMode] = useState<CourseViewMode>("grid")

  // Lectura diferida de localStorage tras montar: el estado inicial es "grid"
  // (igual que el SSR) y se corrige en el cliente para no romper la hidratación.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "grid" || stored === "list" || stored === "calendar") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón hidratación-safe intencional
      setViewMode(stored)
    }
  }, [])

  const updateViewMode = (mode: CourseViewMode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return { viewMode, setViewMode: updateViewMode }
}
