/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { TiendaCategory } from "../menuData"
import { RECENT_PRODUCTS_CATEGORY_SLUG } from "@/lib/navbar/recent-products"

const MAX_RECENT_PRODUCTS_DESKTOP = 6

type DesktopMegaMenuProps = {
  isOpen: boolean
  categories: TiendaCategory[]
  sectionHref: string
  sectionLabel: string
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function DesktopMegaMenu({
  isOpen,
  categories,
  sectionHref,
  sectionLabel,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: DesktopMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // No reseteamos contentVisible: dejamos que el fade del outer oculte todo
      // como una unidad. Esto evita el "vacío" cuando saltas entre tabs.
      return
    }
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
            href={sectionHref}
            onClick={onClose}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a84c] hover:opacity-80 transition-opacity"
          >
            Ver {sectionLabel}
          </Link>
        </div>

        {(() => {
          const withSubs = categories.filter((c) => c.subcategories.length > 0)
          const withoutSubs = categories.filter((c) => c.subcategories.length === 0)

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
              {withSubs.map((cat, idx) => {
                const isRecent = cat.slug === RECENT_PRODUCTS_CATEGORY_SLUG
                const visibleSubs = isRecent
                  ? cat.subcategories.slice(0, MAX_RECENT_PRODUCTS_DESKTOP)
                  : cat.subcategories
                const hasMore = isRecent && cat.subcategories.length > MAX_RECENT_PRODUCTS_DESKTOP
                return (
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
                      className="block mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a] hover:text-[#c9a84c] transition-colors"
                    >
                      {cat.label}
                    </Link>
                    <ul className="space-y-2">
                      {visibleSubs.map((sub) => (
                        <li key={sub.label}>
                          <Link
                            href={sub.href}
                            onClick={onClose}
                            className="block text-[14px] text-neutral-700 hover:text-[#c9a84c] transition-colors line-clamp-1"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                      {hasMore && (
                        <li>
                          <Link
                            href={cat.href}
                            onClick={onClose}
                            className="block pt-1 text-[13px] font-medium text-[#c9a84c] hover:opacity-80 transition-opacity"
                          >
                            Ver todos los nuevos →
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                )
              })}

              {withoutSubs.length > 0 && (
                <div
                  className={`
                    transition-opacity duration-300 ease-out
                    ${contentVisible ? "opacity-100" : "opacity-0"}
                  `}
                  style={{ transitionDelay: `${withSubs.length * 30}ms` }}
                >
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]">
                    Más en tienda
                  </p>
                  <ul className="space-y-2">
                    {withoutSubs.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={cat.href}
                          onClick={onClose}
                          className="block text-[14px] text-neutral-700 hover:text-[#c9a84c] transition-colors line-clamp-1"
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
