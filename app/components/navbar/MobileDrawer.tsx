"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, User, MessageCircle, Instagram, Facebook, MapPin, Heart } from "lucide-react"
import { usePathname } from "next/navigation"
import { tiendaCategories, cursosCategories, serviciosCategories } from "./menuData"
import TiendaMobileAccordion from "./TiendaMobileAccordion"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"

type Section = "Tienda" | "Academia" | "Servicios" | null

type Props = {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
}

const NAV_SECTIONS = [
  { key: "Tienda" as const,    label: "Tienda",    categories: tiendaCategories,    href: "/tienda",    sectionLabel: "toda la tienda" },
  { key: "Academia" as const,  label: "Academia",  categories: cursosCategories,    href: "/academia",  sectionLabel: "cursos" },
  { key: "Servicios" as const, label: "Servicios", categories: serviciosCategories, href: "/servicios", sectionLabel: "servicios" },
]

export default function MobileDrawer({ isOpen, onClose, isLoggedIn }: Props) {
  const pathname = usePathname()
  const { count: wishlistCount } = useWishlist()
  const [openSection, setOpenSection] = useState<Section>(null)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  useEffect(() => { onClose() }, [pathname])

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
        className={`fixed left-0 right-0 bottom-0 top-[var(--navbar-actual-h)] z-40 md:hidden bg-black/30 backdrop-blur-md transition-opacity duration-700 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={`fixed left-0 bottom-0 top-[var(--navbar-actual-h)] z-[45] flex w-2/3 flex-col bg-white md:hidden transition-opacity duration-700 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex-1 overflow-y-auto">

          {/* Nav sections */}
          <div>
            {NAV_SECTIONS.map(({ key, label, categories, href, sectionLabel }) => {
              const isExpanded = openSection === key
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
                          categories={categories}
                          sectionHref={href}
                          sectionLabel={sectionLabel}
                        />
                      </div>
                    </div>
                  </div>
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

          {/* Utility section */}
          <div className="bg-[#f8f7f5]">
            <Link href={isLoggedIn ? "/perfil" : "/login"} onClick={onClose} className="flex items-center gap-4 px-5 py-4">
              <User className="h-5 w-5 shrink-0 text-neutral-500" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
                {isLoggedIn ? "Mi cuenta" : "Iniciar sesión / Registrarse"}
              </span>
            </Link>

            <Link href="/wishlist" onClick={onClose} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4">
                <Heart className="h-5 w-5 shrink-0 text-neutral-500" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C6A75E] px-1.5 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <a
              href="https://maps.google.com/?q=Liz+Cabriales+Studio+Tampico+Tamaulipas+Mexico"
              target="_blank" rel="noopener noreferrer" onClick={onClose}
              className="flex items-center gap-4 px-5 py-4"
            >
              <MapPin className="h-5 w-5 shrink-0 text-neutral-500" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">Tampico, Tamaulipas</span>
            </a>

            <a href="https://wa.me/528332183399" target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex items-center gap-4 px-5 py-4">
              <MessageCircle className="h-5 w-5 shrink-0 text-neutral-500" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">833 218 3399</span>
            </a>
          </div>
        </div>

        {/* Social row */}
        <div className="shrink-0 flex items-center justify-around px-5 py-4">
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
