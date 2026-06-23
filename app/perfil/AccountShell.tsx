"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Heart,
  LayoutGrid,
  MapPin,
  Package,
  Sparkles,
} from "lucide-react"
import type { ReactNode } from "react"

import Breadcrumb from "@/components/shared/Breadcrumb"
import AccountSubNavSlider from "./AccountSubNavSlider"
import AccountSubNavTab, { accountSubNavInlineClass } from "./AccountSubNavTab"
import PerfilSignOutButton from "./PerfilSignOutButton"

export type AccountSection =
  | "resumen"
  | "pedidos"
  | "direcciones"
  | "cursos"
  | "servicios"
  | "wishlist"

const NAV_ITEMS: {
  id: AccountSection
  label: string
  sidebarLabel: string
  href: string
  icon: LucideIcon
}[] = [
  { id: "resumen", label: "Resumen de cuenta", sidebarLabel: "Resumen", href: "/perfil", icon: LayoutGrid },
  { id: "pedidos", label: "Pedidos", sidebarLabel: "Pedidos", href: "/perfil/pedidos", icon: Package },
  { id: "direcciones", label: "Direcciones", sidebarLabel: "Direcciones", href: "/perfil/direcciones", icon: MapPin },
  { id: "cursos", label: "Cursos", sidebarLabel: "Cursos", href: "/perfil/cursos", icon: BookOpen },
  { id: "servicios", label: "Servicios", sidebarLabel: "Servicios", href: "/perfil/servicios", icon: Sparkles },
  { id: "wishlist", label: "Wishlist", sidebarLabel: "Wishlist", href: "/wishlist", icon: Heart },
]

function MobileNavLink({
  active,
  href,
  label,
  navId,
}: {
  active: boolean
  href: string
  label: string
  navId: string
}) {
  return (
    <AccountSubNavTab as="link" active={active} href={href} label={label} navId={navId} />
  )
}

type AccountShellProps = {
  active: AccountSection
  title: string
  breadcrumbLabel?: string
  headerAction?: ReactNode
  isAdmin?: boolean
  children: ReactNode
  contentClassName?: string
  showFooter?: boolean
  hideDefaultTitle?: boolean
}

export default function AccountShell({
  active,
  title,
  breadcrumbLabel,
  headerAction,
  isAdmin = false,
  children,
  contentClassName,
  showFooter = true,
  hideDefaultTitle = false,
}: AccountShellProps) {
  const breadcrumbItems = breadcrumbLabel
    ? [{ label: "Inicio", href: "/" }, { label: "Mi cuenta", href: "/perfil" }, { label: breadcrumbLabel }]
    : [{ label: "Inicio", href: "/" }, { label: "Mi cuenta" }]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="site-container pt-5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="mt-6 w-full">
        <div className="site-container">
          <div className="grid w-full min-w-0 md:grid-cols-[240px_1fr]">
            <div className="flex items-center justify-between gap-4 py-6 md:justify-start">
              <h1
                className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Mi cuenta
              </h1>
              <div className="md:hidden">
                <PerfilSignOutButton />
              </div>
            </div>
            <div className="hidden items-center justify-end py-6 md:flex">
              <PerfilSignOutButton />
            </div>
          </div>
        </div>

        <nav className="md:hidden">
          <AccountSubNavSlider activeId={active}>
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.id}
                active={item.id === active}
                href={item.href}
                label={item.label}
                navId={item.id}
              />
            ))}
            {isAdmin && (
              <Link href="/admin" className={accountSubNavInlineClass}>
                Panel admin
              </Link>
            )}
            <PerfilSignOutButton variant="nav-inline" />
          </AccountSubNavSlider>
        </nav>

        <div className="w-full border-b border-neutral-200" aria-hidden="true" />

        <div className="site-container">
          <div className="grid w-full min-w-0 md:grid-cols-[240px_1fr]">
            <aside className="hidden py-6 md:block md:pr-6">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Mi panel
              </p>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = item.id === active

                  if (isActive) {
                    return (
                      <span
                        key={item.id}
                        className="flex items-center gap-3 rounded-r-lg border-l-2 border-[var(--gold)] bg-[#f5f0e8] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-900"
                        aria-current="page"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[var(--gold)]" strokeWidth={1.75} aria-hidden />
                        {item.sidebarLabel}
                      </span>
                    )
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:bg-white/70 hover:text-neutral-900"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
                      {item.sidebarLabel}
                    </Link>
                  )
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:bg-white/70 hover:text-neutral-900"
                  >
                    Panel admin
                  </Link>
                )}
              </nav>
            </aside>

            <section className={`min-w-0 pt-6 pb-7 md:pl-4 lg:pl-8 ${contentClassName ?? ""}`}>
              {!hideDefaultTitle && (
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-3xl font-medium leading-tight tracking-tight text-neutral-900"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {title}
                  </h2>
                  {headerAction}
                </div>
              )}
              <div className={hideDefaultTitle ? "min-w-0" : "mt-7 min-w-0"}>{children}</div>
            </section>
          </div>
        </div>

        <div className="w-full border-b-2 border-neutral-200" aria-hidden="true" />
      </div>

      {showFooter ? (
        <div className="site-container pb-14 pt-8 text-center">
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-600 underline underline-offset-4 transition-colors hover:text-black"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="site-container pb-16" />
      )}
    </main>
  )
}
