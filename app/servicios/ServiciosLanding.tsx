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
import { storeInlineButtonClassName } from "@/app/tienda/components/store-button-styles"

/** Mismo CTA negro que Continuar en /servicios/agendar (BookingSummary). */
const bookNowClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1a1a1a] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black"
import type {
  ProfessionalRow,
  ServiceFilterRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import type {
  ServiceReviewRow,
  ServiceReviewSummary,
} from "@/lib/supabase/service-reviews"
import ServiceReviewsSection, {
  ServiceReviewsAverage,
} from "./components/ServiceReviewsSection"
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
import { SERVICIOS_GALLERY_FALLBACKS } from "@/lib/media-slots"

const SECTION_TABS = [
  { id: "fotos", label: "Fotos" },
  { id: "servicios", label: "Servicios" },
  { id: "equipo", label: "Equipo" },
  { id: "resenas", label: "Reseñas" },
  { id: "portfolio", label: "Portfolio" },
  { id: "acerca", label: "Acerca de" },
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
  reviews: ServiceReviewRow[]
  reviewSummary: ServiceReviewSummary
  isAuthenticated: boolean
  ownReview: ServiceReviewRow | null
  /** Galería Media (sección servicios); fallback a placeholders. */
  galleryImages?: string[]
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
  reviews,
  reviewSummary,
  isAuthenticated,
  ownReview,
  galleryImages,
}: Props) {
  const gallery =
    galleryImages && galleryImages.length > 0
      ? galleryImages
      : [...SERVICIOS_GALLERY_FALLBACKS]
  const [activeCategory, setActiveCategory] = useState("")
  const [activeTab, setActiveTab] = useState<string>("fotos")
  const [hoursOpen, setHoursOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [mobileBookBar, setMobileBookBar] = useState(false)
  const [tabsBarH, setTabsBarH] = useState(52)
  const [showSectionBar, setShowSectionBar] = useState(false)
  const tabClickLockRef = useRef(false)
  const bookCtaRef = useRef<HTMLDivElement>(null)
  const sectionTabsRef = useRef<HTMLElement>(null)
  const sectionBarSentinelRef = useRef<HTMLDivElement>(null)

  // Sticky móvil superior (receta StickyCartBar de /tienda): aparece al pasar
  // el CTA in-page y se oculta al llegar al footer.
  useEffect(() => {
    let raf: number | null = null
    const check = () => {
      raf = null
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileBookBar(false)
        return
      }
      const trigger = bookCtaRef.current
      if (!trigger) return
      const pastCta = trigger.getBoundingClientRect().top < 100
      const footer =
        document.getElementById("footer-reveal-sentinel") ??
        document.querySelector("footer")
      const beforeFooter = footer
        ? footer.getBoundingClientRect().top > window.innerHeight - 12
        : true
      setMobileBookBar(pastCta && beforeFooter)
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

  const availableCategories = useMemo(() => {
    const used = new Set(
      services.map((s) => s.filter_slug).filter((slug): slug is string => Boolean(slug))
    )
    // Solo categorías que realmente tienen servicios. Si ningún servicio trae
    // filter_slug, no inventamos tabs que dejarían la lista vacía.
    return filters.filter((f) => f.is_active && used.has(f.slug))
  }, [filters, services])

  // Sin categorías útiles: mostrar todos. Con categorías: filtrar por la activa.
  const currentCategory = activeCategory || availableCategories[0]?.slug || ""
  const visibleServices = useMemo(() => {
    if (!currentCategory) return services
    const filtered = services.filter((s) => s.filter_slug === currentCategory)
    // Evita lista vacía si hubo desfase de slugs: muestra todo como fallback.
    return filtered.length > 0 ? filtered : services
  }, [services, currentCategory])

  const activePros = useMemo(
    () => professionals.filter((p) => p.is_active),
    [professionals]
  )

  // Tabs visibles: omitir Equipo si no hay profesionales.
  const sectionTabs = useMemo(
    () =>
      SECTION_TABS.filter((tab) => (tab.id === "equipo" ? activePros.length > 0 : true)),
    [activePros.length]
  )

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

  // La barra de secciones solo se revela al llegar al contenido: se desliza
  // desde abajo del navbar cuando el sentinel (fin de la galería) lo cruza.
  useEffect(() => {
    const sentinel = sectionBarSentinelRef.current
    if (!sentinel) return
    const navbarH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--navbar-actual-h"
        )
      ) || 64
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Se revela cuando el sentinel sale por ARRIBA (bajo el navbar).
        setShowSectionBar(
          !entry.isIntersecting && entry.boundingClientRect.top < navbarH
        )
      },
      { rootMargin: `-${navbarH}px 0px 0px 0px`, threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
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
      : gallery.slice(0, 3).map((image, i) => ({
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
      <div className="site-container pb-24 pt-5 lg:pb-20">
        {/* ── Encabezado tipo ficha (Fresha/Google Business): nombre del estudio
            + rating, estado abierto/cerrado y ubicación en una sola línea. ── */}
        <header className="mb-5">
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Liz Cabriales
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-[#5a5a5a]">
            <span className="inline-flex items-center gap-1.5 text-[13px]">
              <ServiceReviewsAverage summary={reviewSummary} />
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

        {/* ── Galería collage: 1 imagen grande (2/3) a la izquierda + 2 chicas
            apiladas a la derecha. La píldora abre el lightbox compartido. ── */}
        <section
          id="fotos"
          className="relative mb-8 scroll-mt-28 md:mb-10"
          aria-label="Galería del estudio"
        >
          <div className="grid gap-2 overflow-hidden rounded-2xl sm:h-[440px] sm:grid-cols-3 sm:grid-rows-2">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Ampliar galería"
              className="relative aspect-[4/3] cursor-zoom-in overflow-hidden sm:col-span-2 sm:row-span-2 sm:aspect-auto"
            >
              <SmoothImage
                src={gallery[0]}
                alt="Estudio Liz Cabriales"
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 66vw"
                priority
              />
            </button>
            <button
              type="button"
              onClick={() => openLightbox(1)}
              aria-label="Ampliar galería"
              className="relative hidden cursor-zoom-in overflow-hidden sm:block"
            >
              <SmoothImage
                src={gallery[1]}
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
              className="relative hidden cursor-zoom-in overflow-hidden sm:block"
            >
              <SmoothImage
                src={gallery[2]}
                alt=""
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="33vw"
                priority
              />
            </button>
          </div>

          {/* Píldora que abre el lightbox con toda la galería. */}
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-[12px] font-semibold text-[#111] shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            Ver todas las imágenes
          </button>
        </section>

        {/* Sentinel: marca el fin de la galería. Al cruzar bajo el navbar se
            revela la barra de secciones (no aparece durante header/galería). */}
        <div ref={sectionBarSentinelRef} aria-hidden className="h-0" />

        {/* ── Tabs de sección: barra FIJA bajo el navbar, oculta hasta llegar al
            contenido; se desliza desde abajo del navbar (no nace de golpe). ── */}
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
            <ul className="flex gap-1 overflow-x-auto py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sectionTabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <li key={tab.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onTabClick(tab.id)}
                      aria-current={active ? "true" : undefined}
                      className={`relative px-3 py-3.5 text-[13px] font-medium transition-colors sm:px-4 ${
                        active ? "text-[#111]" : "text-[#6b6b6b] hover:text-[#111]"
                      }`}
                    >
                      {tab.label}
                      {active && (
                        <span
                          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#111] sm:inset-x-4"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Sidebar primero en DOM → visible arriba en móvil; a la derecha en desktop */}
          <aside
            {...navSticky(
              "plain",
              // Mismo chrome que BookingSummary del flujo de reserva.
              "z-10 w-full max-w-[460px] justify-self-stretch rounded-xl border border-[#ececec] bg-[#fafafa] p-5 max-lg:static max-lg:top-auto max-lg:max-w-none lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:justify-self-end lg:p-6"
            )}
            // La barra de secciones (fixed, altura tabsBarH) vive bajo el navbar;
            // la card se pega DEBAJO de ella para que no le tape el encabezado.
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
                  <ServiceReviewsAverage summary={reviewSummary} />
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

            <div ref={bookCtaRef} className="mt-8">
              <Link href="/servicios/agendar" className={bookNowClassName}>
                Reservar ahora
              </Link>
            </div>
          </aside>

          {/* ── Columna principal ── */}
          <div className="min-w-0 space-y-14 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            {/* Servicios */}
            <section id="servicios" className="scroll-mt-36" aria-labelledby="servicios-heading">
              <h2
                id="servicios-heading"
                className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]"
              >
                Servicios
              </h2>

              {availableCategories.length > 0 && (
                <div className="mt-5">
                  <div
                    className="flex flex-wrap gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
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
                          className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-4 text-xs font-medium uppercase tracking-wide transition-colors ${
                            active
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
                          }`}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <ul className="mt-6 divide-y divide-neutral-200/80 border-y border-neutral-200/80">
                {visibleServices.length === 0 ? (
                  <li className="py-10 text-center text-[14px] text-neutral-400">
                    No hay servicios en esta categoría.
                  </li>
                ) : (
                  visibleServices.map((service) => (
                    <li
                      key={service.id}
                      className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-semibold leading-snug text-[#111]">
                          {service.name}
                        </h3>
                        {!service.hide_duration_public && (
                          <p className="mt-1 text-[13px] text-[#8a8a8a]">
                            {formatDuration(service.duration_min)}
                          </p>
                        )}
                        {!service.hide_price_public && (
                          <p className="mt-2 text-[15px] font-semibold text-[#111]">
                            {formatPrice(service.price)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/servicios/agendar?servicio=${encodeURIComponent(service.id)}`}
                        className={`${storeInlineButtonClassName} shrink-0`}
                      >
                        Reservar
                      </Link>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-6">
                <Link
                  href="/servicios/agendar"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-4 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:bg-neutral-800"
                >
                  Ver todo
                </Link>
              </div>
            </section>

            {/* Equipo */}
            {activePros.length > 0 && (
              <section id="equipo" className="scroll-mt-36" aria-labelledby="equipo-heading">
                <div className="flex items-baseline justify-between gap-4">
                  <h2
                    id="equipo-heading"
                    className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]"
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
            <ServiceReviewsSection
              initialReviews={reviews}
              initialSummary={reviewSummary}
              isAuthenticated={isAuthenticated}
              ownReview={ownReview}
            />

            {/* Portfolio */}
            <section id="portfolio" className="scroll-mt-36" aria-labelledby="portfolio-heading">
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  id="portfolio-heading"
                  className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]"
                >
                  Portfolio{" "}
                  <span className="text-[16px] font-normal text-neutral-400">
                    {portfolio.length}
                  </span>
                </h2>
                <Link
                  href="/nail-art"
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a6d26] transition-opacity hover:opacity-80"
                >
                  Ver todo
                </Link>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {portfolio.slice(0, 6).map((item) => {
                  const inner = (
                    <span className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                      <SmoothImage
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </span>
                  )
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link href={item.href} className="group block">
                          {inner}
                        </Link>
                      ) : (
                        <div className="group">{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Acerca de */}
            <section id="acerca" className="scroll-mt-36" aria-labelledby="acerca-heading">
              <h2
                id="acerca-heading"
                className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]"
              >
                Acerca de
              </h2>
              <p className="mt-5 max-w-[58ch] text-[14px] leading-relaxed text-[#5a5a5a]">
                {ABOUT_TEXT}
              </p>

              <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100">
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
            </section>
          </div>
        </div>
      </div>

      {/* Sticky móvil bajo tabs (Fotos / Servicios / …) — no pegado al navbar */}
      {mobileBookBar && (
        <div
          className="navbar-follow-collapse fixed left-0 right-0 z-20 border-b border-neutral-200 bg-ivory/85 backdrop-blur-md lg:hidden"
          style={{
            top: `calc(var(--navbar-actual-h, 64px) + ${tabsBarH}px)`,
          }}
        >
          <div className="site-container">
            <div className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                onClick={() =>
                  bookCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
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
              </button>
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
          images={gallery}
          startIndex={lightboxIndex}
          alt="Galería del estudio"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </main>
  )
}
