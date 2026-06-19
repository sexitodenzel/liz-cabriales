"use client"

import { useEffect } from "react"

const SNAP_CLASS = "home-snap-active"

function syncSnapClass() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const isDesktop = window.matchMedia("(min-width: 768px)").matches
  document.documentElement.classList.toggle(SNAP_CLASS, !reducedMotion && isDesktop)
}

export default function HomeScrollSnap() {
  useEffect(() => {
    syncSnapClass()

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const desktop = window.matchMedia("(min-width: 768px)")
    const onChange = () => syncSnapClass()
    reducedMotion.addEventListener("change", onChange)
    desktop.addEventListener("change", onChange)

    return () => {
      document.documentElement.classList.remove(SNAP_CLASS)
      reducedMotion.removeEventListener("change", onChange)
      desktop.removeEventListener("change", onChange)
    }
  }, [])

  return null
}
