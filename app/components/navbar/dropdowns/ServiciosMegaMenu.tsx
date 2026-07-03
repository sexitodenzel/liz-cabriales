/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import type { TiendaCategory } from "../menuData"

type ServiciosMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function ServiciosMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: ServiciosMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [categories, setCategories] = useState<TiendaCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setLoading(true)
    void fetch("/api/navbar/servicios-menu")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: TiendaCategory[] } | null) => {
        if (!isMounted) return
        setCategories(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => {
        if (isMounted) setCategories([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setContentVisible(false)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ maxHeight: "calc(100vh - var(--navbar-actual-h) - 80px)" }}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        overflow-y-auto bg-white border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div className="site-container py-10">
        <div className="mb-6">
          <Link
            href="/servicios"
            onClick={onClose}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A75E] hover:opacity-80 transition-opacity"
          >
            Ver servicios
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-24 animate-pulse rounded-sm bg-neutral-100" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="h-3 w-full max-w-[180px] animate-pulse rounded-sm bg-neutral-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, idx) => (
              <div
                key={cat.slug}
                className={`
                  transition-opacity duration-300 ease-out
                  ${contentVisible ? "opacity-100" : "opacity-0"}
                `}
                style={{ transitionDelay: `${idx * 30}ms` }}
              >
                <Link
                  href={cat.href}
                  onClick={onClose}
                  className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a] hover:text-[#C6A75E] transition-colors"
                >
                  {cat.label}
                </Link>
                <ul className="space-y-2">
                  {cat.subcategories.map((sub) => (
                    <li key={`${cat.slug}-${sub.label}`}>
                      <Link
                        href={sub.href}
                        onClick={onClose}
                        className="block text-[14px] text-neutral-700 hover:text-[#C6A75E] transition-colors line-clamp-2"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
