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
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="border-b border-[#ececec] px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <h1 className="text-lg font-semibold text-[#c9a84c]">
            Panel Administrador
          </h1>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-[#6b6b6b]">{userName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="p-8">
        <div className="space-y-6">
          <p className="text-[#6b6b6b]">
            Bienvenido al panel de administración
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/admin/products"
              className="group overflow-hidden rounded-xl border border-[#ececec] bg-white px-5 py-4 transition hover:border-[#e8dcb0] hover:bg-[#fafafa]"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  Gestionar Productos
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  Crear, editar, activar o eliminar productos del catálogo.
                </p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="group overflow-hidden rounded-xl border border-[#ececec] bg-white px-5 py-4 transition hover:border-[#e8dcb0] hover:bg-[#fafafa]"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#1a1a1a]">Ver órdenes</p>
                <p className="text-xs text-[#6b6b6b]">
                  Consultar pedidos, estados y detalle de cada orden.
                </p>
              </div>
            </Link>

            <Link
              href="/admin/appointments"
              className="group overflow-hidden rounded-xl border border-[#ececec] bg-white px-5 py-4 transition hover:border-[#e8dcb0] hover:bg-[#fafafa]"
            >
              <div className="flex items-start gap-3">
                <CalendarDays
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a84c]"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1a1a1a]">Agenda</p>
                  <p className="text-xs text-[#6b6b6b]">
                    Citas del día, bloqueos de horario y reservas manuales.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/courses"
              className="group overflow-hidden rounded-xl border border-[#ececec] bg-white px-5 py-4 transition hover:border-[#e8dcb0] hover:bg-[#fafafa]"
            >
              <div className="flex items-start gap-3">
                <GraduationCap
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a84c]"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1a1a1a]">Cursos</p>
                  <p className="text-xs text-[#6b6b6b]">
                    Administra cursos presenciales, cupos e inscripciones.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className={`group flex flex-col overflow-hidden rounded-xl border px-5 py-4 transition ${
                hasLowStock
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-[#ececec] bg-white hover:border-emerald-200 hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
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
                </div>
                <p
                  className={`text-4xl font-bold tabular-nums leading-none ${
                    hasLowStock ? "text-amber-600" : "text-[#1a1a1a]"
                  }`}
                >
                  {lowStockCount}
                </p>
                <p
                  className={`text-xs leading-snug ${
                    hasLowStock
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {hasLowStock
                    ? "variantes por reabastecer"
                    : "Todo en orden"}
                </p>
                <p className="text-xs text-[#6b6b6b]">
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
