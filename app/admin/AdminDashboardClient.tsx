"use client"

import type { LucideProps } from "lucide-react"
import type { FC } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react"

import Breadcrumb from "@/components/shared/Breadcrumb"

type Props = {
  userName: string
  lowStockCount: number
  ordersThisMonth: number
  activeClients: number
}

type ActionCard = {
  href: string
  title: string
  description: string
  cta: string
  icon: FC<LucideProps>
}

const actionCards: ActionCard[] = [
  {
    href: "/admin/products",
    title: "Gestionar Productos",
    description: "Crear, editar, activar o eliminar productos del catálogo.",
    cta: "Ir al catálogo",
    icon: Package,
  },
  {
    href: "/admin/orders",
    title: "Ver órdenes",
    description: "Consultar pedidos, estados y detalle de cada orden.",
    cta: "Ver órdenes",
    icon: ClipboardList,
  },
  {
    href: "/admin/appointments",
    title: "Agenda",
    description: "Citas del día, bloqueos de horario y reservas manuales.",
    cta: "Abrir agenda",
    icon: CalendarDays,
  },
  {
    href: "/admin/courses",
    title: "Cursos",
    description: "Administra cursos presenciales, cupos e inscripciones.",
    cta: "Gestionar cursos",
    icon: GraduationCap,
  },
  {
    href: "/admin/media",
    title: "Media",
    description: "Sube y actualiza banners, fotos y GIFs de la landing page.",
    cta: "Ir a media",
    icon: ImageIcon,
  },
  {
    href: "/admin/home-spotlight",
    title: "Spotlight del home",
    description: "Collage editorial de la página principal: nail art, estudio o promos.",
    cta: "Editar spotlight",
    icon: LayoutGrid,
  },
  {
    href: "/admin/announcements",
    title: "Barra de anuncios",
    description: "Edita los slides de la franja negra superior de la tienda.",
    cta: "Editar anuncios",
    icon: Megaphone,
  },
  {
    href: "/admin/blog",
    title: "Blog",
    description: "Publica tips, tendencias y contenido para las alumnas.",
    cta: "Gestionar blog",
    icon: Newspaper,
  },
]

function formatStat(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

function StatCard({
  icon: Icon,
  value,
  label,
  valueClassName = "text-neutral-900",
  iconClassName = "text-[var(--gold)]",
}: {
  icon: FC<LucideProps>
  value: number
  label: string
  valueClassName?: string
  iconClassName?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white px-5 py-4 shadow-sm">
      <span
        className="absolute inset-y-0 left-0 w-1 bg-[var(--gold)]"
        aria-hidden
      />
      <div className="flex items-start gap-4 pl-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#faf8f5]">
          <Icon className={`h-5 w-5 ${iconClassName}`} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={`text-2xl font-semibold tabular-nums leading-none ${valueClassName}`}>
            {formatStat(value)}
          </p>
          <p className="mt-1.5 text-xs text-neutral-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function QuickAccessCard({ card }: { card: ActionCard }) {
  const Icon = card.icon

  return (
    <Link
      href={card.href}
      className="group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition hover:border-[var(--gold)]/40 hover:shadow-md"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--gold)]/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70"
        aria-hidden
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#faf8f5] text-[var(--gold)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">{card.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">
        {card.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)] transition-colors group-hover:text-[#a8893a]">
        {card.cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  )
}

export default function AdminDashboardClient({
  userName,
  lowStockCount,
  ordersThisMonth,
  activeClients,
}: Props) {
  const hasLowStock = lowStockCount > 0

  return (
    <div className="text-[var(--foreground)]">
      <main className="px-6 pt-6 pb-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <Breadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Mi Perfil", href: "/perfil" },
              { label: "Panel de administrador" },
            ]}
          />

          <div className="border-b border-neutral-200 pb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Gestión general
            </p>
            <h1
              className="mt-2 text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Inicio
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Hola de nuevo,{" "}
              <span className="font-medium text-neutral-900">{userName}</span>
              {" "}— esto es lo que pasa hoy en tu estudio.
            </p>
          </div>

          <section aria-label="Resumen del mes">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={ShoppingBag}
                value={ordersThisMonth}
                label="Órdenes este mes"
              />
              <StatCard
                icon={Users}
                value={activeClients}
                label="Clientes activos"
              />
              <StatCard
                icon={AlertTriangle}
                value={lowStockCount}
                label="Stock bajo · variantes"
                valueClassName={hasLowStock ? "text-red-600" : "text-neutral-900"}
                iconClassName={hasLowStock ? "text-red-500" : "text-[var(--gold)]"}
              />
            </div>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Accesos rápidos
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {actionCards.map((card) => (
                <QuickAccessCard key={card.href} card={card} />
              ))}

              <Link
                href="/admin/products"
                className={`group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                  hasLowStock
                    ? "border-red-200/80 bg-red-50 hover:border-red-300"
                    : "border-neutral-200/80 bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                <span
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-200/30 blur-2xl"
                  aria-hidden
                />
                {hasLowStock && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    {formatStat(lowStockCount)} variantes
                  </span>
                )}
                <span
                  className={`mt-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                    hasLowStock ? "bg-white/80 text-red-600" : "bg-white text-neutral-500"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3
                  className={`mt-4 text-base font-semibold ${
                    hasLowStock ? "text-red-950" : "text-neutral-900"
                  }`}
                >
                  Stock bajo
                </h3>
                <p
                  className={`mt-2 flex-1 text-sm leading-relaxed ${
                    hasLowStock ? "text-red-800/80" : "text-neutral-600"
                  }`}
                >
                  {hasLowStock
                    ? "Hay variantes que necesitan reabastecimiento. Revisa el catálogo para actualizar existencias."
                    : "Todo en orden. No hay variantes por debajo del stock mínimo."}
                </p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    hasLowStock ? "text-red-700 group-hover:text-red-900" : "text-[var(--gold)]"
                  }`}
                >
                  {hasLowStock ? "Revisar ahora" : "Ir al catálogo"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
