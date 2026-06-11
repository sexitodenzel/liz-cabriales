"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarDays, ClipboardList, GraduationCap, Image as ImageIcon, Package, PackageOpen } from "lucide-react"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userName: string
  lowStockCount: number
}

export default function AdminDashboardClient({
  userName,
  lowStockCount,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  const hasLowStock = lowStockCount > 0

  const actionCards = [
    {
      href: "/admin/products",
      title: "Gestionar Productos",
      description: "Crear, editar, activar o eliminar productos del catálogo.",
      icon: Package,
    },
    {
      href: "/admin/orders",
      title: "Ver órdenes",
      description: "Consultar pedidos, estados y detalle de cada orden.",
      icon: ClipboardList,
    },
    {
      href: "/admin/appointments",
      title: "Agenda",
      description: "Citas del día, bloqueos de horario y reservas manuales.",
      icon: CalendarDays,
    },
    {
      href: "/admin/courses",
      title: "Cursos",
      description: "Administra cursos presenciales, cupos e inscripciones.",
      icon: GraduationCap,
    },
    {
      href: "/admin/media",
      title: "Media",
      description: "Sube y actualiza banners, fotos y GIFs de la landing page.",
      icon: ImageIcon,
    },
  ] as const

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <Breadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Mi Perfil", href: "/perfil" },
              { label: "Panel de administrador" },
            ]}
          />
          <div className="flex flex-col gap-4 border-b border-[#ececec] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-lg font-semibold text-[#c9a84c]">
              Panel Administrador
            </h1>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm text-[#6b6b6b]">{userName}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#3a3a3a] transition-colors hover:border-[#c9a84c] hover:text-[#a8893a]"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {actionCards.map((card, index) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group flex h-full min-h-[132px] flex-col overflow-hidden rounded-xl border border-[#ececec] bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-white lg:col-span-2`}
                >
                  <div className={Icon ? "flex items-start gap-3" : "space-y-1"}>
                    {Icon ? (
                      <Icon
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a84c]"
                        aria-hidden
                      />
                    ) : null}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {card.title}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{card.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}

            <Link
              href="/admin/products"
              className={`group flex h-full min-h-[132px] flex-col overflow-hidden rounded-xl border px-5 py-4 transition lg:col-span-2 ${
                hasLowStock
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-[#ececec] bg-white hover:border-emerald-200 hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-2">
                  {hasLowStock ? (
                    <AlertTriangle
                      className="h-5 w-5 shrink-0 text-amber-500"
                      aria-hidden
                    />
                  ) : (
                    <PackageOpen
                      className="h-5 w-5 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                  )}
                  <p className="text-sm font-semibold text-[#1a1a1a]">
                    Stock bajo
                  </p>
                </div>
                <p
                  className={`text-3xl font-bold tabular-nums leading-none ${
                    hasLowStock ? "text-amber-600" : "text-[#1a1a1a]"
                  }`}
                >
                  {lowStockCount}
                </p>
                <p
                  className={`text-xs leading-snug ${
                    hasLowStock ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {hasLowStock
                    ? "variantes por reabastecer"
                    : "Todo en orden"}
                </p>
                <p className="mt-auto text-xs text-[#6b6b6b]">
                  Ir al catálogo para revisar existencias.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
