"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  MessageCircle,
  Instagram,
  Facebook,
  MapPin,
  Calendar,
  Clock,
  X,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { tiendaCategories, cursosCategories } from "./menuData"
import type { TiendaCategory } from "./menuData"
import type { BrandMenuItem } from "@/lib/navbar/brands-category"
import { formatFreeShippingThreshold } from "@/lib/constants/shipping"
import { Drawer } from "@/app/components/ui/motion/drawer"

type SectionKey = "Tienda" | "Academia" | "Servicios"

type DrawerView =
  | { kind: "root" }
  | { kind: "section"; section: SectionKey }
  | { kind: "category"; section: SectionKey; categorySlug: string }
  | { kind: "nail-art" }
  | { kind: "marcas" }
  | { kind: "conocenos" }

const CONOCENOS_LINKS: Array<{ label: string; href: string }> = [
  { label: "Su historia",        href: "/sobre-liz#sobre-liz" },
  { label: "Galería de eventos", href: "/sobre-liz#eventos" },
  { label: "Blog",               href: "/blog" },
  { label: "Academia",           href: "/academia" },
  { label: "Distribuidora",      href: "/tienda" },
  { label: "Servicios",          href: "/servicios" },
]

type NailArtTile = {
  id: string
  title: string
  slug: string
  cover_image: string | null
}

type AcademiaCourse = {
  id: string
  title: string
  cover: string | null
  start_date: string
  level: "beginner" | "intermediate" | "advanced" | "open"
}

const COURSE_LEVEL_LABEL: Record<AcademiaCourse["level"], string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
]

function parseDateBadge(dateStr: string): { day: number; month: string } {
  const [, m, d] = dateStr.split("-").map(Number)
  return { day: d, month: MONTHS_SHORT[m - 1] }
}

type Props = {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  tiendaCategories?: TiendaCategory[]
  brands?: BrandMenuItem[]
}

const SECTIONS: Array<{
  key: SectionKey
  href: string
  sectionLabel: string
  data: TiendaCategory[]
}> = [
  { key: "Tienda",    href: "/tienda",    sectionLabel: "toda la tienda", data: tiendaCategories },
  { key: "Servicios", href: "/servicios", sectionLabel: "servicios",      data: [] as TiendaCategory[] },
  { key: "Academia",  href: "/academia",  sectionLabel: "cursos",         data: cursosCategories },
]

const viewKey = (v: DrawerView): string => {
  if (v.kind === "root") return "root"
  if (v.kind === "section") return `section:${v.section}`
  if (v.kind === "category") return `category:${v.section}:${v.categorySlug}`
  if (v.kind === "conocenos") return "conocenos"
  if (v.kind === "marcas") return "marcas"
  return "nail-art"
}

