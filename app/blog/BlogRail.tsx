"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Riel horizontal deslizable para las tarjetas del blog (estilo OPI en
 * desktop). Scroll nativo con snap + botones de flecha en pantallas medianas.
 * En móvil se desliza con el dedo y las flechas se ocultan.
 */
export default function BlogRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setAtStart(el.scrollLeft <= 2)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [update])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" })
  }

  return (
    <div className="group/rail relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Flecha izquierda */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scroll(-1)}
        className={`absolute left-1 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6ddc7] bg-ivory/90 text-[#8a6d26] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#c6a75e] hover:bg-ivory sm:flex ${
          atStart ? "pointer-events-none opacity-0" : "opacity-0 group-hover/rail:opacity-100"
        }`}
      >
        <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="h-3 w-[18px] rotate-180" aria-hidden>
          <path d="M0 6 H18 M13 1 L18 6 L13 11" />
        </svg>
      </button>

      {/* Flecha derecha */}
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scroll(1)}
        className={`absolute right-1 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6ddc7] bg-ivory/90 text-[#8a6d26] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#c6a75e] hover:bg-ivory sm:flex ${
          atEnd ? "pointer-events-none opacity-0" : "opacity-0 group-hover/rail:opacity-100"
        }`}
      >
        <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="h-3 w-[18px]" aria-hidden>
          <path d="M0 6 H18 M13 1 L18 6 L13 11" />
        </svg>
      </button>
    </div>
  )
}
