/* eslint-disable react-hooks/set-state-in-effect */
"use client"

/* =========================================
   UI DEL MEGA MENU 
   ========================================= */

import { useEffect, useState } from "react"
import Link from "next/link"
import type { MenuItem } from "../menuData"

type MenuColumn = {
  title: string
  items: MenuItem[]
}

type MegaMenuProps = {
  activeMenu: string | null
  currentMenu: {
    col1: MenuColumn
    col2: MenuColumn
    col3: MenuColumn
  } | null
}

export default function MegaMenu({ activeMenu, currentMenu }: MegaMenuProps) {
  const isOpen = Boolean(currentMenu)

  const columns: Array<{ delayMs: number; col: MenuColumn | undefined }> = [
    { delayMs: 0, col: currentMenu?.col1 },
    { delayMs: 150, col: currentMenu?.col2 },
    { delayMs: 300, col: currentMenu?.col3 },
  ]

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
      bg-[#0a0a0a] border-t border-white/10
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${
        isOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }
    `}
    >
      <div
        className="site-container py-14 grid grid-cols-3 gap-20 transition-all duration-300 ease-out"
      >
        {columns.map(({ delayMs, col }) => (
          <div
            key={delayMs}
            className={`transition-all duration-500 ease-out ${
              contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${delayMs}ms` }}
          >
            <p
              className={`mb-6 text-sm text-neutral-500 transition-all duration-500 ease-out ${
                contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
              style={{ transitionDelay: `${delayMs}ms` }}
            >
              {col?.title}
            </p>

            <ul className="space-y-3 text-[18px] text-neutral-300">
              {col?.items?.map((item, idx) => (
                <li
                  key={`${col?.title ?? delayMs}-${item.label}`}
                  className={`transition-all duration-500 ease-out ${
                    contentOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                  style={{ transitionDelay: `${delayMs + 90 + idx * 45}ms` }}
                >
                  <Link
                    href={item.href}
                    className="transition-colors duration-200 hover:text-[#c9a84c]"
                  >
                    {item.label}
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