"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

type Props = {
  title: string
  /** Si se define, el título enlaza a esta ruta. */
  titleHref?: string
  /** Línea secundaria bajo el título (opcional). */
  subtitle?: string
  /** Acción extra a la derecha, antes de las flechas (p. ej. "Ver todos →"). */
  action?: ReactNode
  /** Distancia de scroll por click de flecha. */
  step?: number
  className?: string
  children: ReactNode
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center bg-transparent text-[#0a0a0a] transition-colors hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  )
}

/**
 * Contenedor estándar de las secciones scrollables de la página de producto:
 * header uniforme (título + subtítulo + acciones) y rail horizontal con flechas.
 * Las cards se pasan como children para que cada sección conserve su identidad.
 */
export default function SectionCarousel({
  title,
  titleHref,
  subtitle,
  action,
  step = 280,
  className,
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  // Muestra la barra mientras hay scroll y la desvanece tras ~900ms de inactividad.
  const flashScrollbar = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.classList.add("is-scrolling")
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      el.classList.remove("is-scrolling")
    }, 900)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      updateScrollState()
      flashScrollbar()
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [updateScrollState, flashScrollbar])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    })
  }

  return (
    <section className={`mt-16${className ? ` ${className}` : ""}`}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {titleHref ? (
            <h2 className="text-xl font-semibold">
              <Link
                href={titleHref}
                className="transition-colors hover:text-[#a8862f]"
              >
                {title}
              </Link>
            </h2>
          ) : (
            <h2 className="text-xl font-semibold">{title}</h2>
          )}
          {subtitle ? (
            <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {action}
          <div className="flex gap-2">
            <ArrowButton
              dir="left"
              disabled={!canScrollLeft}
              onClick={() => scroll("left")}
            />
            <ArrowButton
              dir="right"
              disabled={!canScrollRight}
              onClick={() => scroll("right")}
            />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="lc-rail mt-6 flex gap-5 overflow-x-auto pb-3">
        {children}
      </div>

      <style jsx global>{`
        /* Firefox: barra fina, oculta por defecto, visible al scrollear. */
        .lc-rail {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .lc-rail.is-scrolling {
          scrollbar-color: rgba(10, 10, 10, 0.28) transparent;
        }
        /* WebKit/Blink: barra delgada, sin botones/flechas, thumb con fade. */
        .lc-rail::-webkit-scrollbar {
          height: 4px;
        }
        .lc-rail::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
        .lc-rail::-webkit-scrollbar-track {
          background: transparent;
        }
        .lc-rail::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 9999px;
          transition: background-color 400ms ease;
        }
        .lc-rail.is-scrolling::-webkit-scrollbar-thumb {
          background-color: rgba(10, 10, 10, 0.28);
        }
      `}</style>
    </section>
  )
}
