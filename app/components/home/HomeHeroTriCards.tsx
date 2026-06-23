"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

type Card = {
  href: string
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  image: string
  alt: string
}

const CENTER: Card = {
  href: "/tienda",
  eyebrow: "Tienda profesional",
  title: "Los productos que usan las profesionales",
  subtitle: "Cosmetología de salón, ahora a un clic.",
  cta: "Descubrir",
  image:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
  alt: "Productos de cosmetología profesional",
}

const LEFT: Card = {
  href: "/academia",
  eyebrow: "Academia",
  title: "Aprende con Liz",
  subtitle: "Cursos presenciales y online.",
  cta: "Ver cursos",
  image:
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
  alt: "Curso de cosmetología",
}

const RIGHT: Card = {
  href: "/servicios",
  eyebrow: "Cabina",
  title: "Agenda tu cita",
  subtitle: "Tratamientos faciales y estética.",
  cta: "Reservar",
  image:
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
  alt: "Servicios de cabina",
}

// Sección 180vh → 80vh de "scroll muerto" (sticky pin). Trackpad lo siente ~2s.
const SECTION_HEIGHT_VH = 180

// Easings y timings — más smooth/lentos para sensación premium
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const DUR_CENTER = 1100 // ms — compactado de la central
const DUR_SIDES = 1100 // ms — entrada/salida de laterales
const DELAY_SIDES = 600 // ms — al expandir, laterales esperan a que central avance

// Hysteresis: thresholds distintos para forward (down) y reverse (up).
// FORWARD_TRIGGER pequeño: cualquier scroll mínimo expande.
// REVERSE_TRIGGER_VH = 0.85: el reverse dispara cuando la sección vuelve a
// ser completamente visible (sticky re-engancha), no cuando scrollY=0.
const FORWARD_TRIGGER_PX = 5
const REVERSE_TRIGGER_VH = 0.85

export default function HomeHeroTriCards() {
  const [expanded, setExpanded] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const goingUp = y < lastYRef.current
      lastYRef.current = y

      const reverseThreshold = window.innerHeight * REVERSE_TRIGGER_VH

      // FORWARD: cualquier scroll past 5px expande
      if (y > FORWARD_TRIGGER_PX) {
        setExpanded((prev) => {
          if (prev) {
            // Ya está expandida — solo se colapsa si va hacia arriba y entra a la zona visible
            if (goingUp && y < reverseThreshold) return false
            return true
          }
          // No expandida — expandir
          return true
        })
        return
      }

      // Al tope absoluto: colapsar
      setExpanded(false)
    }

    // Estado inicial al montar
    if (window.scrollY > FORWARD_TRIGGER_PX) {
      setExpanded(true)
    }
    lastYRef.current = window.scrollY

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // CSS-driven (no scroll scrubbing) — cualquier scroll dispara la animación completa.
  // El "scroll muerto" lo da la sección sticky de 180vh.
  const centerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: "100%",
    width: expanded ? "32%" : "100%",
    left: expanded ? "34%" : "0%",
    transition: `width ${DUR_CENTER}ms ${EASE}, left ${DUR_CENTER}ms ${EASE}`,
    // Forward: central va primero. Reverse: central espera a que laterales se vayan.
    transitionDelay: expanded ? "0ms" : `${DELAY_SIDES}ms`,
    willChange: "width, left",
  }

  const sideBaseStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    height: "100%",
    width: "32%",
    [side]: 0,
    transform: expanded ? "translateY(0)" : "translateY(110%)",
    opacity: expanded ? 1 : 0,
    transition: `transform ${DUR_SIDES}ms ${EASE}, opacity ${DUR_SIDES}ms ${EASE}`,
    // Forward: laterales esperan ~450ms. Reverse: salen inmediatas.
    transitionDelay: expanded ? `${DELAY_SIDES}ms` : "0ms",
    willChange: "transform, opacity",
  })

  const titleStyle: React.CSSProperties = {
    transform: `scale(${expanded ? 0.55 : 1})`,
    transformOrigin: "center",
    transition: `transform ${DUR_CENTER}ms ${EASE}`,
    transitionDelay: expanded ? "0ms" : `${DELAY_SIDES}ms`,
  }

  return (
    <>
      {/* DESKTOP: sección alta para "scroll muerto" + sticky debajo del navbar */}
      <section
        aria-label="Tienda, academia y servicios"
        className="relative hidden md:block"
        style={{ height: `${SECTION_HEIGHT_VH}vh` }}
      >
        <div
          className="sticky w-full overflow-hidden bg-[var(--background)] px-3"
          style={{
            top: "var(--navbar-actual-h, 64px)",
            height: "calc(100vh - var(--navbar-actual-h, 64px))",
          }}
        >
          <div className="relative h-full w-full">
            <CardBlock card={LEFT} compact style={sideBaseStyle("left")} />
            <CardBlock card={RIGHT} compact style={sideBaseStyle("right")} />
            <CardBlock card={CENTER} hero style={centerStyle} titleStyle={titleStyle} />

            {/* Indicador scroll (visible solo al inicio) */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/80"
              style={{
                opacity: expanded ? 0 : 1,
                transition: `opacity 300ms ${EASE}`,
              }}
            >
              <span className="inline-block animate-pulse">↓ Desliza</span>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE: stacked sin animación */}
      <section
        aria-label="Tienda, academia y servicios"
        className="grid gap-3 px-4 py-4 md:hidden"
      >
        <CardBlock card={CENTER} hero className="h-[55vh]" />
        <div className="grid grid-cols-2 gap-3">
          <CardBlock card={LEFT} compact className="h-[40vh]" />
          <CardBlock card={RIGHT} compact className="h-[40vh]" />
        </div>
      </section>
    </>
  )
}

function CardBlock({
  card,
  hero = false,
  compact = false,
  style,
  className = "",
  titleStyle,
}: {
  card: Card
  hero?: boolean
  compact?: boolean
  style?: React.CSSProperties
  className?: string
  titleStyle?: React.CSSProperties
}) {
  return (
    <Link
      href={card.href}
      style={style}
      className={`group relative block overflow-hidden rounded-[2px] ${className}`}
    >
      <Image
        src={card.image}
        alt={card.alt}
        fill
        sizes={hero ? "(min-width: 768px) 95vw, 100vw" : "(min-width: 768px) 31vw, 50vw"}
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        priority={hero}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />

      {hero && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div style={titleStyle} className="flex flex-col items-center">
            <span className="mb-5 text-[11px] uppercase tracking-[0.32em] text-white/90">
              {card.eyebrow}
            </span>
            <h2 className="max-w-[14ch] text-balance font-[family-name:var(--font-cormorant-garamond)] text-4xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
              {card.title}
            </h2>
            <p className="mt-5 max-w-md text-sm text-white/85 md:text-base">
              {card.subtitle}
            </p>
            <span className="mt-8 inline-flex items-center gap-2 border-b border-white/70 pb-1 text-xs uppercase tracking-[0.28em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
              {card.cta}
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      )}

      {compact && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <span className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/80">
            {card.eyebrow}
          </span>
          <h3 className="font-[family-name:var(--font-cormorant-garamond)] text-2xl font-light leading-tight md:text-3xl">
            {card.title}
          </h3>
          <span className="mt-3 inline-flex w-fit items-center gap-2 border-b border-white/70 pb-0.5 text-[11px] uppercase tracking-[0.24em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
            {card.cta}
            <span aria-hidden>→</span>
          </span>
        </div>
      )}
    </Link>
  )
}
