/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { TiendaCategory } from "../menuData"

type TiendaMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  categories: TiendaCategory[]
  sectionHref: string
}

export default function TiendaMegaMenu({ isOpen, onClose, categories, sectionHref }: TiendaMegaMenuProps) {
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
      className={`
        absolute left-0 top-full w-full z-40
        bg-[#0a0a0a] border-t border-white/10
        transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
        ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-10 flex gap-0">

        {/* Panel izquierdo: lista de categorías */}
        <div
          className={`
            w-56 shrink-0 border-r border-white/10 pr-6
            transition-all duration-500 ease-out
            ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">
              Categorías
            </p>
            <Link
              href={sectionHref}
              className="text-[11px] text-[#C6A75E]/60 hover:text-[#C6A75E] transition-colors"
            >
              Ver todo →
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
                    group flex items-center justify-between rounded-md px-3 py-2
                    text-[14px] transition-all duration-150
                    ${hoveredIndex === idx
                      ? "bg-white/5 text-[#C6A75E]"
                      : "text-neutral-300 hover:text-[#C6A75E]"
                    }
                  `}
                >
                  <span>{cat.label}</span>
                  <ChevronRight
                    className={`
                      h-3 w-3 shrink-0 transition-all duration-200
                      ${hoveredIndex === idx
                        ? "opacity-100 translate-x-0 text-[#C6A75E]"
                        : "opacity-0 -translate-x-1"
                      }
                    `}
                  />
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
              <div className="flex items-baseline gap-3 mb-5">
                <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                  {cat.label}
                </p>
                <Link
                  href={cat.href}
                  className="text-[11px] text-[#C6A75E]/70 hover:text-[#C6A75E] transition-colors"
                >
                  Ver todo →
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-x-10 gap-y-0.5">
                {cat.subcategories.map((sub, subIdx) => (
                  <li
                    key={sub.label}
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
                      className="block py-2 text-[15px] text-neutral-400 transition-colors hover:text-[#C6A75E]"
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