export default function MobileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  tiendaCategories: tiendaMenuCategories = tiendaCategories,
  brands = [],
}: Props) {
  const pathname = usePathname()
  const [stack, setStack] = useState<DrawerView[]>([{ kind: "root" }])
  const [activeIndex, setActiveIndex] = useState(0)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [nailArtPosts, setNailArtPosts] = useState<NailArtTile[] | null>(null)
  const [academiaCourses, setAcademiaCourses] = useState<AcademiaCourse[] | null>(null)
  const [serviciosMenuCategories, setServiciosMenuCategories] = useState<TiendaCategory[] | null>(null)
  const [mounted, setMounted] = useState(false)
  const prevPathname = useRef(pathname)

  const sectionsByKey = useMemo(() => {
    return SECTIONS.map((s) => {
      if (s.key === "Tienda") return { ...s, data: tiendaMenuCategories }
      if (s.key === "Servicios" && serviciosMenuCategories) {
        return { ...s, data: serviciosMenuCategories }
      }
      return s
    })
  }, [tiendaMenuCategories, serviciosMenuCategories])

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      onClose()
      prevPathname.current = pathname
    }
  }, [pathname, onClose])

  // Resetear al cerrar (no al abrir) para no forzar un re-render a mitad del slide.
  useEffect(() => {
    if (isOpen) return
    setStack([{ kind: "root" }])
    setActiveIndex(0)
    setPendingIndex(null)
  }, [isOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (serviciosMenuCategories !== null) return
    void fetch("/api/navbar/servicios-menu")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const payload = json?.data
        if (Array.isArray(payload)) {
          setServiciosMenuCategories(payload)
          return
        }
        setServiciosMenuCategories(
          Array.isArray(payload?.categories) ? payload.categories : []
        )
      })
      .catch(() => setServiciosMenuCategories([]))
  }, [serviciosMenuCategories])

  useEffect(() => {
    if (pendingIndex === null) return
    const raf = requestAnimationFrame(() => {
      setActiveIndex(pendingIndex)
      setPendingIndex(null)
    })
    return () => cancelAnimationFrame(raf)
  }, [pendingIndex])

  const push = (view: DrawerView) => {
    setStack((prev) => [...prev.slice(0, activeIndex + 1), view])
    setPendingIndex(activeIndex + 1)
    if (view.kind === "nail-art" && nailArtPosts === null) {
      void fetch("/api/nail-art/list?sort=likes&limit=6")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => setNailArtPosts(Array.isArray(json?.data) ? json.data : []))
        .catch(() => setNailArtPosts([]))
    }
    if (view.kind === "section" && view.section === "Academia" && academiaCourses === null) {
      void fetch("/api/navbar/academia-courses")
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => setAcademiaCourses(Array.isArray(json?.data) ? json.data : []))
        .catch(() => setAcademiaCourses([]))
    }
  }

  const pop = () => {
    setPendingIndex(null)
    setActiveIndex((i) => Math.max(0, i - 1))
  }

  const findSection = (key: SectionKey) =>
    sectionsByKey.find((s) => s.key === key)!

  const findCategory = (sectionKey: SectionKey, slug: string) =>
    findSection(sectionKey).data.find((c) => c.slug === slug)

  if (!mounted) return null

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      side="left"
      ariaLabel="Menú"
      preload
      backdropClassName="md:bg-black/40"
      className="w-full max-w-none overflow-hidden md:w-[380px]"
    >
      {/* Close button */}
      <div className="flex shrink-0 items-center justify-end px-3 py-2 lg:py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex items-center justify-center rounded-full p-1 text-neutral-400 transition-colors hover:text-[#1a1a1a]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Sliding nav stack */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {stack.map((view, i) => {
          const isActive = i === activeIndex
          const offset = (i - activeIndex) * 100
          return (
            <div
              key={`${viewKey(view)}-${i}`}
              className="scrollbar-hide absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-x-none bg-white transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] will-change-transform"
              style={{ transform: `translate3d(${offset}%, 0, 0)` }}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              {view.kind === "root" && (
                <RootPanel
                  onPushSection={(section) => push({ kind: "section", section })}
                  onPushNailArt={() => push({ kind: "nail-art" })}
                  onPushMarcas={() => push({ kind: "marcas" })}
                  onPushConocenos={() => push({ kind: "conocenos" })}
                  onClose={onClose}
                  isLoggedIn={isLoggedIn}
                />
              )}
              {view.kind === "section" && (
                <SectionPanel
                  section={findSection(view.section)}
                  academiaCourses={academiaCourses}
                  onBack={pop}
                  onClose={onClose}
                  onPushCategory={(slug) =>
                    push({ kind: "category", section: view.section, categorySlug: slug })
                  }
                />
              )}
              {view.kind === "category" && (() => {
                const cat = findCategory(view.section, view.categorySlug)
                if (!cat) return null
                return (
                  <CategoryPanel
                    category={cat}
                    onBack={pop}
                    onClose={onClose}
                  />
                )
              })()}
              {view.kind === "nail-art" && (
                <NailArtPanel
                  posts={nailArtPosts}
                  onBack={pop}
                  onClose={onClose}
                />
              )}
              {view.kind === "marcas" && (
                <MarcasPanel
                  brands={brands}
                  onBack={pop}
                  onClose={onClose}
                />
              )}
              {view.kind === "conocenos" && (
                <ConocenosPanel onBack={pop} onClose={onClose} />
              )}
            </div>
          )
        })}
      </div>

      {/* Social row */}
      <div className="shrink-0 flex items-center justify-around border-t border-neutral-200 px-4 py-5 md:px-6 lg:py-6">
        <a href="https://instagram.com/liz_cabriales" target="_blank" rel="noopener noreferrer" aria-label="Instagram" onClick={onClose}>
          <Instagram className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#c6a75e]" />
        </a>
        <a href="https://www.facebook.com/profile.php?id=100008326095757" target="_blank" rel="noopener noreferrer" aria-label="Facebook" onClick={onClose}>
          <Facebook className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#c6a75e]" />
        </a>
        <a href="https://wa.me/528332183399" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={onClose}>
          <MessageCircle className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#c6a75e]" />
        </a>
      </div>
    </Drawer>
  )
}

