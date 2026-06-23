"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { Magnetic } from "@/app/components/ui/motion/magnetic"

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
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=75",
  alt: "Productos de cosmetología profesional",
}

const LEFT: Card = {
  href: "/academia",
  eyebrow: "Academia",
  title: "Capacítate con nosotros",
  subtitle: "Cursos presenciales y online.",
  cta: "Ver cursos",
  image:
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=75",
  alt: "Curso de cosmetología",
}

const RIGHT: Card = {
  href: "/servicios",
  eyebrow: "Cabina",
  title: "Agenda tu cita",
  subtitle: "Tratamientos faciales y estética.",
  cta: "Reservar",
  image:
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=75",
  alt: "Servicios de cabina",
}

// Sección 120vh → 20vh de "scroll muerto" (sticky pin). Reducido desde 180vh
// para minimizar la zona donde el user puede encadenar disparos. El lock
// previene interrupciones residuales.
const SECTION_HEIGHT_VH = 120

// Easings y timings — más smooth/lentos para sensación premium
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const DUR_CENTER = 1300 // ms — compactado de la central (forward)
const DUR_SIDES = 1300 // ms — entrada/salida de laterales (forward)
const DELAY_SIDES = 700 // ms — laterales esperan a que central avance (staging)

// Reverse animado pero más corto que forward.
const DUR_CENTER_REVERSE = 700
const DUR_SIDES_REVERSE = 700

// Hysteresis: thresholds distintos para forward (down) y reverse (up).
// REVERSE_TRIGGER_VH bajo (0.25) hace que reverse dispare cerca del top, cuando
// el sticky todavía está pinned y la sección no se está alejando con el scroll.
// Con 0.85 antes, el reverse arrancaba muy temprano y peleaba con el scroll.
const FORWARD_TRIGGER_PX = 5
const REVERSE_TRIGGER_VH = 0.25

