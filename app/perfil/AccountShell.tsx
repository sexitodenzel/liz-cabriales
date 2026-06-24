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
  href: string
  icon: LucideIcon
}[] = [
  { id: "resumen", label: "Resumen de cuenta", href: "/perfil", icon: LayoutGrid },
  { id: "pedidos", label: "Pedidos", href: "/perfil/pedidos", icon: Package },
  { id: "direcciones", label: "Direcciones", href: "/perfil/direcciones", icon: MapPin },
  { id: "cursos", label: "Cursos", href: "/perfil/cursos", icon: BookOpen },
  { id: "servicios", label: "Servicios", href: "/perfil/servicios", icon: Sparkles },
  { id: "wishlist", label: "Wishlist", href: "/wishlist", icon: Heart },
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
}: AccountShellProps) {
  const breadcrumbItems = breadcrumbLabel
    ? [{ label: "Inicio", href: "/" }, { label: "Mi cuenta", href: "/perfil" }, { label: breadcrumbLabel }]
    : [{ label: "Inicio", href: "/" }, { label: "Mi cuenta" }]

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[var(--foreground)]">
      <div className="site-container pt-5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="mt-6 w-full">
        <div className="site-container">
          <div className="grid w-full min-w-0 md:grid-cols-[240px_1fr]">
            <div className="flex items-center justify-between gap-4 py-6 md:justify-start">
              <h1 className="text-4xl font-medium tracking-tight text-neutral-900">Mi cuenta</h1>
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
            <aside className="hidden border-neutral-200 py-6 md:block md:border-r md:pr-8">
              <nav className="space-y-4 text-xs font-medium uppercase tracking-[0.18em] text-neutral-700">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = item.id === active
                  const baseClass =
                    "flex items-center gap-2.5 underline underline-offset-4 transition-colors"

                  if (isActive) {
                    return (
                      <span
                        key={item.id}
                        className={`${baseClass} text-black`}
                        aria-current="page"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                        {item.label}
                      </span>
                    )
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`${baseClass} hover:text-black`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                      {item.label}
                    </Link>
                  )
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block underline underline-offset-4 transition-colors hover:text-black"
                  >
                    Panel admin
                  </Link>
                )}
                <PerfilSignOutButton variant="nav" />
              </nav>
            </aside>

            <section className={`min-w-0 pt-6 pb-7 md:pl-8 ${contentClassName ?? ""}`}>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-medium leading-tight tracking-tight text-neutral-900">{title}</h2>
                {headerAction}
              </div>
              <div className="mt-7 min-w-0">{children}</div>
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
