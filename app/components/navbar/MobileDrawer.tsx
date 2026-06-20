"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import {
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  MessageCircle,
  Instagram,
  Facebook,
  MapPin,
  ShoppingBag,
  Calendar,
  Mail,
  Clock,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { tiendaCategories, cursosCategories, serviciosCategories } from "./menuData"
import type { TiendaCategory } from "./menuData"
import { useCart } from "../cart/CartContext"

type SectionKey = "Tienda" | "Academia" | "Servicios"

type DrawerView =
  | { kind: "root" }
  | { kind: "section"; section: SectionKey }
  | { kind: "category"; section: SectionKey; categorySlug: string }

type Props = {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  tiendaCategories?: TiendaCategory[]
}

const SECTIONS: Array<{
  key: SectionKey
  href: string
  sectionLabel: string
  data: TiendaCategory[]
}> = [
  { key: "Tienda",    href: "/tienda",    sectionLabel: "toda la tienda", data: tiendaCategories },
  { key: "Academia",  href: "/academia",  sectionLabel: "cursos",         data: cursosCategories },
  { key: "Servicios", href: "/servicios", sectionLabel: "servicios",      data: serviciosCategories },
]

const viewKey = (v: DrawerView): string => {
  if (v.kind === "root") return "root"
  if (v.kind === "section") return `section:${v.section}`
  return `category:${v.section}:${v.categorySlug}`
}

