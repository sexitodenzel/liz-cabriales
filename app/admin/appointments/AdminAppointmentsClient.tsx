"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarX2, Pencil, X } from "lucide-react"

import type {
  AdminAppointmentRow,
  AppointmentRecord,
  BlockedSlotRow,
  ProfessionalRow,
  ServiceFilterRow,
  ServiceRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

import Breadcrumb from "@/components/shared/Breadcrumb"
import DatePicker from "@/components/shared/DatePicker"
import NewAppointmentModal from "./components/NewAppointmentModal"
import AvailabilitySchedulePanel from "./components/AvailabilitySchedulePanel"
import BlockSlotModal from "./components/BlockSlotModal"
import RescheduleAppointmentModal from "./components/RescheduleAppointmentModal"
import CourseDaysPanel from "./components/CourseDaysPanel"
import WorkersPanel from "./components/WorkersPanel"
import ServicesPanel from "./components/ServicesPanel"
import ServiceReviewsModeration from "./components/ServiceReviewsModeration"
import PaymentCountdownCell from "./components/PaymentCountdownCell"
import { toast } from "@/app/components/ui/motion/toast-provider"
import type { ServiceReviewRow } from "@/lib/supabase/service-reviews"

type Props = {
  professionals: ProfessionalRow[]
  services: ServiceRow[]
  bookingServices: ServiceWithOptions[]
  filters: ServiceFilterRow[]
  serviceReviews: ServiceReviewRow[]
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

function statusLabel(
  status: AppointmentStatus,
  cancelledBy?: AppointmentRecord["cancelled_by"]
): string {
  if (status === "cancelled" && cancelledBy === "client") {
    return "Cancelado por el cliente"
  }
  const map: Record<AppointmentStatus, string> = {
    pending: "Pendiente",
    paid: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  }
  return map[status] ?? status
}

function statusClass(
  status: AppointmentStatus,
  cancelledBy?: AppointmentRecord["cancelled_by"]
): string {
  if (status === "cancelled" && cancelledBy === "client") {
    return "bg-red-50 text-red-700 border-red-200"
  }
  switch (status) {
    case "pending":
      return "bg-neutral-100 text-neutral-600 border-neutral-200"
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
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
  serviceReviews,
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
  const [blockModalWorker, setBlockModalWorker] = useState<ProfessionalRow | null>(
    null
  )
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRow[]>([])
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AdminAppointmentRow | null>(null)

  const isUpcomingView = date === ""

  const activeWorkers = useMemo(
    () => workers.filter((w) => w.is_active),
    [workers]
  )

  const fetchBlockedSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blocked-slots", {
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        return
      }
      setBlockedSlots(json.data?.blocked_slots ?? [])
    } catch {
      // noop
    }
  }, [])

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

  useEffect(() => {
    fetchBlockedSlots()
  }, [fetchBlockedSlots])

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

  const handleConfirmPayment = async (id: string) => {
    const ok = window.confirm(
      "¿Confirmar que recibiste el anticipo y marcar esta cita como pagada?"
    )
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/appointments/${id}/confirm`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo confirmar el pago")
        return
      }
      toast.success("Cita confirmada como pagada")
      fetchData()
    } catch {
      toast.error("Error de red al confirmar pago")
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
            { label: "Servicios" },
          ]}
        />

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a84c]">
              Panel administrador
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair),serif] text-3xl font-medium tracking-tight text-[#111] md:text-4xl">
              Servicios
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="px-2 text-sm text-neutral-500 transition-colors hover:text-[#111]"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>

        <ServicesPanel
          services={managedServices}
          filters={managedFilters}
          onServicesChange={handleServicesChange}
          onFiltersChange={handleFiltersChange}
          onBookingRefresh={refreshBookingServices}
        />

        <ServiceReviewsModeration initialReviews={serviceReviews} />

        <WorkersPanel
          workers={workers}
          filters={managedFilters}
          blockedSlots={blockedSlots}
          onWorkersChange={setWorkers}
          onBlockSchedule={setBlockModalWorker}
        />

        <AvailabilitySchedulePanel className="mb-6" />

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

      {blockModalWorker && (
        <BlockSlotModal
          professionals={activeWorkers}
          defaultDate={date || todayString()}
          defaultProfessionalId={blockModalWorker.id}
          onClose={() => setBlockModalWorker(null)}
          onCreated={() => {
            setBlockModalWorker(null)
            fetchBlockedSlots()
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
