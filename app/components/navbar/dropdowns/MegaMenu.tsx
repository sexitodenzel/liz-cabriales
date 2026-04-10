/* eslint-disable react-hooks/set-state-in-effect */
"use client"

/* =========================================
   UI DEL MEGA MENU 
   ========================================= */

import Link from "next/link"
import { useEffect, useState } from "react"

type MenuColumn = {
  title: string
  items: string[]
}

type MegaMenuProps = {
  activeMenu: string | null
  currentMenu: {
    col1: MenuColumn
    col2: MenuColumn
    col3: MenuColumn
  } | null
}

function megaMenuItemHref(label: string): "/tienda" | "/inspiracion" {
  if (label === "Inspiración") return "/inspiracion"
  return "/tienda"
}

export default function MegaMenu({ activeMenu, currentMenu }: MegaMenuProps) {
  const isOpen = Boolean(currentMenu)

  const columns: Array<{ delayMs: number; col: MenuColumn | undefined }> = [
    { delayMs: 0, col: currentMenu?.col1 },
    { delayMs: 150, col: currentMenu?.col2 },
    { delayMs: 300, col: currentMenu?.col3 },
  ]

  const visibleColumns = columns.filter(
    (entry): entry is { delayMs: number; col: MenuColumn } =>
      entry.col != null && entry.col.items.length > 0
  )

  const gridColsClass =
    visibleColumns.length >= 3
      ? "md:grid-cols-3"
      : visibleColumns.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1"

  const [contentOpen, setContentOpen] = useState(false)

  useEffect(() => {
    if (!currentMenu) {
      setContentOpen(false)
      return
    }

    setContentOpen(false)

    const raf = requestAnimationFrame(() => {
      setContentOpen(true)
    })

    return () => cancelAnimationFrame(raf)
  }, [activeMenu, currentMenu])

  return (
    <div
      className={`
      absolute left-0 top-full w-full z-40
      bg-white
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }
    `}
    >
      <div
        className={`mx-auto grid max-w-[1400px] grid-cols-1 gap-20 px-6 py-14 transition-all duration-300 ease-out ${gridColsClass}`}
      >
        {visibleColumns.map(({ delayMs, col }) => (
          <div
            key={delayMs}
            className={`transition-all duration-500 ease-out ${
              contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${delayMs}ms` }}
          >
            {col.title ? (
              <p
                className={`mb-6 text-sm text-gray-400 transition-all duration-500 ease-out ${
                  contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${delayMs}ms` }}
              >
                {col.title}
              </p>
            ) : null}

            <ul className="space-y-3 text-[18px]">
              {col.items.map((item, idx) => (
                <li
                  key={`${col.title}-${item}`}
                  className={`transition-all duration-500 ease-out ${
                    contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                  style={{ transitionDelay: `${delayMs + 90 + idx * 45}ms` }}
                >
                  <Link
                    href={megaMenuItemHref(item)}
                    className="block text-inherit transition-colors hover:text-[#C6A75E]"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}