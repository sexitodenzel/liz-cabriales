"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { HOME_TRI_FALLBACKS } from "@/lib/media-slots"
import InView from "../ui/motion/in-view"

type Card = {
  href: string
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  image: string
  alt: string
}

const CENTER_BASE: Omit<Card, "image"> = {
  href: "/tienda",
  eyebrow: "Tienda profesional",
  title: "Los productos que usan las profesionales",
  subtitle: "Cosmetología de salón, ahora a un clic.",
  cta: "Descubrir",
  alt: "Productos de cosmetología profesional",
}

const LEFT_BASE: Omit<Card, "image"> = {
  href: "/academia",
  eyebrow: "Academia",
  title: "Capacítate con nosotros",
  subtitle: "Cursos presenciales y online.",
  cta: "Ver cursos",
  alt: "Curso de cosmetología",
}

const RIGHT_BASE: Omit<Card, "image"> = {
  href: "/servicios/agendar",
  eyebrow: "Cabina",
  title: "Agenda tu cita",
  subtitle: "Tratamientos faciales y estética.",
  cta: "Reservar",
  alt: "Servicios de cabina",
}

// Cuarta card, solo en la tira horizontal de móvil (no es un slot de Media).
const ABOUT: Card = {
  href: "/sobre-liz",
  eyebrow: "Conócenos",
  title: "La historia detrás de la marca",
  subtitle: "Quiénes somos y por qué lo hacemos.",
  cta: "Conócenos",
  image:
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=75",
  alt: "Sobre Liz Cabriales",
}

