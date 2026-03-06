"use client"

/* =========================================
   DROPDOWN CONTAINER (Reusable Shell)
   - Positioning + animation + ESC close
   - Renders the active dropdown panel only
   ========================================= */

import React, { Children, isValidElement, useEffect, useMemo } from "react"
import type { MenuType } from "../Navbar"

export type DropdownRenderCtx = {
  isOpen: boolean
  close: () => void
}

type DropdownPanelKey = Exclude<MenuType, "Tienda" | "Cursos" | "Servicios" | null>

type DropdownPanelProps = {
  menu: DropdownPanelKey
  children: (ctx: DropdownRenderCtx) => React.ReactNode
}

const DropdownPanel: React.FC<DropdownPanelProps> = () => null

type DropdownContainerProps = {
  activeMenu: MenuType
  setActiveMenu: React.Dispatch<React.SetStateAction<MenuType>>
  children: React.ReactNode
}

export default function DropdownContainer({ activeMenu, setActiveMenu, children }: DropdownContainerProps) {
  const panels = useMemo(() => {
    const map = new Map<DropdownPanelKey, (ctx: DropdownRenderCtx) => React.ReactNode>()

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return
      const menu = child.props.menu as DropdownPanelKey | undefined
      if (!menu) return
      map.set(menu, child.props.children)
    })

    return map
  }, [children])

  const activePanelKey: DropdownPanelKey | null = panels.has(activeMenu as DropdownPanelKey)
    ? (activeMenu as DropdownPanelKey)
    : null

  const containerOpen = activePanelKey !== null

  useEffect(() => {
    if (!containerOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveMenu(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [containerOpen, setActiveMenu])

  const close = () => setActiveMenu(null)

  return (
    <div
      className={`
      absolute left-0 top-full w-full z-40 bg-white
      transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
      ${containerOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >
      <div className="relative">
        {Array.from(panels.entries()).map(([key, render]) => {
          const isOpen = activePanelKey === key

          return (
            <div
              key={key}
              className={isOpen ? "relative" : "absolute inset-0 pointer-events-none"}
              aria-hidden={!isOpen}
            >
              {render({ isOpen, close })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

DropdownContainer.Panel = DropdownPanel

