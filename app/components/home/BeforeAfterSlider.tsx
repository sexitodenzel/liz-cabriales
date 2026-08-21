"use client"

import { useCallback, useRef, useState } from "react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import type { BeforeAfterItem } from "@/lib/supabase/before-after"

/* Comparador antes/después: la foto de "después" está encimada sobre la de
   "antes" y se recorta con clip-path según la posición del control. Arrastrar
   (mouse/touch vía Pointer Events) o usar las flechas de teclado con el
   control enfocado (role="slider"). Sin librerías externas. */

const STEP = 5

type Props = {
  item: BeforeAfterItem
  index: number
}

export default function BeforeAfterSlider({ item, index }: Props) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    setPosition(Math.min(100, Math.max(0, ratio * 100)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    updateFromClientX(e.clientX)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      setPosition((p) => Math.max(0, p - STEP))
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      setPosition((p) => Math.min(100, p + STEP))
    } else if (e.key === "Home") {
      e.preventDefault()
      setPosition(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setPosition(100)
    }
  }

  return (
    <div
      className="lc-card w-[78vw] max-w-[340px] shrink-0 snap-start sm:w-[340px]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        ref={containerRef}
        className="group relative touch-none select-none overflow-hidden rounded-xl bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(20,20,20,0.06)]"
        style={{ aspectRatio: "4/5" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Base: "antes" */}
        <SmoothImage
          src={item.before_image_url}
          alt={item.caption ? `Antes — ${item.caption}` : "Antes"}
          fill
          className="pointer-events-none object-cover"
          sizes="(max-width: 640px) 78vw, 340px"
        />

        {/* Encima, recortada: "después" */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <SmoothImage
            src={item.after_image_url}
            alt={item.caption ? `Después — ${item.caption}` : "Después"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 78vw, 340px"
          />
        </div>

        {/* Etiquetas fijas */}
        <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm">
          Antes
        </span>
        <span className="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-full bg-ink/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
          Después
        </span>

        {/* Línea + control arrastrable */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={
            item.caption ? `Comparar antes y después — ${item.caption}` : "Comparar antes y después"
          }
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/5 outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-gold active:scale-95"
          style={{ left: `${position}%` }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M8 7L4 12L8 17M16 7L20 12L16 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {(item.service_label || item.caption) && (
        <div className="pt-3">
          {item.service_label && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              {item.service_label}
            </p>
          )}
          {item.caption && (
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink-soft">
              {item.caption}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
