"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarX2, Pencil, X } from "lucide-react"

import type {
  AdminAppointmentRow,
  ProfessionalRow,
  ServiceFilterRow,
  ServiceRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

import Breadcrumb from "@/components/shared/Breadcrumb"
import DatePicker from "@/components/shared/DatePicker"
import NewAppointmentModal from "./components/NewAppointmentModal"
import BlockSlotModal from "./components/BlockSlotModal"
import RescheduleAppointmentModal from "./components/RescheduleAppointmentModal"
import CourseDaysPanel from "./components/CourseDaysPanel"
import WorkersPanel from "./components/WorkersPanel"
import ServicesPanel from "./components/ServicesPanel"
import PaymentCountdownCell from "./components/PaymentCountdownCell"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  professionals: ProfessionalRow[]
  services: ServiceRow[]
  bookingServices: ServiceWithOptions[]
  filters: ServiceFilterRow[]
}

type StatusFilter = "all" | AppointmentStatus

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function formatPhoneDisplay(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/^\+52/, "").replace(/\D/g, "")
  if (digits.length === 10) {
    return `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

function phoneWhatsAppHref(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `https://wa.me/52${digits}`
  if (digits.startsWith("52") && digits.length === 12) {
    return `https://wa.me/${digits}`
  }
  if (digits.length >= 10) return `https://wa.me/${digits}`
  return null
}

const TABLE_COL_COUNT = 9
const UPCOMING_TABLE_COL_COUNT = 10

function getClientInitials(
  first: string | null,
  last: string | null,
  email: string | null
): string {
  const name = [first, last].filter(Boolean).join(" ")
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "?"
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function statusLabel(status: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    pending: "Pendiente",
    paid: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  }
  return map[status] ?? status
}

function statusClass(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-neutral-100 text-neutral-600 border-neutral-200"
    case "paid":
      return "bg-rose-50 text-rose-800 border-rose-200"
    case "completed":
      return "bg-emerald-50 text-emerald-800 border-emerald-200"
    case "cancelled":
      return "bg-neutral-50 text-neutral-400 border-neutral-200"
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200"
  }
}

