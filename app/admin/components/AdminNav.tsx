"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Inicio",
    match: (path: string) => path === "/admin",
  },
  {
    href: "/admin/products",
    label: "Productos",
    match: (path: string) => path.startsWith("/admin/products"),
  },
  {
    href: "/admin/orders",
    label: "Órdenes",
    match: (path: string) => path.startsWith("/admin/orders"),
  },
  {
    href: "/admin/appointments",
    label: "Agenda",
    match: (path: string) => path.startsWith("/admin/appointments"),
  },
  {
    href: "/admin/courses",
    label: "Cursos",
    match: (path: string) => path.startsWith("/admin/courses"),
  },
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex flex-wrap items-center gap-8 font-medium"
      aria-label="Secciones del panel"
    >
      {NAV_ITEMS.map(({ href, label, match }) => {
        const isActive = match(pathname)

        return (
          <Link
            key={href}
            href={href}
            className="relative group text-[13px] tracking-[0.05em] text-[var(--foreground)]"
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`transition-colors duration-200 ${
                isActive ? "text-[#C6A75E]" : "group-hover:text-[#C6A75E]"
              }`}
            >
              {label}
            </span>
            <span
              className={`absolute left-0 -bottom-1 h-[1px] bg-[#C6A75E] transition-all duration-200 ${
                isActive ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
