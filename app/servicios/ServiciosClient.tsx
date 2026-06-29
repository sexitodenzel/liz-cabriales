"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import type { ProfessionalRow, ServiceRow } from "@/lib/supabase/appointments"

import BookingSummary from "./components/BookingSummary"

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

type Step = 1 | 2 | 3 | 4

type Props = {
  services: ServiceRow[]
  professionals: ProfessionalRow[]
  isAuthenticated: boolean
  activeAppointmentId: string | null
}

const STEP_LABELS: Record<Step, string> = {
  1: "Servicios",
  2: "Profesional",
  3: "Fecha y hora",
  4: "Confirmación",
}

const CATEGORY_DEFS = [
  {
    id: "podologia",
    label: "Podología",
    keywords: ["podol", "pie", "pedicur"],
  },
  {
    id: "unas",
    label: "Uñas",
    keywords: ["uña", "manicur", "nail", "gelish"],
  },
  { id: "aplicacion", label: "Aplicación", keywords: ["aplicac"] },
  {
    id: "facial",
    label: "Facial",
    keywords: ["facial", "piel", "limpiez"],
  },
  {
    id: "depilacion",
    label: "Depilación",
    keywords: ["depilac", "cera", "wax", "hilo"],
  },
]

const SELECTED_CARD =
  "border-2 border-[#c9a84c] bg-white shadow-[0_4px_12px_rgba(201,168,76,0.12)] ring-1 ring-[#c9a84c]/20"
const DEFAULT_CARD =
  "border border-neutral-200/80 bg-white hover:border-[#c9a84c]/40"

function detectCategory(service: ServiceRow): string | null {
  const src = `${service.name} ${service.description ?? ""}`.toLowerCase()
  for (const cat of CATEGORY_DEFS) {
    if (cat.keywords.some((kw) => src.includes(kw))) return cat.id
  }
  return null
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function prettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function groupSlotsByPeriod(slots: Slot[]) {
  const morning: Slot[] = []
  const afternoon: Slot[] = []
  for (const slot of slots) {
    const hh = Number(slot.start_time.slice(0, 2))
    if (hh < 12) morning.push(slot)
    else afternoon.push(slot)
  }
  return { morning, afternoon }
}

const DAYS_MS = 1000 * 60 * 60 * 24

function buildAvailableDates(): Date[] {
  const out: Date[] = []
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i < 30; i++) {
    const d = new Date(start.getTime() + i * DAYS_MS)
    if (d.getDay() === 0) continue
    out.push(d)
  }
  return out
}

function IconArrowLeft() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconShuffle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconSun({ morning }: { morning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {morning ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>
      ) : (
        <>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
          <circle cx="12" cy="12" r="4" />
        </>
      )}
    </svg>
  )
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#111]" />
  )
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,4vw,40px)] font-medium leading-tight tracking-[-0.02em] text-[#111]">
        {title}
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-neutral-500">
        {subtitle}
      </p>
    </header>
  )
}

