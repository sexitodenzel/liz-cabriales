"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/appointments", label: "Servicios" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/instructors", label: "Instructores" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/nail-art", label: "Nail Art" },
  { href: "/admin/resenas", label: "Reseñas" },
  { href: "/admin/top-searches", label: "Más buscados" },
  { href: "/admin/announcements", label: "Anuncios" },
  { href: "/admin/sobre-liz", label: "Sobre Liz" },
  { href: "/admin/accesos", label: "Accesos" },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex items-center justify-start gap-8">
        <nav
          className="flex flex-wrap items-center gap-13 font-medium capitalize"
          aria-label="Secciones del panel"
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = isActivePath(pathname, href)
            return (
            <Link
              key={href}
              href={href}
              className="relative group text-[13px] tracking-[0.05em] text-[#c9a84c]"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-[#e8c97a]" : "group-hover:text-[#e8c97a]"
                }`}
              >
                {label}
              </span>
              <span
                className={`absolute left-0 -bottom-1 h-[1px] bg-[#c9a84c] transition-all duration-200 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
