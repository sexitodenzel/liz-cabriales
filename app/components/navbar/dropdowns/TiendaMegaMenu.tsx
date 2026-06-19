/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { TiendaCategory } from "../menuData"
import { RECENT_PRODUCTS_CATEGORY_SLUG } from "@/lib/navbar/recent-products"

type TiendaMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  categories: TiendaCategory[]
  sectionHref: string
  recentProductsLoading?: boolean
}

export default function TiendaMegaMenu({
  isOpen,
  onClose,
  categories,
  sectionHref,
  recentProductsLoading = false,
}: TiendaMegaMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState(0)
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setContentVisible(false)
      setHoveredIndex(0)
      return
    }
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  return (
    <div
      style={{ top: "var(--navbar-actual-h)" }}
      className={`
        fixed left-0 right-0 z-40
        bg-white border-t border-neutral-200
        transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
        ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-10 flex gap-0">

        {/* Panel izquierdo: lista de categorías */}
        <div
          className={`
            w-56 shrink-0 border-r border-neutral-200 pr-6
            transition-all duration-500 ease-out
            ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="mb-4">
            <Link
              href={sectionHref}
              className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 hover:text-[#C6A75E] transition-colors"
            >
              Categorías
            </Link>
          </div>
          <ul className="space-y-0.5">
            {categories.map((cat, idx) => (
              <li key={cat.slug}>
                <Link
                  href={cat.href}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onFocus={() => setHoveredIndex(idx)}
                  className={`
                    block rounded-md px-3 py-2
                    text-[14px] transition-all duration-150
                    ${hoveredIndex === idx
                      ? "bg-neutral-100 text-[#C6A75E]"
                      : "text-[#1a1a1a] hover:text-[#C6A75E]"
                    }
                  `}
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Panel derecho: subcategorías de la categoría activa */}
        <div className="relative flex-1 pl-10 min-h-[280px]">
          {categories.map((cat, idx) => (
            <div
              key={cat.slug}
              className={`
                transition-all duration-300 ease-out
                ${hoveredIndex === idx
                  ? "opacity-100 translate-y-0"
                  : "absolute inset-0 opacity-0 translate-y-2 pointer-events-none"
                }
              `}
            >
              <div className="mb-5">
                <Link
                  href={cat.href}
                  className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 hover:text-[#C6A75E] transition-colors"
                >
                  {cat.label}
                </Link>
              </div>
              <ul
                className={`grid gap-x-10 gap-y-0.5 ${
                  cat.slug === RECENT_PRODUCTS_CATEGORY_SLUG
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-2"
                }`}
              >
                {cat.slug === RECENT_PRODUCTS_CATEGORY_SLUG &&
                recentProductsLoading &&
                cat.subcategories.length === 0 ? (
                  <li className="col-span-full py-2 text-[14px] text-neutral-400">
                    Cargando productos recientes…
                  </li>
                ) : cat.slug === RECENT_PRODUCTS_CATEGORY_SLUG &&
                  !recentProductsLoading &&
                  cat.subcategories.length === 0 ? (
                  <li className="col-span-full py-2 text-[14px] text-neutral-400">
                    Aún no hay productos recientes.
                  </li>
                ) : (
                  cat.subcategories.map((sub, subIdx) => (
                    <li
                      key={`${sub.href}-${sub.label}`}
                      className={`
                      transition-all duration-300 ease-out
                      ${contentVisible && hoveredIndex === idx
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-3"
                      }
                    `}
                      style={{ transitionDelay: `${subIdx * 35}ms` }}
                    >
                      <Link
                        href={sub.href}
                        className="block py-2 text-[15px] text-[#1a1a1a] transition-colors hover:text-[#C6A75E] line-clamp-2"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
