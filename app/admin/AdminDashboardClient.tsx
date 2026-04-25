"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarDays, GraduationCap, PackageOpen } from "lucide-react"
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

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <h1 className="text-lg font-semibold text-[#C9A84C]">
            Panel Administrador
          </h1>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-white/80">{userName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 hover:border-[#C9A84C] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="p-8">
        <div className="space-y-6">
          <p className="text-white/80">
            Bienvenido al panel de administración
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/admin/products"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#C9A84C] hover:bg-white/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-[#C9A84C] to-transparent transition-opacity" />
              <div className="relative space-y-1">
                <p className="text-sm font-semibold text-white">
                  Gestionar Productos
                </p>
                <p className="text-xs text-white/70">
                  Crear, editar, activar o eliminar productos del catálogo.
                </p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#C9A84C] hover:bg-white/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-[#C9A84C] to-transparent transition-opacity" />
              <div className="relative space-y-1">
                <p className="text-sm font-semibold text-white">Ver órdenes</p>
                <p className="text-xs text-white/70">
                  Consultar pedidos, estados y detalle de cada orden.
                </p>
              </div>
            </Link>

            <Link
              href="/admin/appointments"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#C9A84C] hover:bg-white/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-[#C9A84C] to-transparent transition-opacity" />
              <div className="relative flex items-start gap-3">
                <CalendarDays
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Agenda</p>
                  <p className="text-xs text-white/70">
                    Citas del día, bloqueos de horario y reservas manuales.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/courses"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-[#C9A84C] hover:bg-white/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-[#C9A84C] to-transparent transition-opacity" />
              <div className="relative flex items-start gap-3">
                <GraduationCap
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Cursos</p>
                  <p className="text-xs text-white/70">
                    Administra cursos presenciales, cupos e inscripciones.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className={`group relative flex flex-col overflow-hidden rounded-xl border px-5 py-4 transition ${
                hasLowStock
                  ? "border-amber-400/50 bg-amber-950/20 hover:border-amber-400/80 hover:bg-amber-950/30"
                  : "border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-white/10"
              }`}
            >
              <div
                className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                  hasLowStock
                    ? "bg-gradient-to-br from-yellow-900/10 to-transparent"
                    : "bg-gradient-to-br from-emerald-900/10 to-transparent"
                }`}
              />
              <div className="relative flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hasLowStock ? (
                      <AlertTriangle
                        className="h-5 w-5 shrink-0 text-amber-400"
                        aria-hidden
                      />
                    ) : (
                      <PackageOpen
                        className="h-5 w-5 shrink-0 text-emerald-400/90"
                        aria-hidden
                      />
                    )}
                    <p className="text-sm font-semibold text-white">
                      Stock bajo
                    </p>
                  </div>
                </div>
                <p
                  className={`text-4xl font-bold tabular-nums leading-none ${
                    hasLowStock ? "text-amber-300" : "text-neutral-200"
                  }`}
                >
                  {lowStockCount}
                </p>
                <p
                  className={`text-xs leading-snug ${
                    hasLowStock
                      ? "text-amber-200/90"
                      : "text-emerald-300/90"
                  }`}
                >
                  {hasLowStock
                    ? "variantes por reabastecer"
                    : "Todo en orden"}
                </p>
                <p className="text-xs text-white/60">
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