export default function HomeHeroTriCards() {
  const [expanded, setExpanded] = useState(false)
  const [centerHover, setCenterHover] = useState(false)
  // animEnabled: cuando la sección está fuera del viewport, las transitions
  // se desactivan (snap). Si el user hace un scroll largo que saca la sección,
  // no queremos que el browser siga animando algo invisible mientras lucha
  // con el scroll. Snap libera CPU y el scroll fluye.
  const [animEnabled, setAnimEnabled] = useState(true)
  const sectionRef = useRef<HTMLElement | null>(null)
  const lastYRef = useRef(0)
  const tickingRef = useRef(false)
  // Lock: mientras una animación corre, evaluate() ignora todos los scrolls
  // (no bufferea). Al expirar el lock, re-evaluamos la posición ACTUAL del
  // scroll contra la posición donde estaba al inicio del lock — eso refleja
  // la intención general del usuario durante la animación (subió o bajó),
  // sin depender de eventos intermedios que puedan ser ruido.
  const animLockUntilRef = useRef(0)
  const lockStartYRef = useRef(0)
  const expandedRef = useRef(expanded)

  // computeTarget devuelve el estado deseado dada la (y actual, y previa).
  // - Si no hubo movimiento real (delta < MIN_INTENT_DELTA), mantiene el estado
  //   actual: evita que un re-eval post-lock dispare animación cuando el
  //   usuario está quieto en una posición no exactamente 0.
  // - Forward requiere scroll DOWN activo (no sólo y > threshold).
  // - Reverse requiere scroll UP activo Y posición debajo del threshold.
  const MIN_INTENT_DELTA = 5
  const computeTargetRef = useRef((_y: number, _prevY: number): boolean => false)
  computeTargetRef.current = (y, prevY) => {
    const delta = y - prevY
    if (Math.abs(delta) < MIN_INTENT_DELTA) return expandedRef.current
    const goingUp = delta < 0
    const reverseThreshold = window.innerHeight * REVERSE_TRIGGER_VH
    if (expandedRef.current) {
      // Expanded: solo cambia a reverse si va UP y está debajo del threshold.
      if (goingUp && y < reverseThreshold) return false
      return true
    }
    // Not expanded: solo cambia a forward si va DOWN y pasa FORWARD_TRIGGER_PX.
    if (!goingUp && y > FORWARD_TRIGGER_PX) return true
    return false
  }

  useEffect(() => {
    expandedRef.current = expanded
    const dur = expanded ? DUR_CENTER : DUR_CENTER_REVERSE
    animLockUntilRef.current = performance.now() + dur
    lockStartYRef.current = window.scrollY

    const timer = window.setTimeout(() => {
      // Re-evalúa con (scroll actual, scroll al inicio del lock). Si durante
      // la animación el usuario se movió overall hacia arriba (o hacia abajo)
      // lo suficiente como para cambiar de estado, disparamos la siguiente.
      const y = window.scrollY
      const startY = lockStartYRef.current
      const target = computeTargetRef.current(y, startY)
      if (target !== expandedRef.current) {
        setExpanded(target)
      }
    }, dur)
    return () => window.clearTimeout(timer)
  }, [expanded])

  useEffect(() => {
    const evaluate = () => {
      tickingRef.current = false
      const y = window.scrollY
      const prevY = lastYRef.current
      lastYRef.current = y

      if (performance.now() < animLockUntilRef.current) {
        // Durante el lock no decidimos nada — el useEffect del lock hará la
        // re-evaluación al expirar usando la posición actual.
        return
      }

      const target = computeTargetRef.current(y, prevY)
      if (target !== expandedRef.current) {
        setExpanded(target)
      }
    }

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(evaluate)
    }

    if (window.scrollY > FORWARD_TRIGGER_PX) {
      setExpanded(true)
    }
    lastYRef.current = window.scrollY

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // IntersectionObserver: si la sección sale del viewport, desactivamos las
  // transitions (snap). Reduce carga CPU/GPU mientras el user scrollea rápido
  // pasando la sección y elimina la traba que aparecía con scroll largo.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setAnimEnabled(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Duraciones: forward premium (1.3s) / reverse responsivo (0.7s).
  const durCenter = expanded ? DUR_CENTER : DUR_CENTER_REVERSE
  const durSides = expanded ? DUR_SIDES : DUR_SIDES_REVERSE

  // Memoizamos los style objects para que NO se recreen en cada render. Sin
  // memo, React pasa nuevos referencial-distintos objects al DOM y eso puede
  // causar que el browser haga style recalc completo (micro-tirón).
  const centerStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      height: "100%",
      width: expanded ? "32%" : "100%",
      left: expanded ? "34%" : "0%",
      transition: animEnabled
        ? `width ${durCenter}ms ${EASE}, left ${durCenter}ms ${EASE}`
        : "none",
      transform: "translateZ(0)",
      backfaceVisibility: "hidden",
      willChange: "width, left",
    }),
    [expanded, durCenter, animEnabled]
  )

  const sideLeftStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      height: "100%",
      width: "32%",
      left: 0,
      transform: expanded ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
      opacity: expanded ? 1 : 0,
      transition: animEnabled
        ? `transform ${durSides}ms ${EASE}, opacity ${durSides}ms ${EASE}`
        : "none",
      transitionDelay: animEnabled && expanded ? `${DELAY_SIDES}ms` : "0ms",
      willChange: "transform, opacity",
    }),
    [expanded, durSides, animEnabled]
  )

  const sideRightStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      height: "100%",
      width: "32%",
      right: 0,
      transform: expanded ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
      opacity: expanded ? 1 : 0,
      transition: animEnabled
        ? `transform ${durSides}ms ${EASE}, opacity ${durSides}ms ${EASE}`
        : "none",
      transitionDelay: animEnabled && expanded ? `${DELAY_SIDES}ms` : "0ms",
      willChange: "transform, opacity",
    }),
    [expanded, durSides, animEnabled]
  )

  // Cross-fade entre dos versiones del texto (grande y chica), secuencial sin
  // superposición visible. Cada versión está rendereada a su tamaño final
  // (sin scale), así no hay vibración. Una fadea en la primera mitad de la
  // animación; la otra aparece en la segunda mitad.
  // Cross-fade SIMULTÁNEO en lugar de secuencial — eliminamos el delay del
  // medio que generaba un "setup point" perceptible. La superposición visual
  // breve (~150ms) es imperceptible porque ambas versiones tienen el mismo
  // texto centered. Pre-activamos GPU layer con translate3d.
  // Texto SIN animación: tamaño chico fijo, siempre visible. Eliminar la
  // opacity transition + el cross-fade reduce a cero el trabajo de render del
  // texto durante la animación del centro.

  return (
    <>
      {/* DESKTOP: sección alta para "scroll muerto" + sticky debajo del navbar */}
      <section
        ref={sectionRef}
        aria-label="Tienda, academia y servicios"
        className="relative hidden md:block"
        style={{ height: `${SECTION_HEIGHT_VH}vh` }}
      >
        <div
          className="sticky w-full overflow-hidden bg-white px-6"
          style={{
            top: "var(--navbar-actual-h, 64px)",
            // -24px abajo para dejar el mismo respiro blanco que el px-6
            // lateral; evita que la imagen abarrote el borde inferior.
            height: "calc(100vh - var(--navbar-actual-h, 64px) - 24px)",
            contain: "layout paint",
            transform: "translateZ(0)",
          }}
        >
          <div className="relative h-full w-full">
            <CardBlock card={LEFT} compact style={sideLeftStyle} />
            <CardBlock card={RIGHT} compact style={sideRightStyle} />
            <CardBlock
              card={CENTER}
              hero
              hideHeroText
              style={centerStyle}
              onMouseEnter={() => {
                // No re-renderear durante la animación: si los bordes del card
                // se mueven mientras el mouse está cerca, mouseEnter/Leave
                // pueden dispararse involuntariamente y meter un re-render
                // que causa el micro-tirón.
                if (performance.now() < animLockUntilRef.current) return
                setCenterHover(true)
              }}
              onMouseLeave={() => {
                if (performance.now() < animLockUntilRef.current) return
                setCenterHover(false)
              }}
            />

            {/* Texto del hero: tamaño chico fijo, siempre visible. Sin
                opacity ni scale animando = cero trabajo de render del texto
                durante la animación del centro. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <span className="mb-3 text-[9px] uppercase tracking-[0.32em] text-white/90">
                {CENTER.eyebrow}
              </span>
              <h2 className="max-w-[14ch] font-[family-name:var(--font-cormorant-garamond)] text-xl font-light leading-[1.1] md:text-3xl lg:text-4xl">
                {CENTER.title}
              </h2>
              <p className="mt-2 max-w-xs text-[11px] text-white/85 md:text-xs">
                {CENTER.subtitle}
              </p>
              <span
                className="mt-4 inline-flex items-center border-b pb-0.5 text-[10px] uppercase tracking-[0.24em] transition-colors duration-300"
                style={{
                  borderColor: centerHover ? "var(--gold)" : "rgba(255,255,255,0.7)",
                  color: centerHover ? "var(--gold)" : "#fff",
                }}
              >
                {CENTER.cta}
              </span>
            </div>

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
  hideHeroText = false,
  onMouseEnter,
  onMouseLeave,
}: {
  card: Card
  hero?: boolean
  compact?: boolean
  style?: React.CSSProperties
  className?: string
  titleStyle?: React.CSSProperties
  hideHeroText?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  return (
    <Link
      href={card.href}
      style={style}
      className={`group relative block overflow-hidden rounded-[2px] ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Image
        src={card.image}
        alt={card.alt}
        fill
        sizes={hero ? "(min-width: 768px) 95vw, 100vw" : "(min-width: 768px) 31vw, 50vw"}
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        priority={hero}
        // Promueve la imagen a su propia capa GPU: cuando el contenedor padre
        // anima width/left, el navegador sólo cambia el clip; no re-rasteriza
        // ni repinta los píxeles de la imagen. Es el truco que da fluidez.
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />

      {hero && !hideHeroText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div style={titleStyle} className="flex flex-col items-center">
            <span className="mb-5 text-[11px] uppercase tracking-[0.32em] text-white/90">
              {card.eyebrow}
            </span>
            <h2 className="max-w-[14ch] font-[family-name:var(--font-cormorant-garamond)] text-4xl font-light leading-[1.05] md:text-6xl lg:text-7xl">
              {card.title}
            </h2>
            <p className="mt-5 max-w-md text-sm text-white/85 md:text-base">
              {card.subtitle}
            </p>
            <Magnetic strength={0.3} className="mt-8">
              <span className="inline-flex items-center border-b border-white/70 pb-1 text-xs uppercase tracking-[0.28em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
                {card.cta}
              </span>
            </Magnetic>
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
          <Magnetic strength={0.3} className="mt-3 w-fit">
            <span className="inline-flex items-center border-b border-white/70 pb-0.5 text-[11px] uppercase tracking-[0.24em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
              {card.cta}
            </span>
          </Magnetic>
        </div>
      )}
    </Link>
  )
}