type Props = {
  /** [tienda, academia, cabina] desde Media; fallback a Unsplash. */
  images?: [string, string, string] | string[]
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
const MIN_INTENT_DELTA = 5

// computeTarget devuelve el estado deseado dada la (y actual, y previa).
// - Si no hubo movimiento real (delta < MIN_INTENT_DELTA), mantiene el estado
//   actual: evita que un re-eval post-lock dispare animación cuando el
//   usuario está quieto en una posición no exactamente 0.
// - Forward requiere scroll DOWN activo (no sólo y > threshold).
// - Reverse requiere scroll UP activo Y posición debajo del threshold.
function computeTarget(y: number, prevY: number, expanded: boolean): boolean {
  const delta = y - prevY
  if (Math.abs(delta) < MIN_INTENT_DELTA) return expanded
  const goingUp = delta < 0
  const reverseThreshold = window.innerHeight * REVERSE_TRIGGER_VH
  if (expanded) {
    // Expanded: solo cambia a reverse si va UP y está debajo del threshold.
    if (goingUp && y < reverseThreshold) return false
    return true
  }
  // Not expanded: solo cambia a forward si va DOWN y pasa FORWARD_TRIGGER_PX.
  if (!goingUp && y > FORWARD_TRIGGER_PX) return true
  return false
}

export default function HomeHeroTriCards({ images }: Props) {
  const [tiendaImg, academiaImg, cabinaImg] = [
    images?.[0] || HOME_TRI_FALLBACKS[0],
    images?.[1] || HOME_TRI_FALLBACKS[1],
    images?.[2] || HOME_TRI_FALLBACKS[2],
  ]
  const CENTER: Card = { ...CENTER_BASE, image: tiendaImg }
  const LEFT: Card = { ...LEFT_BASE, image: academiaImg }
  const RIGHT: Card = { ...RIGHT_BASE, image: cabinaImg }

  const [expanded, setExpanded] = useState(false)
  const [centerHover, setCenterHover] = useState(false)
  // animEnabled: cuando la sección está fuera del viewport, las transitions
  // se desactivan (snap). Si el user hace un scroll largo que saca la sección,
  // no queremos que el browser siga animando algo invisible mientras lucha
  // con el scroll. Snap libera CPU y el scroll fluye.
  const [animEnabled, setAnimEnabled] = useState(true)
  // sidesExpanded: estado separado para los laterales, atrasado DELAY_SIDES
  // ms respecto a `expanded` en forward (instantáneo en reverse). Sustituye
  // a `transition-delay` cuyo expiry causaba un setup point sincronizado con
  // la animación de la central → twitch visible justo antes de que entren
  // las imágenes laterales.
  const [sidesExpanded, setSidesExpanded] = useState(false)
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
      const target = computeTarget(y, startY, expandedRef.current)
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

      const target = computeTarget(y, prevY, expandedRef.current)
      if (target !== expandedRef.current) {
        setExpanded(target)
      }
    }

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(evaluate)
    }

    lastYRef.current = window.scrollY
    // Si la página carga ya scrolleada (reload a media página), arranca
    // expandida. Vía rAF para no hacer setState síncrono dentro del effect.
    let initRaf: number | null = null
    if (window.scrollY > FORWARD_TRIGGER_PX) {
      initRaf = requestAnimationFrame(() => setExpanded(true))
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (initRaf !== null) cancelAnimationFrame(initRaf)
    }
  }, [])

  // Atrasa el cambio de sidesExpanded para crear el staging sin
  // transition-delay. Forward: espera DELAY_SIDES. Reverse: instantáneo.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setSidesExpanded(expanded),
      expanded ? DELAY_SIDES : 0
    )
    return () => window.clearTimeout(timer)
  }, [expanded])

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

  // La card central NUNCA cambia de tamaño ni posición — siempre cubre el
  // 100% en la capa base (z-0). El "compactado" lo hacen dos CORTINAS blancas
  // que entran por los costados con `transform: translateX` (compositor real).
  // El approach anterior (transition de clip-path) NO se composita en Chrome
  // (CompositeClipPathAnimation sigue detrás de flag): re-rasterizaba una
  // imagen de ~viewport en main thread cada frame → intro a pocos fps.
  // Las cortinas además absorben clicks/hover en los gutters, igual que lo
  // hacía el área recortada del clip.
  const centerStyle = useMemo<React.CSSProperties>(
    () => ({ position: "absolute", inset: 0, zIndex: 0 }),
    []
  )

  // translateX(±102%) en reposo (no ±100%) evita un hairline del borde de la
  // cortina por redondeo subpixel en el edge del contenedor.
  const curtainLeftStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      width: "34%",
      background: "#fff",
      zIndex: 10,
      transform: expanded ? "translate3d(0,0,0)" : "translate3d(-102%,0,0)",
      transition: animEnabled ? `transform ${durCenter}ms ${EASE}` : "none",
      willChange: "transform",
    }),
    [expanded, durCenter, animEnabled]
  )

  const curtainRightStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",
      width: "34%",
      background: "#fff",
      zIndex: 10,
      transform: expanded ? "translate3d(0,0,0)" : "translate3d(102%,0,0)",
      transition: animEnabled ? `transform ${durCenter}ms ${EASE}` : "none",
      willChange: "transform",
    }),
    [expanded, durCenter, animEnabled]
  )

  // Usamos `sidesExpanded` (atrasado por setTimeout) en lugar de `expanded` +
  // transition-delay. Las transitions arrancan limpias desde su t=0 cuando
  // el state cambia, sin setup point sincronizado con la central.
  const sideLeftStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      height: "100%",
      width: "32%",
      left: 0,
      zIndex: 20,
      transform: sidesExpanded ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
      opacity: sidesExpanded ? 1 : 0,
      transition: animEnabled
        ? `transform ${durSides}ms ${EASE}, opacity ${durSides}ms ${EASE}`
        : "none",
      willChange: "transform, opacity",
    }),
    [sidesExpanded, durSides, animEnabled]
  )

  const sideRightStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      top: 0,
      height: "100%",
      width: "32%",
      right: 0,
      zIndex: 20,
      transform: sidesExpanded ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
      opacity: sidesExpanded ? 1 : 0,
      transition: animEnabled
        ? `transform ${durSides}ms ${EASE}, opacity ${durSides}ms ${EASE}`
        : "none",
      willChange: "transform, opacity",
    }),
    [sidesExpanded, durSides, animEnabled]
  )

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
          className="sticky w-full overflow-hidden bg-black"
          style={{
            // Overlay: hero a 100vh pegado al top (bajo el menú transparente).
            // Al scrollear, el menú ivory sólido “separa” la imagen debajo.
            // Sin navbar-follow-collapse: el hero ya vive bajo el nav; al
            // colapsar solo se revela más foto (no hay hueco que cerrar).
            top: 0,
            height: "100vh",
            marginTop: "calc(-1 * var(--navbar-actual-h, 64px))",
          }}
        >
          <div className="relative h-full w-full">
            {/* Orden de capas: centro (z-0) → cortinas (z-10) → laterales (z-20)
                → textos (z-30). El centro ya no se recorta, así que DEBE quedar
                debajo de las cortinas y de los laterales. */}
            <CardBlock
              card={CENTER}
              hero
              hideHeroText
              style={centerStyle}
              onMouseEnter={() => {
                // Buffer de +250ms post-lock: previene que un mouseEnter justo
                // al expirar el lock (cuando el borde animado terminó cerca
                // del mouse) meta un re-render en el último frame de la
                // transition, lo cual causa el twitch al final.
                if (performance.now() < animLockUntilRef.current + 250) return
                setCenterHover(true)
              }}
              onMouseLeave={() => {
                if (performance.now() < animLockUntilRef.current + 250) return
                setCenterHover(false)
              }}
            />
            <div aria-hidden style={curtainLeftStyle} />
            <div aria-hidden style={curtainRightStyle} />
            <CardBlock card={LEFT} compact style={sideLeftStyle} priority />
            <CardBlock card={RIGHT} compact style={sideRightStyle} priority />

            {/* Texto del hero: tamaño chico fijo, siempre visible. Sin
                opacity ni scale animando = cero trabajo de render del texto
                durante la animación del centro. */}
            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center text-white">
              <span className="mb-3 text-[9px] uppercase tracking-[0.32em] text-white/90">
                {CENTER.eyebrow}
              </span>
              <h2 className="lc-text-shimmer-gold max-w-[14ch] font-display text-xl font-normal leading-[1.1] md:text-3xl lg:text-4xl">
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
              className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/80"
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

      {/* MOBILE: hero editorial que RESPIRA (~86svh, no 100) para que la tira
          de pilares asome bajo el fold e invite a scrollear — entrada Ken Burns
          sutil (GPU) + fade-rise del texto. Debajo, Academia/Cabina/Conócenos
          en una TIRA HORIZONTAL con scroll-snap (gesto nativo de móvil, estilo
          Aesop/Dior) en lugar de dos cards gigantes apiladas. */}
      <section aria-label="Tienda, academia y servicios" className="md:hidden">
        <CardBlock
          card={CENTER}
          hero
          entrance
          className="h-[calc(86svh-var(--navbar-mobile-h,64px))]"
        />

        <InView>
          <div className="bg-ivory pt-9 pb-11">
            <div className="mb-5 flex items-baseline justify-between px-6">
              <h3 className="font-display text-2xl font-normal">Explora</h3>
              <span className="text-[10px] uppercase tracking-[0.28em] text-neutral-400">
                Desliza →
              </span>
            </div>
            {/* snap-x + scrollbar-hide: cada card ocupa ~78% y la siguiente
                asoma como pista visual de que hay más. */}
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 scrollbar-hide">
              <CardBlock
                card={LEFT}
                compact
                className="aspect-[3/4] w-[78%] shrink-0 snap-start"
              />
              <CardBlock
                card={RIGHT}
                compact
                className="aspect-[3/4] w-[78%] shrink-0 snap-start"
              />
              <CardBlock
                card={ABOUT}
                compact
                className="aspect-[3/4] w-[78%] shrink-0 snap-start"
              />
            </div>
          </div>
        </InView>
      </section>
    </>
  )
}

