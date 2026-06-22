"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const CHROME_BOTTOM_VAR = "--site-chrome-bottom"
const NAVBAR_ID = "site-navbar"
const ANNOUNCEMENT_ID = "site-announcement-bar"

function measureChromeBottom(): number {
  const navbar = document.getElementById(NAVBAR_ID)
  if (!navbar) return 0
  const rect = navbar.getBoundingClientRect()
  return Math.round(Math.max(0, Math.min(window.innerHeight, rect.bottom)))
}

function syncChromeBottom() {
  document.documentElement.style.setProperty(
    CHROME_BOTTOM_VAR,
    `${measureChromeBottom()}px`,
  )
}

export default function SiteChromeMetrics() {
  const pathname = usePathname()

  useEffect(() => {
    syncChromeBottom()

    const observed = [
      document.getElementById(NAVBAR_ID),
      document.getElementById(ANNOUNCEMENT_ID),
    ].filter((el): el is HTMLElement => Boolean(el))

    const resizeObserver = new ResizeObserver(syncChromeBottom)
    for (const el of observed) {
      resizeObserver.observe(el)
    }

    window.addEventListener("scroll", syncChromeBottom, { passive: true })
    window.addEventListener("resize", syncChromeBottom)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("scroll", syncChromeBottom)
      window.removeEventListener("resize", syncChromeBottom)
    }
  }, [])

  useEffect(() => {
    syncChromeBottom()
    const raf = requestAnimationFrame(syncChromeBottom)
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}
