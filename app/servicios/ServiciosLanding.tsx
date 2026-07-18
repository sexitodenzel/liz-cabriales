"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import {
  Car,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Star,
  Users,
} from "lucide-react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
/** Mismo CTA negro que Continuar en /servicios/agendar (BookingSummary). */
const bookNowClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1a1a1a] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black"

/** Botones "Ver todo": ancho completo en móvil; chicos y a la izquierda en PC. */
const verTodoClassName =
  "inline-flex h-8 w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-3.5 text-[12px] font-normal normal-case tracking-normal text-neutral-900 transition-all duration-200 ease-out hover:bg-neutral-900 hover:text-white active:scale-[0.97] lg:w-auto lg:px-5"

const PORTFOLIO_SLOTS = 8
import type {
  ProfessionalRow,
  ServiceFilterRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import {
  DEFAULT_STUDIO_WEEKLY_HOURS,
  STUDIO_WEEK_DAYS,
  formatStudioTimeLabel,
  hhmmToMinutes,
  normalizeStudioTime,
  type StudioDayOfWeek,
  type StudioWeeklyHourRow,
} from "@/lib/appointments/studio-hours"
import {
  PICKUP_LOCATION_ADDRESS,
  PICKUP_MAPS_URL,
} from "@/lib/constants/contact"
import { navSticky } from "@/lib/nav-sticky"
import { STUDIO_REVIEWS } from "./reviews-data"

const GALLERY = [
  "https://picsum.photos/seed/servicios-studio-a/1200/900",
  "https://picsum.photos/seed/servicios-studio-b/700/500",
  "https://picsum.photos/seed/servicios-studio-c/700/500",
  "https://picsum.photos/seed/servicios-studio-d/700/500",
  "https://picsum.photos/seed/servicios-studio-e/700/500",
]

/** Orden móvil: Acerca arriba. PC: Acerca justo antes de ubicación. */
const SECTION_TABS_MOBILE = [
  { id: "fotos", label: "Fotos" },
  { id: "acerca", label: "Acerca de" },
  { id: "servicios", label: "Servicios" },
  { id: "equipo", label: "Equipo" },
  { id: "resenas", label: "Reseñas" },
  { id: "portfolio", label: "Portfolio" },
  { id: "ubicacion", label: "Ubicación" },
] as const

const SECTION_TABS_DESKTOP = [
  { id: "fotos", label: "Fotos" },
  { id: "servicios", label: "Servicios" },
  { id: "equipo", label: "Equipo" },
  { id: "resenas", label: "Reseñas" },
  { id: "portfolio", label: "Portfolio" },
  { id: "acerca", label: "Acerca de" },
  { id: "ubicacion", label: "Ubicación" },
] as const

const ABOUT_TEXT =
  "Estudio de manicure, pedicure y cuidado profesional en Cd. Madero. Atención personalizada, bioseguridad y técnicas actualizadas — agenda tu visita con el equipo de Liz Cabriales."

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Nayarit+204-B+Unidad+Nacional+Cd+Madero+Tamaulipas&output=embed"

type PortfolioItem = { id: string; title: string; image: string; href?: string }

type Props = {
  services: ServiceWithOptions[]
  filters: ServiceFilterRow[]
  professionals: ProfessionalRow[]
  studioWeeklyHours: StudioWeeklyHourRow[]
  portfolioItems: PortfolioItem[]
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

/** Primera mayúscula, resto minúsculas (p. ej. Reflexología). */
function sentenceCase(value: string): string {
  const t = value.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
}

function isStudioOpenNow(weeklyHours: StudioWeeklyHourRow[], now = new Date()): boolean {
  const dow = now.getDay() as StudioDayOfWeek
  const row =
    weeklyHours.find((h) => h.day_of_week === dow) ??
    DEFAULT_STUDIO_WEEKLY_HOURS.find((h) => h.day_of_week === dow)
  if (!row?.is_open) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  const open = hhmmToMinutes(normalizeStudioTime(row.open_time))
  const close = hhmmToMinutes(normalizeStudioTime(row.close_time))
  return mins >= open && mins < close
}

function statusLine(weeklyHours: StudioWeeklyHourRow[], now = new Date()): string {
  const openNow = isStudioOpenNow(weeklyHours, now)
  if (openNow) {
    const dow = now.getDay() as StudioDayOfWeek
    const row =
      weeklyHours.find((h) => h.day_of_week === dow) ??
      DEFAULT_STUDIO_WEEKLY_HOURS.find((h) => h.day_of_week === dow)
    if (!row) return "Abierto"
    return `Abierto · cierra a las ${formatStudioTimeLabel(normalizeStudioTime(row.close_time))}`
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dow = d.getDay() as StudioDayOfWeek
    const row =
      weeklyHours.find((h) => h.day_of_week === dow) ??
      DEFAULT_STUDIO_WEEKLY_HOURS.find((h) => h.day_of_week === dow)
    if (!row?.is_open) continue
    if (i === 0) {
      const openMin = hhmmToMinutes(normalizeStudioTime(row.open_time))
      const nowMin = now.getHours() * 60 + now.getMinutes()
      if (nowMin < openMin) {
        return `Cerrado · abre hoy a las ${formatStudioTimeLabel(normalizeStudioTime(row.open_time))}`
      }
      continue
    }
    const dayLabel =
      STUDIO_WEEK_DAYS.find((x) => x.day_of_week === dow)?.label.toLowerCase() ?? ""
    return `Cerrado · abre el ${dayLabel} a las ${formatStudioTimeLabel(normalizeStudioTime(row.open_time))}`
  }
  return "Cerrado"
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#111] text-[#111]" />
      ))}
    </span>
  )
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function ServiciosLanding({
  services,
  filters,
  professionals,
  studioWeeklyHours,
  portfolioItems,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("")
  const [activeTab, setActiveTab] = useState<string>("fotos")
  const [hoursOpen, setHoursOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [mobileBookBar, setMobileBookBar] = useState(false)
  const [tabsBarH, setTabsBarH] = useState(40)
  const [showSectionBar, setShowSectionBar] = useState(false)
  const [goldBar, setGoldBar] = useState({ left: 0, width: 0, ready: false })
  const [isDesktop, setIsDesktop] = useState(false)
  const tabClickLockRef = useRef(false)
  const bookCtaRef = useRef<HTMLDivElement>(null)
  const sectionTabsRef = useRef<HTMLElement>(null)
  const tabsListRef = useRef<HTMLUListElement>(null)
  const tabBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  /** Móvil: borde superior de la hoja blanca. Desktop: inicio del contenido. */
  const sectionBarSentinelRef = useRef<HTMLDivElement>(null)
  const sectionBarSentinelDesktopRef = useRef<HTMLDivElement>(null)

  // Sticky móvil inferior: aparece al pasar el encabezado y se oculta cuando
  // el CTA inline ("Reservar ahora" bajo Información adicional) entra en vista.
  useEffect(() => {
    let raf: number | null = null
    const check = () => {
      raf = null
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileBookBar(false)
        return
      }
      const trigger = sectionBarSentinelRef.current
      if (!trigger) return
      const pastHeader = trigger.getBoundingClientRect().top < 100
      const inlineCta = bookCtaRef.current
      // Cuando el botón fijo del final está a la vista, desaparece el sticky.
      const beforeInlineCta = inlineCta
        ? inlineCta.getBoundingClientRect().top > window.innerHeight - 16
        : true
      setMobileBookBar(pastHeader && beforeInlineCta)
    }
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(check)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    check()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [])

  // Todas las categorías activas (p. ej. Otros), ordenadas; no ocultar las vacías.
  const availableCategories = useMemo(() => {
    return filters
      .filter((f) => f.is_active)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [filters])

  // Sin "Todos": arranca en la primera categoría y siempre filtra por una.
  const currentCategory = activeCategory || availableCategories[0]?.slug || ""
  const visibleServices = useMemo(() => {
    if (!currentCategory) return services
    return services.filter((s) => s.filter_slug === currentCategory)
  }, [services, currentCategory])

  const activePros = useMemo(
    () => professionals.filter((p) => p.is_active),
    [professionals]
  )

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Tabs: móvil mantiene Acerca arriba; PC lo deja antes de ubicación.
  const sectionTabs = useMemo(() => {
    const tabs = isDesktop ? SECTION_TABS_DESKTOP : SECTION_TABS_MOBILE
    return tabs.filter((tab) => (tab.id === "equipo" ? activePros.length > 0 : true))
  }, [activePros.length, isDesktop])

  // Altura real de la barra de tabs → el sticky de Reservar se ancla debajo.
  useEffect(() => {
    const measure = () => {
      const el = sectionTabsRef.current
      if (el) setTabsBarH(el.offsetHeight)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [sectionTabs])

  // Línea dorada + scroll horizontal para que el tab activo (p. ej. Acerca de) se vea.
  useEffect(() => {
    const btn = tabBtnRefs.current.get(activeTab)
    const list = tabsListRef.current
    if (!btn || !list || !showSectionBar) {
      setGoldBar((g) => ({ ...g, ready: false, width: 0 }))
      return
    }
    // La barra dorada vive dentro del <ul> (position: relative), así que
    // usamos coordenadas del contenido (offsetLeft) y se desliza sola con el
    // scroll. La transición CSS [left,width] hace el movimiento suave.
    const position = () => {
      setGoldBar({ left: btn.offsetLeft, width: btn.offsetWidth, ready: true })
    }
    position()
    // Centrar el tab activo con desplazamiento SUAVE (no de golpe) y solo al
    // cambiar de sección — no reaccionamos al scroll del propio list para no
    // pelear con el gesto del usuario.
    const target = btn.offsetLeft - (list.clientWidth - btn.offsetWidth) / 2
    const max = list.scrollWidth - list.clientWidth
    list.scrollTo({
      left: Math.max(0, Math.min(target, max)),
      behavior: "smooth",
    })
    window.addEventListener("resize", position)
    return () => window.removeEventListener("resize", position)
  }, [activeTab, showSectionBar, sectionTabs])

  // Barra de secciones: nace cuando el inicio de lo blanco TOCA el navbar
  // (no el tope del viewport). Misma animación desde debajo del navbar.
  useEffect(() => {
    let raf: number | null = null
    const navbarH = () =>
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--navbar-actual-h"
        )
      ) || 64
    const check = () => {
      raf = null
      const isLg = window.matchMedia("(min-width: 1024px)").matches
      const sentinel = isLg
        ? sectionBarSentinelDesktopRef.current
        : sectionBarSentinelRef.current
      if (!sentinel) {
        setShowSectionBar(false)
        return
      }
      // top del blanco <= borde inferior del navbar → ya lo tocó.
      setShowSectionBar(sentinel.getBoundingClientRect().top <= navbarH())
    }
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(check)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    check()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [])

  // Scroll-spy: el underline sigue la sección visible (no queda hardcodeado).
  useEffect(() => {
    const elements = sectionTabs
      .map((tab) => document.getElementById(tab.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (elements.length === 0) return

    const visibility = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        if (tabClickLockRef.current) return

        let bestId = ""
        let bestRatio = 0
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        // Si ninguna intersecta bien, usa la más cercana al top del viewport.
        if (bestRatio < 0.05) {
          let bestTop = Number.POSITIVE_INFINITY
          for (const el of elements) {
            const top = Math.abs(el.getBoundingClientRect().top - 120)
            if (top < bestTop) {
              bestTop = top
              bestId = el.id
            }
          }
        }
        if (bestId) setActiveTab(bestId)
      },
      {
        root: null,
        // Banda superior del viewport (bajo navbar + tabs).
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [sectionTabs])

  const openNow = isStudioOpenNow(studioWeeklyHours)
  const status = statusLine(studioWeeklyHours)

  const hoursRows = STUDIO_WEEK_DAYS.map(({ day_of_week, label }) => {
    const row =
      studioWeeklyHours.find((h) => h.day_of_week === day_of_week) ??
      DEFAULT_STUDIO_WEEKLY_HOURS.find((h) => h.day_of_week === day_of_week)
    return {
      label,
      isOpen: Boolean(row?.is_open),
      hours: row?.is_open
        ? `${formatStudioTimeLabel(normalizeStudioTime(row.open_time))} – ${formatStudioTimeLabel(normalizeStudioTime(row.close_time))}`
        : "Cerrado",
    }
  })

  const portfolio: PortfolioItem[] =
    portfolioItems.length > 0
      ? portfolioItems
      : GALLERY.slice(0, 3).map((image, i) => ({
          id: `ph-${i}`,
          title: `Trabajo ${i + 1}`,
          image,
        }))

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const onTabClick = (id: string) => {
    setActiveTab(id)
    tabClickLockRef.current = true
    scrollToId(id)
    window.setTimeout(() => {
      tabClickLockRef.current = false
    }, 900)
  }

  return (
    <main className="min-h-screen bg-ivory text-[#1a1a1a]">
      <div className="site-container pb-24 pt-5 max-lg:pt-0 lg:pb-20">
        {/* ── Encabezado desktop (en móvil vive dentro de la hoja bajo la foto). ── */}
        <header className="mb-5 hidden lg:block">
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Liz Cabriales
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-[#5a5a5a]">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-[#111]">5,0</span>
              <Stars />
              <span className="text-[#8a6d26]">({STUDIO_REVIEWS.length})</span>
            </span>
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-neutral-400"}`}
                aria-hidden
              />
              {status}
            </span>
            <span className="text-neutral-300" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#8a6d26]" aria-hidden />
              Cd. Madero
            </span>
          </div>
        </header>

        {/* ── Galería: móvil = foto full-bleed; desktop = collage. ── */}
        <section
          id="fotos"
          className="relative scroll-mt-28 max-lg:mb-0 lg:mb-0"
          aria-label="Galería del estudio"
        >
          {/* Móvil: imagen de borde a borde (rompe el padding del contenedor). */}
          <div className="relative -mx-[var(--site-px)] w-[calc(100%+2*var(--site-px))] max-w-none lg:hidden">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Ampliar galería"
              className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
            >
              <SmoothImage
                src={GALLERY[0]}
                alt="Estudio Liz Cabriales"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </button>
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label={`Ver galería, ${GALLERY.length} imágenes`}
              className="absolute bottom-11 right-4 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm"
            >
              1/{GALLERY.length}
            </button>
          </div>

          {/* Desktop: collage 2/3 + 2 apiladas. */}
          <div className="hidden gap-2 overflow-hidden rounded-2xl lg:grid lg:h-[440px] lg:grid-cols-3 lg:grid-rows-2">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Ampliar galería"
              className="relative col-span-2 row-span-2 cursor-zoom-in overflow-hidden"
            >
              <SmoothImage
                src={GALLERY[0]}
                alt="Estudio Liz Cabriales"
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="66vw"
                priority
              />
            </button>
            <button
              type="button"
              onClick={() => openLightbox(1)}
              aria-label="Ampliar galería"
              className="relative cursor-zoom-in overflow-hidden"
            >
              <SmoothImage
                src={GALLERY[1]}
                alt=""
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="33vw"
                priority
              />
            </button>
            <button
              type="button"
              onClick={() => openLightbox(2)}
              aria-label="Ampliar galería"
              className="relative cursor-zoom-in overflow-hidden"
            >
              <SmoothImage
                src={GALLERY[2]}
                alt=""
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="33vw"
                priority
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 hidden rounded-full bg-white/95 px-4 py-2 text-[12px] font-semibold text-[#111] shadow-sm backdrop-blur transition-colors hover:bg-white lg:block"
          >
            Ver todas las imágenes
          </button>
        </section>

        {/* ── Móvil: hoja full-width (NO card) que solapa la foto con bordes
            superiores redondeados. Título + rating + ubicación → Acerca de.
            El sentinel va en el borde superior blanco: ahí nace la barra de tabs. ── */}
        <div className="relative z-10 -mx-[var(--site-px)] -mt-8 w-[calc(100%+2*var(--site-px))] max-w-none overflow-hidden rounded-t-[1.75rem] bg-ivory px-[var(--site-px)] pt-6 lg:hidden">
          <div ref={sectionBarSentinelRef} aria-hidden className="h-0" />
          <header className="mb-8">
            <h1 className="font-[family-name:var(--font-playfair),serif] text-[32px] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
              Liz Cabriales
            </h1>
            <p className="mt-1 text-[14px] text-[#8a8a8a]">Estudio de uñas</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-[#5a5a5a]">
              <span className="inline-flex items-center gap-1.5">
                <Star
                  className="h-3.5 w-3.5 fill-[#8a6d26] text-[#8a6d26]"
                  aria-hidden
                />
                <span className="font-semibold text-[#111]">5,0</span>
                <span className="text-[#8a6d26]">({STUDIO_REVIEWS.length})</span>
              </span>
              <span className="text-neutral-300" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-neutral-400"}`}
                  aria-hidden
                />
                <span className={openNow ? "text-emerald-700" : undefined}>{status}</span>
              </span>
            </div>
            <div className="mt-4 inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-2 text-[13px] text-[#3a3a3a]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#111]" aria-hidden />
              <span>Unidad Nacional, Cd. Madero</span>
            </div>
          </header>
        </div>

        {/* ── Tabs de sección: barra FIJA bajo el navbar. Solo nace al llegar a
            la primera sección (pasando la imagen); se desliza desde abajo del
            navbar (misma animación de siempre). ── */}
        <nav
          ref={sectionTabsRef}
          aria-label="Secciones"
          className={`navbar-follow-collapse fixed inset-x-0 z-30 border-b border-neutral-200/80 bg-ivory/95 backdrop-blur-md ${
            showSectionBar
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-full opacity-0"
          }`}
          style={{
            top: "var(--navbar-actual-h)",
            // Sigue el colapso del navbar (transform 480ms) + revela (opacity/
            // translate) sin abrir hueco. Inline gana sobre la transición de la
            // clase para animar las tres propiedades a la vez.
            transition:
              "opacity 300ms ease-out, translate 300ms cubic-bezier(0.22,1,0.36,1), transform 480ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="site-container">
            <ul
              ref={tabsListRef}
              className="relative flex gap-0.5 overflow-x-auto py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1"
            >
              {/* Línea dorada tipo megamenú: se desliza con la sección activa. */}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 h-[1.5px] bg-[#c6a75e]"
                style={{
                  left: goldBar.left,
                  width: goldBar.ready ? goldBar.width : 0,
                  transition:
                    "left 300ms cubic-bezier(0.22,1,0.36,1), width 300ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              {sectionTabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <li key={tab.id} className="shrink-0">
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) tabBtnRefs.current.set(tab.id, el)
                        else tabBtnRefs.current.delete(tab.id)
                      }}
                      onClick={() => onTabClick(tab.id)}
                      aria-current={active ? "true" : undefined}
                      className={`relative px-2.5 py-2 text-[12px] font-medium transition-colors sm:px-3.5 sm:py-2.5 sm:text-[13px] ${
                        active
                          ? "text-[#111]"
                          : "text-[#6b6b6b] hover:text-[#111]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:mt-5 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
          {/* ── Columna principal ──
              Móvil: Acerca → Servicios → … → ubicación.
              PC: Servicios → … → Portfolio → Acerca → ubicación. */}
          <div className="relative flex min-w-0 flex-col gap-14 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            {/* Sentinel fuera del flex gap: si va como hijo, gap-14 abre 56px
                encima del primer bloque y rompe la alineación con la card. */}
            <div
              ref={sectionBarSentinelDesktopRef}
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 hidden h-0 w-full lg:block"
            />

            {/* Acerca de — arriba en móvil; en PC (order) justo antes de ubicación */}
            <section
              id="acerca"
              className="scroll-mt-36 lg:order-5"
              aria-labelledby="acerca-heading"
            >
              <h2
                id="acerca-heading"
                className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]"
              >
                Acerca de
              </h2>
              <p className="mt-5 max-w-[58ch] text-[14px] leading-relaxed text-[#5a5a5a]">
                {ABOUT_TEXT}
              </p>
            </section>

            {/* Servicios */}
            <section
              id="servicios"
              className="scroll-mt-36 lg:order-1"
              aria-labelledby="servicios-heading"
            >
              <h2
                id="servicios-heading"
                className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]"
              >
                Servicios
              </h2>

              {availableCategories.length > 0 && (
                <div className="mt-5">
                  <div
                    className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="tablist"
                    aria-label="Categorías"
                  >
                    {availableCategories.map((cat) => {
                      const tab = { slug: cat.slug, label: cat.name }
                      const active = currentCategory === tab.slug
                      return (
                        <button
                          key={tab.slug}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveCategory(tab.slug)}
                          className={`inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-full border px-3 text-[12px] font-medium normal-case tracking-normal transition-colors ${
                            active
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                          }`}
                        >
                          {sentenceCase(tab.label)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <ul className="mt-6 flex flex-col gap-3">
                {visibleServices.length === 0 ? (
                  <li className="rounded-xl border border-neutral-200/80 bg-white/60 py-10 text-center text-[14px] text-neutral-400">
                    No hay servicios en esta categoría.
                  </li>
                ) : (
                  visibleServices.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200/80 bg-white/70 px-4 py-4 sm:gap-6 sm:px-5 sm:py-5"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold leading-snug text-[#111] sm:text-[16px]">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-[12px] text-[#8a8a8a] sm:text-[13px]">
                          {formatDuration(service.duration_min)}
                        </p>
                        <p className="mt-1.5 text-[14px] font-semibold text-[#111] sm:mt-2 sm:text-[15px]">
                          {formatPrice(service.price)}
                        </p>
                      </div>
                      <Link
                        href={`/servicios/agendar?servicio=${encodeURIComponent(service.id)}`}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-neutral-900 bg-white px-3.5 text-[12px] font-normal normal-case tracking-normal text-neutral-900 transition-all duration-200 ease-out hover:bg-neutral-900 hover:text-white active:scale-[0.97]"
                      >
                        Reservar
                      </Link>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-6">
                <Link href="/servicios/agendar" className={verTodoClassName}>
                  Ver todo
                </Link>
              </div>
            </section>

            {/* Equipo */}
            {activePros.length > 0 && (
              <section
                id="equipo"
                className="scroll-mt-36 lg:order-2"
                aria-labelledby="equipo-heading"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2
                    id="equipo-heading"
                    className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]"
                  >
                    Equipo
                  </h2>
                </div>
                <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-8">
                  {activePros.map((pro) => (
                    <li key={pro.id} className="flex w-28 flex-col items-center gap-2.5 text-center">
                      <span className="relative h-24 w-24 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200/80">
                        {pro.photo_url ? (
                          <SmoothImage
                            src={pro.photo_url}
                            alt={pro.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-[#8a6d26]">
                            {initials(pro.name)}
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] font-semibold leading-snug text-[#111]">
                        {pro.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#6b6b6b]">
                        <Star className="h-3 w-3 fill-[#c6a75e] text-[#c6a75e]" aria-hidden />
                        5,0
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Reseñas */}
            <section
              id="resenas"
              className="scroll-mt-36 lg:order-3"
              aria-labelledby="resenas-heading"
            >
              <h2
                id="resenas-heading"
                className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]"
              >
                Reseñas
              </h2>
              <div className="mt-5 flex items-center gap-2">
                <span className="text-[28px] font-semibold leading-none text-[#111]">5,0</span>
                <Stars />
                <span className="text-[13px] text-[#8a6d26]">({STUDIO_REVIEWS.length})</span>
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {STUDIO_REVIEWS.map((review) => (
                  <li key={review.id} className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c6a75e]/20 text-[13px] font-semibold text-[#8a6d26]">
                        {review.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111]">
                          {review.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Stars count={review.stars} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#5a5a5a]">
                      {review.quote}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/servicios/resenas" className={verTodoClassName}>
                  Ver todo
                </Link>
              </div>
            </section>

            {/* Portfolio — carrusel horizontal, una fila de fotos chicas */}
            <section
              id="portfolio"
              className="scroll-mt-36 lg:order-4"
              aria-labelledby="portfolio-heading"
            >
              <h2
                id="portfolio-heading"
                className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]"
              >
                Portfolio{" "}
                <span className="text-[16px] font-normal text-neutral-400">
                  {portfolio.length}
                </span>
              </h2>
              <ul className="mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 pl-3 scroll-pl-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: PORTFOLIO_SLOTS }).map((_, i) => {
                  const item = portfolio[i]
                  if (item) {
                    const inner = (
                      <span className="relative h-[112px] w-[112px] overflow-hidden rounded-xl bg-neutral-100 sm:h-[128px] sm:w-[128px]">
                        <SmoothImage
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="128px"
                        />
                      </span>
                    )
                    return (
                      <li key={item.id} className="shrink-0 snap-start">
                        {item.href ? (
                          <Link href={item.href} className="group block">
                            {inner}
                          </Link>
                        ) : (
                          <div className="group">{inner}</div>
                        )}
                      </li>
                    )
                  }
                  return (
                    <li key={`slot-${i}`} className="shrink-0 snap-start">
                      <Link
                        href="/nail-art"
                        className="relative flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-[11px] text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 sm:h-[128px] sm:w-[128px]"
                      >
                        Más fotos
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-5">
                <Link href="/nail-art" className={verTodoClassName}>
                  Ver todo
                </Link>
              </div>
            </section>

            {/* Mapa, horarios e info — siempre al final */}
            <section
              id="ubicacion"
              className="scroll-mt-36 lg:order-6"
              aria-label="Ubicación y horarios"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100">
                <iframe
                  title="Ubicación del estudio"
                  src={MAP_EMBED_SRC}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <p className="mt-3 text-[13px] text-[#5a5a5a]">
                {PICKUP_LOCATION_ADDRESS}{" "}
                <a
                  href={PICKUP_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#8a6d26] underline-offset-2 hover:underline"
                >
                  Cómo llegar
                </a>
              </p>

              <div className="mt-10">
                <h3 className="text-[15px] font-semibold text-[#111]">Horario de apertura</h3>
                <ul className="mt-4 space-y-2.5">
                  {hoursRows.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-4 text-[13px]"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            row.isOpen ? "bg-emerald-500" : "bg-neutral-300"
                          }`}
                          aria-hidden
                        />
                        <span className={row.isOpen ? "text-[#3a3a3a]" : "text-neutral-400"}>
                          {row.label}
                        </span>
                      </span>
                      <span className={row.isOpen ? "text-[#6b6b6b]" : "text-neutral-400"}>
                        {row.hours}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <h3 className="text-[15px] font-semibold text-[#111]">Información adicional</h3>
                <ul className="mt-4 space-y-3 text-[13px] text-[#5a5a5a]">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 shrink-0 text-[#8a6d26]" aria-hidden />
                    Confirmación de cita
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-4 w-4 shrink-0 text-[#8a6d26]" aria-hidden />
                    Atención personalizada
                  </li>
                  <li className="flex items-center gap-3">
                    <Car className="h-4 w-4 shrink-0 text-[#8a6d26]" aria-hidden />
                    Estacionamiento cercano
                  </li>
                </ul>
              </div>

              {/* CTA inline: al llegar aquí desaparece el sticky inferior */}
              <div ref={bookCtaRef} className="mt-8 lg:hidden">
                <Link href="/servicios/agendar" className={bookNowClassName}>
                  Reservar ahora
                </Link>
              </div>
            </section>
          </div>

          {/* Card lateral solo desktop; mismo tope de fila que Acerca de. */}
          <aside
            {...navSticky(
              "plain",
              "z-10 hidden w-full max-w-[460px] justify-self-stretch rounded-xl border border-neutral-200/80 bg-white/70 p-5 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block lg:justify-self-end lg:p-6"
            )}
            style={{ top: `calc(var(--navbar-actual-h) + ${tabsBarH + 16}px)` }}
          >
            <div className="flex items-start gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Liz Cabriales Studio"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-playfair),serif] text-[20px] leading-tight text-[#0a0a0a]">
                  Liz Cabriales
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-[#0a0a0a]">5,0</span>
                  <Stars />
                  <span className="text-neutral-500">({STUDIO_REVIEWS.length})</span>
                </div>
              </div>
            </div>

            <div className="mt-3 h-px w-full bg-[#ececec]" />

            <div className="mt-5 space-y-4 text-[13px] text-[#5a5a5a]">
              <div>
                <button
                  type="button"
                  onClick={() => setHoursOpen((v) => !v)}
                  className="flex w-full items-start gap-2.5 text-left"
                  aria-expanded={hoursOpen}
                >
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-[#0a0a0a]">{status}</span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                      hoursOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {hoursOpen && (
                  <ul className="mt-3 space-y-1.5 border-l border-neutral-100 pl-6">
                    {hoursRows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-baseline justify-between gap-3 text-[12px]"
                      >
                        <span className={row.isOpen ? "text-[#3a3a3a]" : "text-neutral-400"}>
                          {row.label}
                        </span>
                        <span className={row.isOpen ? "text-[#6b6b6b]" : "text-neutral-400"}>
                          {row.hours}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                <div>
                  <p>{PICKUP_LOCATION_ADDRESS}</p>
                  <a
                    href={PICKUP_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-neutral-700 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-[#0a0a0a]"
                  >
                    Cómo llegar
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/servicios/agendar" className={bookNowClassName}>
                Reservar ahora
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky móvil inferior — Reservar ahora */}
      {mobileBookBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-ivory/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
          role="region"
          aria-label="Reservar ahora"
        >
          <div className="site-container">
            <div className="flex items-center gap-3 py-3">
              <Link
                href="/servicios/agendar"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold uppercase tracking-[0.16em] text-[#0a0a0a]">
                    Liz Cabriales
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-neutral-600">
                    {services.length === 1
                      ? "1 servicio disponible"
                      : `${services.length} servicios disponibles`}
                  </span>
                </span>
              </Link>
              <Link
                href="/servicios/agendar"
                className={`${bookNowClassName} w-auto shrink-0 px-5`}
              >
                Reservar ahora
              </Link>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={GALLERY}
          startIndex={lightboxIndex}
          alt="Galería del estudio"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  )
}