function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: Slot[]
  selectedSlot: Slot | null
  onSelect: (slot: Slot) => void
}) {
  if (slots.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {slots.map((slot) => {
        const active =
          selectedSlot?.start_time === slot.start_time &&
          selectedSlot?.professional_id === slot.professional_id
        return (
          <button
            key={`${slot.professional_id}-${slot.start_time}`}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-lg border py-3 text-[13px] font-medium transition-all duration-200 ${
              active
                ? "border-[#c9a84c] bg-[#c9a84c] text-[#111] shadow-sm"
                : "border-neutral-200/80 bg-white text-[#111] hover:border-[#c9a84c]/50"
            }`}
          >
            {formatTimeLabel(slot.start_time)}
          </button>
        )
      })}
    </div>
  )
}

export default function ServiciosClient({
  services,
  professionals,
  isAuthenticated,
  activeAppointmentId,
}: Props) {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | "any" | null
  >(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null
  )
  const [notes, setNotes] = useState("")
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  )

  const totalPrice = selectedServices.reduce((a, s) => a + s.price, 0)
  const totalDuration = selectedServices.reduce(
    (a, s) => a + s.duration_min,
    0
  )
  const availableDates = useMemo(buildAvailableDates, [])
  const { morning: morningSlots, afternoon: afternoonSlots } = useMemo(
    () => groupSlotsByPeriod(slots),
    [slots]
  )

  const availableCategories = useMemo(() => {
    const found = new Set<string>()
    for (const s of services) {
      const cat = detectCategory(s)
      if (cat) found.add(cat)
    }
    return CATEGORY_DEFS.filter((c) => found.has(c.id))
  }, [services])

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services
    return services.filter((s) => detectCategory(s) === activeCategory)
  }, [services, activeCategory])

  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId
  )

  const profLabel =
    selectedProfessionalId === "any"
      ? "cualquier profesional"
      : (selectedProfessional?.name ?? "cualquier profesional")

  const progressPct = (step / 4) * 100

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !selectedProfessionalId || totalDuration === 0) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    setSlotsError(null)
    try {
      const qs = new URLSearchParams({
        date: selectedDate,
        professional_id: selectedProfessionalId,
        duration_min: String(totalDuration),
      })
      const res = await fetch(`/api/appointments/availability?${qs}`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setSlotsError(
          json?.error?.message ?? "No se pudieron cargar los horarios"
        )
        setSlots([])
        return
      }
      setSlots(json.data.slots ?? [])
    } catch {
      setSlotsError("Error de red al cargar horarios")
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedDate, selectedProfessionalId, totalDuration])

  useEffect(() => {
    if (step === 3) fetchSlots()
  }, [step, fetchSlots])

  useEffect(() => {
    let cancelled = false

    async function loadProfilePhone() {
      if (!isAuthenticated) return

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled || !user) return

      const { data: profile } = await supabase
        .from("users")
        .select("phone")
        .eq("id", user.id)
        .single()

      if (cancelled || !profile?.phone) return

      const digits = String(profile.phone)
        .replace(/^\+52/, "")
        .replace(/\D/g, "")
      if (digits.length >= 10) {
        setPhone(digits.slice(0, 10))
      }
    }

    void loadProfilePhone()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    let cancelled = false

    const restorePendingAppointment = () => {
      if (cancelled) return

      try {
        const raw = sessionStorage.getItem("pendingAppointment")
        if (!raw) return

        const data = JSON.parse(raw) as {
          service_ids?: string[]
          professional_id?: string | "any"
          date?: string
          start_time?: string
          client_phone?: string
        }

        if (data.service_ids?.length) {
          setSelectedServiceIds(data.service_ids)
        }
        if (data.professional_id) {
          setSelectedProfessionalId(data.professional_id)
        }
        if (data.date) setSelectedDate(data.date)
        if (data.start_time && data.professional_id) {
          setSelectedSlot({
            start_time: data.start_time,
            end_time: "",
            professional_id:
              data.professional_id === "any" ? "" : data.professional_id,
          })
        }
        if (data.client_phone) {
          setPhone(data.client_phone.replace(/\D/g, "").slice(0, 10))
        }

        let targetStep: Step = 1
        if (data.service_ids?.length) {
          if (data.date && data.start_time && data.professional_id) {
            targetStep = 4
          } else if (data.date && data.professional_id) {
            targetStep = 3
          } else if (data.professional_id) {
            targetStep = 2
          }
        }
        setStep(targetStep)

        sessionStorage.removeItem("pendingAppointment")
      } catch {
        // noop
      }
    }

    const frameId = requestAnimationFrame(restorePendingAppointment)

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [])

  const phoneDigits = phone.replace(/\D/g, "")
  const hasValidPhone = phoneDigits.length === 10

  const canContinue =
    (step === 1 && selectedServiceIds.length > 0) ||
    (step === 2 && selectedProfessionalId !== null) ||
    (step === 3 && selectedSlot !== null) ||
    (step === 4 && hasValidPhone)

  const handleContinue = () => {
    if (canContinue && step < 4) setStep((s) => (s + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const handleConfirm = async () => {
    if (!hasValidPhone) {
      setPhoneError("Ingresa tu número de celular (10 dígitos)")
      return
    }
    setPhoneError(null)

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(
          "pendingAppointment",
          JSON.stringify({
            service_ids: selectedServiceIds,
            professional_id: selectedProfessionalId,
            date: selectedDate,
            start_time: selectedSlot?.start_time,
            client_phone: phoneDigits,
          })
        )
      } catch {
        // noop
      }
      router.push("/login?redirect=/servicios")
      return
    }

    if (!selectedSlot || !selectedDate || !selectedProfessionalId) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const profToSend =
        selectedProfessionalId === "any"
          ? "any"
          : selectedSlot.professional_id

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_ids: selectedServiceIds,
          professional_id: profToSend,
          date: selectedDate,
          start_time: selectedSlot.start_time,
          client_phone: phoneDigits,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setSubmitError(json?.error?.message ?? "No se pudo crear la cita")
        return
      }

      const appointmentId = json.data.appointment_id

      const payRes = await fetch("/api/payments/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      })
      const payJson = await payRes.json()
      if (!payRes.ok || payJson.error) {
        router.push(`/cita/${appointmentId}`)
        return
      }

      if (payJson.data.payment_url) {
        const newTab = window.open(payJson.data.payment_url, "_blank")
        if (!newTab) {
          setSubmitError(
            "Tu navegador bloqueó la ventana de pago. Ve a tu cita y usa el botón de pago."
          )
        }
        router.push(`/cita/${appointmentId}`)
      } else {
        setSubmitError("No se pudo generar el enlace de pago")
      }
    } catch {
      setSubmitError("Error de red al reservar")
    } finally {
      setSubmitting(false)
    }
  }

  if (activeAppointmentId) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[var(--background)] py-16 site-container">
        <div className="w-full max-w-md rounded-lg border border-neutral-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
            Cita activa
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-[#111]">
            Ya tienes una cita reservada
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Solo puedes tener una cita activa a la vez. Revisa o cancela tu cita
            actual antes de reservar una nueva.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={`/cita/${activeAppointmentId}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#111] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#c9a84c] hover:text-[#111]"
            >
              Ver mi cita
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111] transition-colors hover:border-[#111]"
            >
              Inicio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const summaryProps = {
    selectedServices,
    profLabel,
    selectedProfessional:
      selectedProfessionalId !== "any" ? selectedProfessional : undefined,
    selectedDate,
    selectedSlot,
    totalPrice,
    totalDuration,
    step,
    formatPrice,
    formatDuration,
    formatTimeLabel,
    prettyDate,
    getInitials,
    onContinue: handleContinue,
    onConfirm: handleConfirm,
    canContinue,
    submitting,
    clientPhone: phone,
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Wizard toolbar + progress */}
      <header className="sticky top-[var(--site-chrome-bottom)] z-30 border-b border-neutral-200/60 bg-[var(--background)]/95 backdrop-blur-md">
        <div className="site-container">
          <div className="flex items-center justify-between py-2.5">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              aria-label="Volver"
              className="flex h-9 w-9 items-center justify-center text-[#c9a84c] transition-opacity hover:opacity-70 disabled:opacity-30"
            >
              <IconArrowLeft />
            </button>

            <Link
              href="/"
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center text-[#c9a84c] transition-colors hover:text-red-600 active:text-red-600"
            >
              <IconX />
            </Link>
          </div>

          <div className="pb-3">
            <div className="mb-2 flex items-end justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a84c]">
                Paso {String(step).padStart(2, "0")} / 04
              </span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                {STEP_LABELS[step]}
              </span>
            </div>
            <div className="h-[2px] w-full overflow-hidden bg-neutral-200/60">
              <div
                className="h-full bg-[#c9a84c] transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="site-container py-5 md:py-6">
        <div
          className={
            step === 4
              ? "flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-start"
              : "flex items-start gap-10"
          }
        >
          <div
            className={`min-w-0 flex-1 ${step === 4 ? "lg:col-span-8" : ""}`}
          >
            {step === 1 && (
              <div>
                <StepHeading
                  title="Seleccionar servicios"
                  subtitle="Elige uno o varios servicios para tu visita al estudio."
                />

                {availableCategories.length > 0 && (
                  <div className="mb-8 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setActiveCategory("all")}
                      className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                        activeCategory === "all"
                          ? "bg-[#111] text-white"
                          : "border border-neutral-200/80 bg-white text-[#111] hover:border-[#c9a84c]/50"
                      }`}
                    >
                      Todos
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`shrink-0 rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all ${
                          activeCategory === cat.id
                            ? "bg-[#111] text-white"
                            : "border border-neutral-200/80 bg-white text-[#111] hover:border-[#c9a84c]/50"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {filteredServices.map((s) => {
                    const selected = selectedServiceIds.includes(s.id)
                    const expanded = expandedServiceId === s.id
                    const longDesc =
                      s.description && s.description.length > 120

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`group w-full rounded-lg p-6 text-left transition-all duration-200 md:p-8 ${
                          selected ? SELECTED_CARD : DEFAULT_CARD
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`font-[family-name:var(--font-playfair),serif] text-lg md:text-xl ${
                                selected
                                  ? "text-[#c9a84c]"
                                  : "text-[#111] group-hover:text-[#c9a84c]"
                              }`}
                            >
                              {s.name}
                            </h3>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                              {formatDuration(s.duration_min)}
                            </p>
                            {s.description && (
                              <div
                                className="mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p
                                  className={`text-sm leading-relaxed text-neutral-600 ${
                                    expanded ? "" : "line-clamp-2"
                                  }`}
                                >
                                  {s.description}
                                </p>
                                {longDesc && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedServiceId(
                                        expanded ? null : s.id
                                      )
                                    }
                                    className="mt-1 text-xs font-medium text-[#111] transition-colors hover:text-[#c9a84c]"
                                  >
                                    {expanded ? "Ver menos" : "Ver más"}
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="mt-4 font-[family-name:var(--font-playfair),serif] text-xl text-[#111]">
                              {formatPrice(s.price)}
                            </p>
                          </div>

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                              selected
                                ? "border-[#111] bg-[#111] text-white"
                                : "border-neutral-300 text-neutral-500 group-hover:border-[#c9a84c]"
                            }`}
                          >
                            {selected ? (
                              <IconCheck />
                            ) : (
                              <span className="text-xl leading-none">+</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {filteredServices.length === 0 && (
                    <p className="py-8 text-center text-sm text-neutral-500">
                      No hay servicios en esta categoría.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeading
                  title="Seleccionar profesional"
                  subtitle="Nuestro equipo está listo para atenderte. Elige a quien prefieras o déjanos asignar según disponibilidad."
                />

                <div className="mx-auto max-w-3xl space-y-3">
                  <div
                    className={`flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-all duration-200 ${
                      selectedProfessionalId === "any"
                        ? SELECTED_CARD
                        : DEFAULT_CARD
                    }`}
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[#c9a84c]">
                      <IconShuffle />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-[family-name:var(--font-playfair),serif] text-lg text-[#111]">
                        Sin preferencia
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                        Máxima disponibilidad
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalId("any")}
                      className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                        selectedProfessionalId === "any"
                          ? "border-[#c9a84c] bg-[#c9a84c] text-[#111]"
                          : "border-neutral-300 text-neutral-600 hover:border-[#c9a84c]"
                      }`}
                    >
                      {selectedProfessionalId === "any"
                        ? "Seleccionado"
                        : "Seleccionar"}
                    </button>
                  </div>

                  {professionals.map((p) => {
                    const selected = selectedProfessionalId === p.id
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-4 rounded-xl p-5 transition-all duration-200 ${
                          selected ? SELECTED_CARD : DEFAULT_CARD
                        }`}
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt={p.name}
                              className="h-full w-full object-cover grayscale"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                              {getInitials(p.name)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-[family-name:var(--font-playfair),serif] text-lg text-[#111]">
                            {p.name}
                          </p>
                          {p.bio && (
                            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                              {p.bio}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProfessionalId(p.id)}
                          className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
                            selected
                              ? "border-[#c9a84c] bg-[#c9a84c] text-[#111]"
                              : "border-neutral-300 text-neutral-600 hover:border-[#c9a84c]"
                          }`}
                        >
                          {selected ? "Seleccionado" : "Seleccionar"}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeading
                  title="Seleccionar fecha y hora"
                  subtitle="Elige el día y horario que mejor se adapte a tu agenda."
                />

                <div className="mb-10">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Fecha
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-color:#a3a3a3_#e5e5e5] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-200/80">
                    {availableDates.map((d) => {
                      const dateStr = toDateString(d)
                      const active = selectedDate === dateStr
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr)
                            setSelectedSlot(null)
                          }}
                          className={`flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
                            active
                              ? "border-[#111] bg-[#111] text-white shadow-md"
                              : "border-neutral-200/80 bg-white text-[#111] hover:border-[#c9a84c]/50"
                          }`}
                        >
                          <span
                            className={`text-[10px] uppercase tracking-wider ${active ? "opacity-70" : "text-neutral-500"}`}
                          >
                            {d.toLocaleDateString("es-MX", {
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold leading-tight">
                            {d.getDate()}
                          </span>
                          <span
                            className={`text-[10px] lowercase ${active ? "opacity-70" : "text-neutral-500"}`}
                          >
                            {d.toLocaleDateString("es-MX", { month: "short" })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-10">
                  <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Hora
                  </p>
                  {!selectedDate ? (
                    <p className="text-sm text-neutral-500">
                      Selecciona una fecha para ver los horarios disponibles.
                    </p>
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Spinner />
                      Cargando horarios…
                    </div>
                  ) : slotsError ? (
                    <p className="text-sm text-red-600">{slotsError}</p>
                  ) : slots.length === 0 ? (
                    <div className="rounded-lg border border-neutral-200/80 bg-white px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-50">
                        <IconCalendar />
                      </div>
                      <p className="text-sm font-medium text-[#111]">
                        Sin disponibilidad este día
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Prueba con otra fecha
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {morningSlots.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2 text-neutral-500">
                            <IconSun morning />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                              Mañana
                            </span>
                          </div>
                          <SlotGrid
                            slots={morningSlots}
                            selectedSlot={selectedSlot}
                            onSelect={setSelectedSlot}
                          />
                        </div>
                      )}
                      {afternoonSlots.length > 0 && (
                        <div>
                          <div className="mb-4 flex items-center gap-2 text-neutral-500">
                            <IconSun morning={false} />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                              Tarde
                            </span>
                          </div>
                          <SlotGrid
                            slots={afternoonSlots}
                            selectedSlot={selectedSlot}
                            onSelect={setSelectedSlot}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedServices.length > 0 && (
                  <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-neutral-200/80 bg-white p-6 shadow-sm md:flex-row">
                    <div>
                      <p className="font-medium text-[#111]">
                        {selectedServices.map((s) => s.name).join(" · ")}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {formatDuration(totalDuration)} con {profLabel}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                        Total
                      </p>
                      <p className="font-[family-name:var(--font-playfair),serif] text-2xl text-[#c9a84c]">
                        {formatPrice(totalPrice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeading
                  title="Revisar y confirmar"
                  subtitle="Verifica los detalles de tu cita antes de proceder al pago."
                />

                <div className="space-y-8">
                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Políticas
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <span className="text-[#c9a84c]">ℹ</span>
                        <div>
                          <p className="text-sm font-semibold text-[#111]">
                            Política de cancelación
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                            Cancela con al menos 24 horas de anticipación. Los
                            pagos no son reembolsables una vez procesados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Número de celular
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <label
                        htmlFor="booking-phone"
                        className="mb-3 block text-sm font-semibold text-[#111]"
                      >
                        Tu celular
                      </label>
                      <p className="mb-4 text-sm text-neutral-500">
                        Lo usaremos para confirmar tu cita y enviarte
                        recordatorios.
                      </p>
                      <input
                        id="booking-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                          if (phoneError) setPhoneError(null)
                        }}
                        placeholder="10 dígitos"
                        className={`w-full max-w-sm border-0 border-b bg-transparent py-3 text-sm text-[#111] outline-none placeholder:text-neutral-400 focus:border-[#c9a84c] ${
                          phoneError
                            ? "border-red-400"
                            : "border-neutral-200"
                        }`}
                      />
                      {phoneError && (
                        <p className="mt-2 text-xs text-red-600">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Personalización
                    </h3>
                    <div className="rounded-lg border border-neutral-200/60 bg-white p-6 md:p-8">
                      <label
                        htmlFor="booking-notes"
                        className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
                      >
                        ¿Algo más que debamos saber?
                      </label>
                      {showNotesInput ? (
                        <textarea
                          id="booking-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Alergias, preferencias o solicitudes especiales…"
                          rows={3}
                          className="w-full resize-none border-0 border-b border-neutral-200 bg-transparent py-3 text-sm text-[#111] outline-none placeholder:text-neutral-400 focus:border-[#c9a84c]"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-neutral-500">
                            Comentarios o solicitudes especiales
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowNotesInput(true)}
                            className="shrink-0 rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-[#111] transition-colors hover:border-[#111]"
                          >
                            Añadir
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {submitError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedServiceIds.length > 0 && (
              <div className="mt-8 lg:hidden">
                <BookingSummary {...summaryProps} />
              </div>
            )}
          </div>

          {step < 4 ? (
            <div className="hidden w-72 shrink-0 lg:block xl:w-80">
              <div className="sticky top-[calc(var(--site-chrome-bottom)+5.5rem)]">
                <BookingSummary {...summaryProps} />
              </div>
            </div>
          ) : (
            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-[calc(var(--site-chrome-bottom)+5.5rem)]">
                <BookingSummary {...summaryProps} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
