"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/appointments", label: "Agenda" },
  { href: "/admin/courses", label: "Cursos" },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex flex-wrap items-center gap-8 font-medium"
      aria-label="Secciones del panel"
    >
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="relative group text-[13px] tracking-[0.05em] text-[var(--foreground)]"
          aria-current={isActivePath(pathname, href) ? "page" : undefined}
        >
          <span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
            {label}
          </span>
          <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full" />
        </Link>
      ))}
    </nav>
  )
}