/* ============================================================
   PANELS
   ============================================================ */

type RootPanelProps = {
  onPushSection: (section: SectionKey) => void
  onPushNailArt: () => void
  onPushMarcas: () => void
  onPushConocenos: () => void
  onClose: () => void
  isLoggedIn: boolean
}

function RootPanel({ onPushSection, onPushNailArt, onPushMarcas, onPushConocenos, onClose, isLoggedIn }: RootPanelProps) {
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      {/* Nav sections */}
      <div>
        {SECTIONS.map(({ key }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPushSection(key)}
            className="flex w-full items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] text-left transition-colors hover:bg-neutral-50 lg:py-[22px]"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] lg:text-[14px]">
              {key}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
          </button>
        ))}

        <button
          type="button"
          onClick={onPushNailArt}
          className="flex w-full items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] text-left transition-colors hover:bg-neutral-50 lg:py-[22px]"
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] lg:text-[14px]">
            Nail Art
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
        </button>

        <button
          type="button"
          onClick={onPushMarcas}
          className="flex w-full items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] text-left transition-colors hover:bg-neutral-50 lg:py-[22px]"
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] lg:text-[14px]">
            Marcas
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
        </button>

        <button
          type="button"
          onClick={onPushConocenos}
          className="flex w-full items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] text-left transition-colors hover:bg-neutral-50 lg:py-[22px]"
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#a8862f] lg:text-[14px]">
            Conócenos
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#a8862f]" />
        </button>
      </div>

      {/* Utility section */}
      <div className="flex min-h-0 flex-1 flex-col bg-[#f8f7f5]">
        <Link href={isLoggedIn ? "/perfil" : "/login"} onClick={onClose} className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]">
          <User className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a] lg:text-[13px]">
            {isLoggedIn ? "Mi cuenta" : "Iniciar sesión / Registrarse"}
          </span>
        </Link>

        <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]">
          <Heart className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a] lg:text-[13px]">
            Wish list
          </span>
        </Link>

        <Link href="/servicios" onClick={onClose} className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]">
          <Calendar className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a] lg:text-[13px]">
            Agenda tu cita
          </span>
        </Link>

        <a
          href="https://maps.google.com/?q=Liz+Cabriales+Studio+Nayarit+204+Cd+Madero+Tamaulipas"
          target="_blank" rel="noopener noreferrer" onClick={onClose}
          className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]"
        >
          <MapPin className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a] lg:text-[13px]">
            Visítanos
          </span>
        </a>

        <a href="https://wa.me/528332183399" target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]">
          <MessageCircle className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a] lg:text-[13px]">833 218 3399</span>
        </a>

        <div className="flex items-center gap-3 pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-[18px]">
          <Clock className="h-5 w-5 shrink-0 text-neutral-500 lg:h-[22px] lg:w-[22px]" />
          <span className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a] lg:text-[12px]">
            Lun–Sáb 10 a.m.–7 p.m. · Dom 10–2 (días de curso)
          </span>
        </div>

        <div className="mt-auto pl-3 pr-3 md:pl-4 md:pr-5 py-4 lg:py-5">
          <div className="mx-auto w-fit max-w-full overflow-hidden">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500 lg:text-[11px]">
              Envío gratis en compras mayores a {formatFreeShippingThreshold()}
            </p>
            <div className="mt-2 flex w-full items-center justify-between gap-x-2 text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500 lg:mt-2.5 lg:text-[11px]">
              <Link
                href="/terminos-y-condiciones"
                onClick={onClose}
                className="shrink-0 transition-colors hover:text-[#c6a75e]"
              >
                Términos
              </Link>
              <Link
                href="/aviso-de-privacidad"
                onClick={onClose}
                className="shrink-0 text-right transition-colors hover:text-[#c6a75e]"
              >
                Aviso de privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type SectionPanelProps = {
  section: { key: SectionKey; href: string; sectionLabel: string; data: TiendaCategory[] }
  academiaCourses: AcademiaCourse[] | null
  onBack: () => void
  onClose: () => void
  onPushCategory: (categorySlug: string) => void
}

