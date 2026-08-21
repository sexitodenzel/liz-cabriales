"use client"

import type { LucideProps } from "lucide-react"
import type { FC } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Package,
  Sparkles,
  SplitSquareHorizontal,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

type NavItem = {
  href: string
  label: string
  icon: FC<LucideProps>
}

type NavGroup = {
  title: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Inicio", icon: LayoutDashboard }],
  },
  {
    title: "Tienda",
    items: [
      { href: "/admin/products", label: "Productos", icon: Package },
      { href: "/admin/orders", label: "Órdenes", icon: ClipboardList },
    ],
  },
  {
    title: "Estudio",
    items: [
      { href: "/admin/appointments", label: "Servicios", icon: CalendarDays },
      { href: "/admin/courses", label: "Cursos", icon: GraduationCap },
      { href: "/admin/instructors", label: "Instructores", icon: Users },
    ],
  },
  {
    title: "Contenido",
    items: [
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/nail-art", label: "Nail Art", icon: Sparkles },
      { href: "/admin/home-spotlight", label: "Spotlight", icon: Images },
      { href: "/admin/antes-despues", label: "Antes y Después", icon: SplitSquareHorizontal },
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/announcements", label: "Anuncios", icon: Megaphone },
      { href: "/admin/sobre-liz", label: "Sobre Liz", icon: Heart },
    ],
  },
  {
    title: "Comunidad",
    items: [
      { href: "/admin/resenas", label: "Reseñas", icon: Star },
      { href: "/admin/top-searches", label: "Más buscados", icon: TrendingUp },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/admin/accesos", label: "Accesos", icon: KeyRound }],
  },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 px-3 py-2" aria-label="Secciones del panel">
      {NAV_GROUPS.map((group, groupIdx) => (
        <div key={group.title ?? `group-${groupIdx}`} className="flex flex-col gap-0.5">
          {group.title && (
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] tracking-[0.01em] transition-colors ${
                  active
                    ? "bg-white/[0.07] text-[#e8c97a]"
                    : "text-white/65 hover:bg-white/[0.04] hover:text-white/90"
                }`}
              >
                <Icon
                  className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                    active ? "text-[#e8c97a]" : "text-white/45 group-hover:text-white/70"
                  }`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="truncate">{label}</span>
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e8c97a]"
                    aria-hidden
                  />
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function SidebarHeader() {
  return (
    <div className="px-5 pb-2 pt-5">
      <p
        className="text-[17px] leading-none tracking-[0.02em] text-[#e8c97a]"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        Liz Cabriales
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
        Panel admin
      </p>
    </div>
  )
}

function SidebarFooter({
  userName,
  onSignOut,
}: {
  userName: string
  onSignOut: () => void
}) {
  return (
    <div className="mt-auto border-t border-white/10 px-3 py-3">
      <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8c97a]/30 bg-[#e8c97a]/10 text-xs font-medium text-[#e8c97a]">
          {userName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-white/90">{userName}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Administrador</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/90"
      >
        <LogOut className="h-[17px] w-[17px] shrink-0 text-white/40" strokeWidth={1.75} aria-hidden />
        Cerrar sesión
      </button>
    </div>
  )
}

export default function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  // Bloquear scroll del body + cerrar con Escape mientras el drawer está abierto
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#0f0f0f] lg:flex">
        <SidebarHeader />
        <div className="flex-1">
          <NavList pathname={pathname} />
        </div>
        <SidebarFooter userName={userName} onSignOut={() => void handleSignOut()} />
      </aside>

      {/* Barra superior móvil */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0f0f0f] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/[0.06]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
        <p
          className="text-[15px] tracking-[0.02em] text-[#e8c97a]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Liz Cabriales
        </p>
      </div>

      {/* Drawer móvil */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[270px] max-w-[82vw] flex-col overflow-y-auto bg-[#0f0f0f] shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú del panel"
        >
          <div className="flex items-start justify-between pr-3">
            <SidebarHeader />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="mt-5 flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.06]"
            >
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="flex-1">
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter userName={userName} onSignOut={() => void handleSignOut()} />
        </aside>
      </div>
    </>
  )
}