export default function MobileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  tiendaCategories: tiendaMenuCategories = tiendaCategories,
}: Props) {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [stack, setStack] = useState<DrawerView[]>([{ kind: "root" }])
  const [activeIndex, setActiveIndex] = useState(0)
  const prevPathname = useRef(pathname)

  const sectionsByKey = useMemo(() => {
    return SECTIONS.map((s) =>
      s.key === "Tienda" ? { ...s, data: tiendaMenuCategories } : s
    )
  }, [tiendaMenuCategories])

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      onClose()
      prevPathname.current = pathname
    }
  }, [pathname, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setStack([{ kind: "root" }])
      setActiveIndex(0)
    }
  }, [isOpen])

  const push = (view: DrawerView) => {
    setStack((prev) => [...prev.slice(0, activeIndex + 1), view])
    setActiveIndex((i) => i + 1)
  }

  const pop = () => {
    setActiveIndex((i) => Math.max(0, i - 1))
  }

  const findSection = (key: SectionKey) =>
    sectionsByKey.find((s) => s.key === key)!

  const findCategory = (sectionKey: SectionKey, slug: string) =>
    findSection(sectionKey).data.find((c) => c.slug === slug)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed left-0 right-0 bottom-0 top-[var(--navbar-actual-h)] z-40 bg-black/30 backdrop-blur-md transition-opacity duration-700 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={`fixed left-0 bottom-0 top-[var(--navbar-actual-h)] z-[45] flex w-2/3 max-w-sm flex-col bg-white transition-opacity duration-700 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Sliding nav strip */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] will-change-transform"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          >
            {stack.map((view, i) => {
              const isActive = i === activeIndex
              return (
                <div
                  key={`${viewKey(view)}-${i}`}
                  className="h-full w-full shrink-0 overflow-y-auto"
                  aria-hidden={!isActive}
                  inert={!isActive}
                >
                  {view.kind === "root" && (
                    <RootPanel
                      onPushSection={(section) => push({ kind: "section", section })}
                      onClose={onClose}
                      isLoggedIn={isLoggedIn}
                      itemCount={itemCount}
                    />
                  )}
                  {view.kind === "section" && (
                    <SectionPanel
                      section={findSection(view.section)}
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Social row */}
        <div className="shrink-0 flex items-center justify-around border-t border-neutral-200 px-5 py-5">
          <a href="https://instagram.com/liz_cabriales" target="_blank" rel="noopener noreferrer" aria-label="Instagram" onClick={onClose}>
            <Instagram className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#C6A75E]" />
          </a>
          <a href="https://www.facebook.com/profile.php?id=100008326095757" target="_blank" rel="noopener noreferrer" aria-label="Facebook" onClick={onClose}>
            <Facebook className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#C6A75E]" />
          </a>
          <a href="https://wa.me/528332183399" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={onClose}>
            <MessageCircle className="h-5 w-5 text-neutral-400 transition-colors hover:text-[#C6A75E]" />
          </a>
        </div>
      </div>
    </>
  )
}

/* ============================================================
   PANELS
   ============================================================ */

type RootPanelProps = {
  onPushSection: (section: SectionKey) => void
  onClose: () => void
  isLoggedIn: boolean
  itemCount: number
}

function RootPanel({ onPushSection, onClose, isLoggedIn, itemCount }: RootPanelProps) {
  return (
    <div className="flex min-h-full flex-col">
      {/* Nav sections */}
      <div>
        {SECTIONS.map(({ key }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPushSection(key)}
            className="flex w-full items-center justify-between px-5 py-[18px] text-left transition-colors hover:bg-neutral-50"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
              {key}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
          </button>
        ))}

        <Link
          href="/nail-art"
          onClick={onClose}
          className="flex w-full items-center justify-between px-5 py-[18px] transition-colors hover:bg-neutral-50"
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
            Nail Art
          </span>
        </Link>
      </div>

      {/* Utility section */}
      <div className="flex min-h-0 flex-1 flex-col bg-[#f8f7f5]">
        <p className="border-b border-neutral-200/80 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          Envío gratis en compras mayores a $999
        </p>

        <Link href={isLoggedIn ? "/perfil" : "/login"} onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <User className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            {isLoggedIn ? "Mi cuenta" : "Iniciar sesión / Registrarse"}
          </span>
        </Link>

        <Link href="/wishlist" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <Heart className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            Wish list
          </span>
        </Link>

        <Link href="/carrito" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <span className="relative shrink-0">
            <ShoppingBag className="h-5 w-5 text-neutral-500" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#C6A75E] px-0.5 text-[9px] text-white">
                {itemCount}
              </span>
            )}
          </span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            Carrito
          </span>
        </Link>

        <Link href="/citas" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <Calendar className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            Agenda tu cita
          </span>
        </Link>

        <a
          href="https://maps.google.com/?q=Liz+Cabriales+Studio+Nayarit+204+Cd+Madero+Tamaulipas"
          target="_blank" rel="noopener noreferrer" onClick={onClose}
          className="flex items-center gap-4 px-5 py-4"
        >
          <MapPin className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            Visítanos
          </span>
        </a>

        <a href="https://wa.me/528332183399" target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <MessageCircle className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">833 218 3399</span>
        </a>

        <a href="mailto:academializcabriales@gmail.com" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
          <Mail className="h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]">
            academializcabriales@gmail.com
          </span>
        </a>

        <div className="flex items-start gap-4 px-5 py-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
          <span className="text-[11px] font-medium leading-relaxed tracking-[0.06em] text-neutral-600">
            Lun–Sáb, 9:00 a.m. – 7:00 p.m.
          </span>
        </div>

        <div className="mt-auto border-t border-neutral-200/80 px-5 py-4">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.1em] text-neutral-500">
            <Link href="/aviso-de-privacidad" onClick={onClose} className="transition-colors hover:text-[#C6A75E]">
              Aviso de privacidad
            </Link>
            <span className="text-neutral-300">·</span>
            <Link href="/terminos-y-condiciones" onClick={onClose} className="transition-colors hover:text-[#C6A75E]">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

type SectionPanelProps = {
  section: { key: SectionKey; href: string; sectionLabel: string; data: TiendaCategory[] }
  onBack: () => void
  onClose: () => void
  onPushCategory: (categorySlug: string) => void
}

function SectionPanel({ section, onBack, onClose, onPushCategory }: SectionPanelProps) {
  return (
    <div className="flex min-h-full flex-col">
      <PanelHeader title={section.key} onBack={onBack} />

      <div className="flex-1">
        <Link
          href={section.href}
          onClick={onClose}
          className="flex w-full items-center justify-between px-5 py-[16px] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C6A75E] transition-colors hover:bg-neutral-50"
        >
          <span>Ver {section.sectionLabel}</span>
        </Link>

        {section.key === "Tienda" && (
          <>
            <Link
              href="/tienda/nuevos"
              onClick={onClose}
              className="flex w-full items-center justify-between border-t border-neutral-100 px-5 py-[16px] transition-colors hover:bg-neutral-50"
            >
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">
                Nuevos lanzamientos
              </span>
            </Link>
            <Link
              href="/tienda/mas-vendidos"
              onClick={onClose}
              className="flex w-full items-center justify-between border-t border-neutral-100 px-5 py-[16px] transition-colors hover:bg-neutral-50"
            >
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">
                Best sellers
              </span>
            </Link>
          </>
        )}

        {section.data.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onPushCategory(cat.slug)}
            className="flex w-full items-center justify-between border-t border-neutral-100 px-5 py-[16px] text-left transition-colors hover:bg-neutral-50"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">
              {cat.label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
          </button>
        ))}
      </div>
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
    <div className="flex min-h-full flex-col">
      <PanelHeader title={category.label} onBack={onBack} />

      <div className="flex-1">
        <Link
          href={category.href}
          onClick={onClose}
          className="flex w-full items-center justify-between px-5 py-[16px] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C6A75E] transition-colors hover:bg-neutral-50"
        >
          <span>Ver todo en {category.label}</span>
        </Link>

        {category.subcategories.map((sub) => (
          <Link
            key={sub.label}
            href={sub.href}
            onClick={onClose}
            className="flex w-full items-center justify-between border-t border-neutral-100 px-5 py-[16px] transition-colors hover:bg-neutral-50"
          >
            <span className="text-[13px] text-neutral-700">{sub.label}</span>
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
      className="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-neutral-200 bg-white px-5 py-[18px] text-left"
      aria-label="Volver"
    >
      <ChevronLeft className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
        {title}
      </span>
    </button>
  )
}