function SectionPanel({ section, academiaCourses, onBack, onClose, onPushCategory }: SectionPanelProps) {
  // Placeholders etiquetados para Servicios: primeros servicios (o categorías)
  // que llenan el espacio hasta que existan fotos reales.
  const servicioTiles =
    section.key === "Servicios"
      ? (section.data.flatMap((c) => c.subcategories.map((s) => s.label)).length > 0
          ? section.data.flatMap((c) => c.subcategories.map((s) => s.label))
          : section.data.map((c) => c.label)
        ).slice(0, 4)
      : []

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <PanelHeader title={section.key} onBack={onBack} />

      <div className="flex flex-1 flex-col">
        <Link
          href={section.href}
          onClick={onClose}
          className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c6a75e] transition-colors hover:bg-neutral-50 lg:py-[18px] lg:text-[13px]"
        >
          <span>Ver {section.sectionLabel}</span>
        </Link>

        {section.data.map((cat) => {
          if (cat.subcategories.length === 0) {
            return (
              <Link
                key={cat.slug}
                href={cat.href}
                onClick={onClose}
                className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 transition-colors hover:bg-neutral-50 lg:py-[18px]"
              >
                <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a] lg:text-[14px]">
                  {cat.label}
                </span>
              </Link>
            )
          }
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onPushCategory(cat.slug)}
              className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 text-left transition-colors hover:bg-neutral-50 lg:py-[18px]"
            >
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a] lg:text-[14px]">
                {cat.label}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
            </button>
          )
        })}

        {/* Espacio vivo: flyers de próximos cursos (Academia) o placeholders de
            servicios (Servicios), ajustados al ancho del drawer. */}
        {section.key === "Academia" && (
          <div className="mt-2 px-3 pb-5 pt-3 md:px-4">
            <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Próximos eventos
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {academiaCourses === null
                ? Array.from({ length: 2 }).map((_, i) => <MobileTileSkeleton key={i} />)
                : academiaCourses.map((course) => (
                    <CourseFlyerTile key={course.id} course={course} onClose={onClose} />
                  ))}
            </div>
          </div>
        )}

        {section.key === "Servicios" && servicioTiles.length > 0 && (
          <div className="mt-2 px-3 pb-5 pt-3 md:px-4">
            <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Nuestros servicios
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {servicioTiles.map((label) => (
                <ServicioPlaceholderTile key={label} label={label} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CourseFlyerTile({
  course,
  onClose,
}: {
  course: AcademiaCourse
  onClose: () => void
}) {
  const { day, month } = parseDateBadge(course.start_date)
  return (
    <Link
      href={`/academia/${course.id}`}
      onClick={onClose}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100">
        {course.cover ? (
          <Image
            src={course.cover}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 40vw, 180px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45" />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#141414]/55 px-2 py-[3px] text-[8px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f] backdrop-blur-md">
          {COURSE_LEVEL_LABEL[course.level]}
        </span>
        <span className="absolute bottom-1.5 left-1.5 flex items-baseline gap-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
          <span
            className="text-[15px] font-semibold leading-none"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {day}
          </span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#e2c06f]">
            {month}
          </span>
        </span>
      </div>
      <span className="line-clamp-2 text-[12px] font-medium leading-snug text-[#1a1a1a]">
        {course.title}
      </span>
    </Link>
  )
}

function ServicioPlaceholderTile({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex aspect-[3/4] w-full items-end overflow-hidden rounded-sm bg-neutral-100">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200" />
        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-neutral-600">
          Próximamente
        </span>
        <p className="relative z-10 p-2 text-[11px] font-medium leading-snug text-neutral-600 line-clamp-2">
          {label}
        </p>
      </div>
    </div>
  )
}

function MobileTileSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-neutral-100" />
      <div className="h-3 w-3/4 animate-pulse rounded-sm bg-neutral-100" />
    </div>
  )
}

type CategoryPanelProps = {
  category: TiendaCategory
  onBack: () => void
  onClose: () => void
}

function CategoryPanel({ category, onBack, onClose }: CategoryPanelProps) {
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <PanelHeader title={category.label} onBack={onBack} />

      <div className="flex-1">
        <Link
          href={category.href}
          onClick={onClose}
          className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c6a75e] transition-colors hover:bg-neutral-50 lg:py-[18px] lg:text-[13px]"
        >
          <span>Ver todo en {category.label}</span>
        </Link>

        {category.subcategories.map((sub) => (
          <Link
            key={sub.label}
            href={sub.href}
            onClick={onClose}
            className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 transition-colors hover:bg-neutral-50 lg:py-[18px]"
          >
            <span className="text-[13px] text-neutral-700 lg:text-[14px]">{sub.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="sticky top-0 z-10 flex w-full items-center gap-2 bg-white px-4 py-[18px] text-left md:px-6 lg:py-[22px]"
      aria-label="Volver"
    >
      <ChevronLeft className="h-4 w-4 shrink-0 text-neutral-500" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-500 lg:text-[14px]">
        {title}
      </span>
    </button>
  )
}

type NailArtPanelProps = {
  posts: NailArtTile[] | null
  onBack: () => void
  onClose: () => void
}

function NailArtPanel({ posts, onBack, onClose }: NailArtPanelProps) {
  const isLoading = posts === null
  const items = posts ?? []
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <PanelHeader title="Nail Art" onBack={onBack} />
      <div className="px-4 pt-2 md:px-6">
        <p className="text-[12px] leading-relaxed text-neutral-500">
          Inspírate con diseños hechos por productos de nuestro catálogo
        </p>
        <Link
          href="/nail-art#subir"
          onClick={onClose}
          className="mt-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c6a75e]"
        >
          Subir inspiración
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-3 py-5 md:px-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)
          : items.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                href={`/nail-art/${post.slug}`}
                onClick={onClose}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 40vw, 200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <span className="text-[12px] font-medium leading-snug text-[#1a1a1a]">
                  {post.title}
                </span>
              </Link>
            ))}
        <Link
          href="/nail-art"
          onClick={onClose}
          className="group flex flex-col gap-2"
        >
          <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-sm bg-[#f1ece4]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e]">
              Ver todo
            </span>
          </div>
          <span className="text-[12px] font-medium leading-snug text-[#1a1a1a]">
            Todos los looks
          </span>
        </Link>
      </div>
    </div>
  )
}

function TileSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-neutral-100" />
      <div className="h-3 w-3/4 animate-pulse rounded-sm bg-neutral-100" />
    </div>
  )
}

type MarcasPanelProps = {
  brands: BrandMenuItem[]
  onBack: () => void
  onClose: () => void
}

function MarcasPanel({ brands, onBack, onClose }: MarcasPanelProps) {
  const sortedBrands = [...brands].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  )

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <PanelHeader title="Marcas" onBack={onBack} />

      <div className="flex-1">
        <Link
          href="/marcas"
          onClick={onClose}
          className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c6a75e] transition-colors hover:bg-neutral-50 lg:py-[18px] lg:text-[13px]"
        >
          <span>Ver todas las marcas</span>
        </Link>

        {sortedBrands.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-neutral-500 md:px-6">
            Cargando marcas…
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 pb-6 pt-2 md:px-4">
            {sortedBrands.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
                  onClick={onClose}
                  className="group flex items-center gap-2.5 rounded-sm px-1 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-[#c6a75e]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
                    {brand.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={brand.logo_url}
                        alt=""
                        aria-hidden
                        className="h-full w-full object-contain p-0.5"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="text-[12px] font-semibold uppercase text-neutral-400"
                      >
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 truncate">{brand.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ConocenosPanel({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <PanelHeader title="Conócenos" onBack={onBack} />

      <div className="flex-1">
        <Link
          href="/sobre-liz"
          onClick={onClose}
          className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c6a75e] transition-colors hover:bg-neutral-50 lg:py-[18px] lg:text-[13px]"
        >
          <span>Ver toda la página</span>
        </Link>

        {CONOCENOS_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onClose}
            className="flex w-full items-center justify-between px-4 py-[16px] md:px-6 transition-colors hover:bg-neutral-50 lg:py-[18px]"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a] lg:text-[14px]">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