export default function AdminAppointmentsClient({
  professionals: initialWorkers,
  services: initialServices,
  bookingServices: initialBookingServices,
  filters: initialFilters,
}: Props) {
  const [date, setDate] = useState<string>("")
  const [professionalId, setProfessionalId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [workers, setWorkers] = useState<ProfessionalRow[]>(initialWorkers)
  const [managedServices, setManagedServices] =
    useState<ServiceRow[]>(initialServices)
  const [bookingServices, setBookingServices] = useState<ServiceWithOptions[]>(
    initialBookingServices
  )
  const [managedFilters, setManagedFilters] =
    useState<ServiceFilterRow[]>(initialFilters)

  const refreshBookingServices = useCallback(async () => {
    try {
      const [bookingRes, filtersRes] = await Promise.all([
        fetch("/api/services/booking"),
        fetch("/api/admin/service-filters"),
      ])
      const bookingJson = await bookingRes.json()
      const filtersJson = await filtersRes.json()
      if (bookingRes.ok && bookingJson.data?.services) {
        setBookingServices(bookingJson.data.services)
      }
      if (filtersRes.ok && filtersJson.data?.filters) {
        setManagedFilters(filtersJson.data.filters)
      }
    } catch {
      // noop
    }
  }, [])

  const handleServicesChange = useCallback(
    (next: ServiceRow[]) => {
      setManagedServices(next)
      void refreshBookingServices()
    },
    [refreshBookingServices]
  )

  const handleFiltersChange = useCallback((next: ServiceFilterRow[]) => {
    setManagedFilters(next)
  }, [])
  const [loading, setLoading] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [blockTarget, setBlockTarget] = useState<ProfessionalRow | null>(null)
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AdminAppointmentRow | null>(null)

  const isUpcomingView = date === ""

  const activeWorkers = useMemo(
    () => workers.filter((w) => w.is_active),
    [workers]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()

      if (date) {
        qs.set("date", date)
        if (professionalId !== "all") {
          qs.set("professional_id", professionalId)
        }
      } else {
        if (professionalId !== "all") {
          qs.set("professional_id", professionalId)
        }
        if (statusFilter !== "all") {
          qs.set("status", statusFilter)
        }
      }

      const res = await fetch(`/api/admin/appointments?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar las citas")
        setAppointments([])
        return
      }
      setAppointments(json.data.appointments ?? [])
    } catch {
      toast.error("Error de red al cargar citas")
    } finally {
      setLoading(false)
    }
  }, [date, professionalId, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancel = async (id: string) => {
    const ok = window.confirm("¿Cancelar esta cita?")
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/appointments/${id}/cancel`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo cancelar la cita")
        return
      }
      toast.success("Cita cancelada")
      fetchData()
    } catch {
      toast.error("Error de red al cancelar")
    }
  }

  const visibleAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (isUpcomingView) return true
      if (professionalId !== "all" && a.professional_id !== professionalId) {
        return false
      }
      if (statusFilter !== "all" && a.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [appointments, professionalId, statusFilter, isUpcomingView])

  const stats = useMemo(() => {
    const active = visibleAppointments.filter((a) => a.status !== "cancelled")
    const confirmed = active.filter(
      (a) => a.status === "paid" || a.status === "completed"
    )
    const pending = active.filter((a) => a.status === "pending")
    const totalDay = active.reduce((sum, a) => sum + a.total, 0)
    return {
      totalCount: active.length,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      totalDay,
    }
  }, [visibleAppointments])

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#111]">
      <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-10">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Mi Perfil", href: "/perfil" },
            { label: "Panel de administrador", href: "/admin" },
            { label: "Agenda" },
          ]}
        />

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a84c]">
              Panel administrador
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair),serif] text-3xl font-medium tracking-tight text-[#111] md:text-4xl">
              Agenda
            </h1>
            {isUpcomingView && (
              <p className="mt-2 text-sm text-neutral-500">
                Mostrando las próximas 10 citas pendientes sin filtro de fecha.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="rounded-lg bg-[#111] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c9a84c] hover:text-[#111]"
            >
              Nueva cita manual
            </button>
            <Link
              href="/admin"
              className="px-2 text-sm text-neutral-500 transition-colors hover:text-[#111]"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200/80 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {isUpcomingView ? "Próximas citas" : "Citas del día"}
            </p>
            <p className="mt-2 font-[family-name:var(--font-playfair),serif] text-4xl font-medium text-[#111]">
              {stats.totalCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {isUpcomingView
                ? "Hasta 10 citas · sin filtro de fecha"
                : `${stats.confirmedCount} confirmada${stats.confirmedCount === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200/80 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Pendientes de pago
            </p>
            <p className="mt-2 font-[family-name:var(--font-playfair),serif] text-4xl font-medium text-[#c9a84c]">
              {stats.pendingCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Por confirmar pago</p>
          </div>
        </div>

        <ServicesPanel
          services={managedServices}
          filters={managedFilters}
          onServicesChange={handleServicesChange}
          onFiltersChange={handleFiltersChange}
          onBookingRefresh={refreshBookingServices}
        />

        <WorkersPanel
          workers={workers}
          filters={managedFilters}
          onWorkersChange={setWorkers}
          onBlockSchedule={setBlockTarget}
        />

        <div className="overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-end gap-4 border-b border-neutral-100 px-5 py-4">
            <div>
              <label
                htmlFor="date"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
              >
                Fecha
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <DatePicker
                  id="date"
                  value={date}
                  onChange={setDate}
                  className="min-w-[180px]"
                />
                {date && (
                  <button
                    type="button"
                    onClick={() => setDate("")}
                    className="text-[11px] font-medium text-[#c9a84c] hover:underline"
                  >
                    Quitar fecha
                  </button>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="professional"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
              >
                Profesional
              </label>
              <select
                id="professional"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#c9a84c]"
              >
                <option value="all">Todos</option>
                {activeWorkers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
              >
                Estado
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#c9a84c]"
              >
                <option value="all">Cualquiera</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            {!isUpcomingView && (
              <div className="ml-auto text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Total del día
                </p>
                <p className="mt-1 font-[family-name:var(--font-playfair),serif] text-xl text-[#111]">
                  {formatPrice(stats.totalDay)}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/80 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  {isUpcomingView && (
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                  )}
                  <th className="px-5 py-3 font-semibold">Hora</th>
                  <th className="px-5 py-3 font-semibold">Profesional</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Celular</th>
                  <th className="px-5 py-3 font-semibold">Servicios</th>
                  <th className="px-5 py-3 font-semibold">Duración</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Expira en:</th>
                  <th className="px-5 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={isUpcomingView ? UPCOMING_TABLE_COL_COUNT : TABLE_COL_COUNT}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      Cargando…
                    </td>
                  </tr>
                ) : visibleAppointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isUpcomingView ? UPCOMING_TABLE_COL_COUNT : TABLE_COL_COUNT}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <CalendarX2 className="h-5 w-5 text-neutral-400" />
                        <p className="text-sm">
                          {isUpcomingView
                            ? "No hay citas pendientes próximas con los filtros seleccionados."
                            : "No hay citas para este día con los filtros seleccionados."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleAppointments.map((a) => {
                    const duration = a.services.reduce(
                      (sum, s) => sum + s.duration_min,
                      0
                    )
                    const clientName =
                      [a.client_first_name, a.client_last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      a.client_email ||
                      "Sin nombre"
                    const phoneDisplay = formatPhoneDisplay(a.client_phone)
                    const phoneHref = phoneWhatsAppHref(a.client_phone)
                    const initials = getClientInitials(
                      a.client_first_name,
                      a.client_last_name,
                      a.client_email
                    )

                    return (
                      <tr key={a.id} className="transition-colors hover:bg-neutral-50/60">
                        {isUpcomingView && (
                          <td className="px-5 py-4 text-neutral-700 capitalize">
                            {formatDateLabel(a.date)}
                          </td>
                        )}
                        <td className="px-5 py-4 font-medium text-[#111]">
                          {formatTimeLabel(a.start_time)}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {a.professional_name ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#111]">
                                {clientName}
                              </p>
                              {a.client_email ? (
                                <p className="truncate text-xs text-neutral-500">
                                  {a.client_email}
                                </p>
                              ) : (
                                <p className="text-xs text-neutral-400">
                                  Sin email
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {phoneDisplay && phoneHref ? (
                            <a
                              href={phoneHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whitespace-nowrap text-sm text-[#111] transition-colors hover:text-[#c9a84c]"
                            >
                              {phoneDisplay}
                            </a>
                          ) : (
                            <span className="text-sm text-neutral-400">
                              Sin registrar
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {a.services.map((s) => s.service_name).join(", ")}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {duration} min
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusClass(a.status)}`}
                          >
                            {statusLabel(a.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <PaymentCountdownCell
                            createdAt={a.created_at}
                            status={a.status}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            {(a.status === "paid" ||
                              a.status === "pending") && (
                              <button
                                type="button"
                                onClick={() => setRescheduleTarget(a)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[#111]"
                                aria-label="Reprogramar cita"
                                title="Reprogramar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {a.status !== "cancelled" &&
                              a.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(a.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                  aria-label="Cancelar cita"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CourseDaysPanel />
      </div>

      {showNewModal && (
        <NewAppointmentModal
          professionals={activeWorkers}
          services={bookingServices}
          defaultDate={date || todayString()}
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false)
            fetchData()
          }}
        />
      )}

      {blockTarget && (
        <BlockSlotModal
          professionals={activeWorkers}
          defaultDate={date || todayString()}
          defaultProfessionalId={blockTarget.id}
          onClose={() => setBlockTarget(null)}
          onCreated={() => {
            setBlockTarget(null)
            fetchData()
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleAppointmentModal
          appointment={rescheduleTarget}
          professionals={activeWorkers}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