function CardBlock({
  card,
  hero = false,
  compact = false,
  // entrance: animación de entrada única (mobile hero) — Ken Burns sutil en
  // la imagen + fade-rise del texto (clases lc-* en globals.css). Solo
  // transform/opacity, GPU; nunca scale en texto.
  entrance = false,
  style,
  className = "",
  titleStyle,
  hideHeroText = false,
  priority = hero,
  onMouseEnter,
  onMouseLeave,
}: {
  card: Card
  hero?: boolean
  compact?: boolean
  entrance?: boolean
  style?: React.CSSProperties
  className?: string
  titleStyle?: React.CSSProperties
  hideHeroText?: boolean
  priority?: boolean
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
        sizes={hero ? "(min-width: 768px) 95vw, 100vw" : "(min-width: 768px) 31vw, 100vw"}
        // En hero NO aplicamos hover-scale: el hover dispara/cancela una
        // transition de scale 1200ms en paralelo a la animación de width/left
        // del padre — son dos animaciones peleando por el mismo frame y eso
        // es la causa del twitch cuando el centro se comprime/expande. Los
        // laterales mantienen el hover scale (no animan width).
        className={
          hero
            ? `object-cover${entrance ? " lc-hero-kenburns" : ""}`
            : "object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        }
        priority={priority}
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />

      {hero && !hideHeroText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div
            style={titleStyle}
            className={`flex flex-col items-center${entrance ? " lc-hero-text-rise" : ""}`}
          >
            <span className="mb-5 text-[11px] uppercase tracking-[0.32em] text-white/90">
              {card.eyebrow}
            </span>
            <h2 className="lc-text-shimmer-gold max-w-[14ch] font-display text-4xl font-normal leading-[1.05] md:text-6xl lg:text-7xl">
              {card.title}
            </h2>
            <p className="mt-5 max-w-md text-sm text-white/85 md:text-base">
              {card.subtitle}
            </p>
            <span className="mt-8 inline-flex items-center border-b border-white/70 pb-1 text-xs uppercase tracking-[0.28em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
              {card.cta}
            </span>
          </div>
        </div>
      )}

      {/* Hint de scroll del hero mobile (el desktop tiene el suyo propio,
          ligado al estado expanded de la sección sticky). */}
      {hero && entrance && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/80"
        >
          <span className="inline-block animate-pulse">↓ Desliza</span>
        </div>
      )}

      {compact && (
        <div className="absolute inset-0 flex flex-col justify-end p-7 text-white md:p-6">
          <span className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/80">
            {card.eyebrow}
          </span>
          <h2 className="font-display text-3xl font-normal leading-tight md:text-3xl">
            {card.title}
          </h2>
          <span className="mt-3 inline-flex w-fit items-center border-b border-white/70 pb-0.5 text-[11px] uppercase tracking-[0.24em] transition-colors group-hover:border-[var(--gold)] group-hover:text-[var(--gold)]">
            {card.cta}
          </span>
        </div>
      )}
    </Link>
  )
}
