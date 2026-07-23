"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "left" | "right"
  children: ReactNode
  className?: string
  backdropClassName?: string
  ariaLabel?: string
  dismissable?: boolean
  /** Monta el DOM en idle para que la 1ª apertura solo anime CSS. */
  preload?: boolean
}

/** Alineado con EASE_DRAWER — compositor CSS, sin JS por frame. */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const DURATION_MS = 300

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true,
  preload = false,
}: DrawerProps) {
  const [portalReady, setPortalReady] = useState(false)
  // Tras la 1ª apertura (o preload) el DOM se queda vivo: abrir/cerrar = CSS.
  const [mountedPanel, setMountedPanel] = useState(false)
  const [entered, setEntered] = useState(false)
  const [paint, setPaint] = useState(true)
  const panelRef = useRef<HTMLElement>(null)
  const enterRaf = useRef<number | null>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!preload || mountedPanel) return
    const warm = () => setMountedPanel(true)
    const timeoutId = setTimeout(warm, 600)
    return () => clearTimeout(timeoutId)
  }, [preload, mountedPanel])

  useEffect(() => {
    if (open) {
      setMountedPanel(true)
      setPaint(true)
      setEntered(false)
      if (enterRaf.current != null) cancelAnimationFrame(enterRaf.current)
      // 2× rAF: asegura el frame “fuera” antes de pedir el slide.
      enterRaf.current = requestAnimationFrame(() => {
        enterRaf.current = requestAnimationFrame(() => {
          enterRaf.current = null
          setEntered(true)
        })
      })
      return () => {
        if (enterRaf.current != null) cancelAnimationFrame(enterRaf.current)
      }
    }

    setEntered(false)
    return
  }, [open])

  // Scroll lock ligero (sin position:fixed → evita reflow de toda la página).
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus({ preventScroll: true })
    }, DURATION_MS)

    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(focusTimer)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [open, onOpenChange])

  const onPanelTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return
      if (e.propertyName !== "transform") return
      if (!open) setPaint(false)
    },
    [open],
  )

  if (!portalReady || !mountedPanel) return null

  const isOpen = entered
  const closed = !open && !entered

  const content = (
    <div
      className={cn("fixed inset-0 z-50", closed && "pointer-events-none")}
      aria-hidden={closed}
      style={closed && !paint ? { visibility: "hidden" } : undefined}
    >
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={dismissable && open ? 0 : -1}
        onClick={() => dismissable && onOpenChange(false)}
        className={cn(
          "absolute inset-0 h-full w-full cursor-default bg-black/40",
          "transition-opacity duration-300 motion-reduce:transition-none",
          isOpen ? "opacity-100" : "opacity-0",
          backdropClassName,
        )}
        style={{ transitionTimingFunction: EASE }}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label={ariaLabel}
        onTransitionEnd={onPanelTransitionEnd}
        className={cn(
          "absolute inset-y-0 flex w-80 max-w-[85vw] flex-col overflow-hidden bg-white shadow-xl",
          "transform-gpu will-change-transform backface-hidden",
          "transition-transform duration-300 motion-reduce:transition-none",
          side === "right"
            ? "right-0 border-l border-neutral-200"
            : "left-0 border-r border-neutral-200",
          side === "right"
            ? isOpen
              ? "translate-x-0"
              : "translate-x-full"
            : isOpen
              ? "translate-x-0"
              : "-translate-x-full",
          className,
        )}
        style={{
          transitionTimingFunction: EASE,
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
      </aside>
    </div>
  )

  return createPortal(content, document.body)
}
