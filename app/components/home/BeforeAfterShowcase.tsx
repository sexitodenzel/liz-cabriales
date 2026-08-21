"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import BeforeAfterSlider from "./BeforeAfterSlider"
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/ui/icons"
import type { BeforeAfterItem } from "@/lib/supabase/before-after"

/* Vitrina "Antes y Después" del home: título + subtítulo editoriales a la
   izquierda, rail horizontal de comparadores deslizables a la derecha/abajo.
   Mismo patrón visual y de reveal escalonado que NailArtShowcase, sin
   pestañas (aquí no hay categorías, solo resultados). */

type Props = {
  items: BeforeAfterItem[]
  eyebrow?: string
  title: string
  subtitle?: string
  ctaHref?: string
  ctaLabel?: string
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export default function BeforeAfterShowcase({
  items,
  eyebrow,
  title,
  subtitle,
  ctaHref = "/servicios",
  ctaLabel = "Ver servicios y agenda tu cita",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (revealed) return
    const el = sectionRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      setRevealed(true)
      return
    }
    const fallback = window.setTimeout(() => setRevealed(true), 1600)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setRevealed(true)
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [revealed])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [])

  const scrollByViewport = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.82,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  return (
    <section ref={sectionRef} aria-labelledby="before-after-title">
      <div className="mb-8 flex flex-col gap-y-3 md:flex-row md:items-end md:justify-between md:gap-x-10">
        <div className="max-w-[640px]">
          {eyebrow && (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {eyebrow}
            </p>
          )}
          <h2
            id="before-after-title"
            className="font-sans text-[clamp(26px,3.4vw,38px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-[440px] text-[15px] leading-[1.5] text-ink-soft">
              {subtitle}
            </p>
          )}
        </div>

        {/* Flechas de apoyo en desktop cuando el rail desborda. */}
        <div className="hidden shrink-0 gap-1.5 md:flex">
          <button
            type="button"
            aria-label="Anterior"
            disabled={!canScrollLeft}
            onClick={() => scrollByViewport(-1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center bg-transparent text-ink transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            disabled={!canScrollRight}
            onClick={() => scrollByViewport(1)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center bg-transparent text-ink transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="mb-4 text-[12px] text-ink-soft/70 md:hidden">
        Desliza el control para comparar.
      </p>

      <div
        ref={scrollerRef}
        className={`lc-shopper-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide lg:gap-6 ${
          revealed ? "is-revealed" : ""
        }`}
      >
        {items.map((item, i) => (
          <BeforeAfterSlider key={item.id} item={item} index={i} />
        ))}
      </div>

      <div className="mt-7">
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-ink"
        >
          {ctaLabel}
          <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  )
}
