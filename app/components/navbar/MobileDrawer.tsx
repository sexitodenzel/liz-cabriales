"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
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
import TiendaMobileAccordion from "./TiendaMobileAccordion"
import { useCart } from "../cart/CartContext"

type Section = "Tienda" | "Academia" | "Servicios" | null

type Props = {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  tiendaCategories?: TiendaCategory[]
}

const NAV_SECTIONS = [
  { key: "Tienda" as const,    label: "Tienda",    categories: tiendaCategories,    href: "/tienda",    sectionLabel: "toda la tienda" },
  { key: "Academia" as const,  label: "Academia",  categories: cursosCategories,    href: "/academia",  sectionLabel: "cursos" },
  { key: "Servicios" as const, label: "Servicios", categories: serviciosCategories, href: "/servicios", sectionLabel: "servicios" },
]

export default function MobileDrawer({
  isOpen,
  onClose,
  isLoggedIn,
  tiendaCategories: tiendaMenuCategories = tiendaCategories,
}: Props) {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const [openSection, setOpenSection] = useState<Section>(null)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const prevPathname = useRef(pathname)

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
    if (!isOpen) {
      setOpenSection(null)
      setOpenCategory(null)
    }
  }, [isOpen])

  const toggleSection = (section: Section) => {
    setOpenSection((prev) => (prev === section ? null : section))
    setOpenCategory(null)
  }

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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 overflow-y-auto">

          {/* Nav sections */}
          <div>
            {NAV_SECTIONS.map(({ key, label, categories, href, sectionLabel }) => {
              const isExpanded = openSection === key
              const sectionCategories =
                key === "Tienda" ? tiendaMenuCategories : categories
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    className="flex w-full items-center justify-between px-5 py-[18px] text-left"
                  >
                    <span className={`text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors ${isExpanded ? "text-[#C6A75E]" : "text-[#1a1a1a]"}`}>
                      {label}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[#C6A75E]" : "text-[#1a1a1a]"}`}
                    />
                  </button>

                  <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="px-5 pb-4">
                        <TiendaMobileAccordion
                          openCategory={openCategory}
                          setOpenCategory={setOpenCategory}
                          onClose={onClose}
                          categories={sectionCategories}
                          sectionHref={href}
                          sectionLabel={sectionLabel}
                        />
                      </div>
                    </div>
                  </div>

                  {key === "Tienda" && (
                    <>
                      <Link
                        href="/tienda/nuevos"
                        onClick={onClose}
                        className="flex w-full items-center justify-between px-5 py-[18px]"
                      >
                        <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
                          Nuevos lanzamientos
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
                      </Link>
                      <Link
                        href="/tienda/mas-vendidos"
                        onClick={onClose}
                        className="flex w-full items-center justify-between px-5 py-[18px]"
                      >
                        <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
                          Best sellers
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
                      </Link>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Nail Art */}
          <Link
            href="/nail-art"
            onClick={onClose}
            className="flex w-full items-center justify-between px-5 py-[18px]"
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">
              Nail Art
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
          </Link>
          </div>

          {/* Utility section — grows to fill remaining height */}
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
