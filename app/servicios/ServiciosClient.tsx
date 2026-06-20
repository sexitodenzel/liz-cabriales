"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { ProfessionalRow, ServiceRow } from "@/lib/supabase/appointments"

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
  3: "Hora",
  4: "Confirmar",
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
      strokeWidth="2.5"
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
      strokeWidth="2.5"
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

function IconStar() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="#F59E0B"
      stroke="#F59E0B"
      strokeWidth="1"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
      stroke="#737373"
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

function IconClock() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-[#d0d0d0] border-t-[#0a0a0a] rounded-full animate-spin" />
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

  const canContinue =
    (step === 1 && selectedServiceIds.length > 0) ||
    (step === 2 && selectedProfessionalId !== null) ||
    (step === 3 && selectedSlot !== null) ||
    step === 4

  const handleContinue = () => {
    if (canContinue && step < 4) setStep((s) => (s + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(
          "pendingAppointment",
          JSON.stringify({
            service_ids: selectedServiceIds,
            professional_id: selectedProfessionalId,
            date: selectedDate,
            start_time: selectedSlot?.start_time,
          })
        )
      } catch {}
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
        setSubmitError(
          payJson?.error?.message ??
            "Cita creada, pero no se pudo iniciar el pago"
        )
        return
      }

      if (payJson.data.payment_url) {
        // Open MercadoPago in a new tab so the user can come back to the
        // appointment detail page without losing context (Shopify-style).
        const newTab = window.open(payJson.data.payment_url, "_blank")
        if (!newTab) {
          setSubmitError(
            "Tu navegador bloqueó la ventana de pago. Ve a tu cita y usa el botón de pago."
          )
        }
        // Navigate the original tab to the appointment detail page where the
        // user can re-open the payment if needed or cancel.
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
      <main className="min-h-screen bg-[#f5f5f3] site-container flex items-center justify-center py-16">
        <div className="max-w-md w-full rounded-3xl border border-[#e5e5e5] bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
            Cita activa
          </p>
          <h1 className="mt-3 text-2xl font-bold text-[#0a0a0a]">
            Ya tienes una cita reservada
          </h1>
          <p className="mt-3 text-sm text-[#737373]">
            Solo puedes tener una cita activa a la vez. Revisa o cancela tu
            cita actual antes de reservar una nueva.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href={`/cita/${activeAppointmentId}`}
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Ver mi cita
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[#e5e5e5] px-6 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a]"
            >
              Inicio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const profLabel =
    selectedProfessionalId === "any"
      ? "cualquier profesional"
      : (selectedProfessional?.name ?? "cualquier profesional")

  const sidebar = (
    <div className="rounded-2xl border border-[#e5e5e5] bg-white overflow-hidden shadow-sm">
      <div className="p-5 border-b border-[#f0f0ee]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#fdf8ea] flex items-center justify-center shrink-0 border border-[#efe8c8]">
            <span className="text-[13px] font-black tracking-tight text-[#C9A84C]">
              LC
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[14px] text-[#0a0a0a] leading-tight">
              Liz Cabriales Studio
            </p>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <IconStar key={i} />
              ))}
              <span className="text-[11px] text-[#737373] ml-1">5.0</span>
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5 truncate">
              Monterrey, NL
            </p>
          </div>
        </div>
      </div>

      {selectedServices.length > 0 && (
        <div className="px-5 py-4 border-b border-[#f0f0ee] space-y-3">
          {selectedServices.map((s) => (
            <div key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-[#0a0a0a] leading-snug">
                  {s.name}
                </p>
                <p className="text-[13px] font-semibold text-[#0a0a0a] shrink-0">
                  {formatPrice(s.price)}
                </p>
              </div>
              <p className="text-[11px] text-[#737373] mt-0.5">
                {formatDuration(s.duration_min)} con {profLabel}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedDate && selectedSlot && (
        <div className="px-5 py-4 border-b border-[#f0f0ee] space-y-2">
          <div className="flex items-center gap-2 text-[13px] text-[#0a0a0a]">
            <IconCalendar />
            <span className="capitalize">{prettyDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#0a0a0a]">
            <IconClock />
            <span>
              {formatTimeLabel(selectedSlot.start_time)}
              {selectedSlot.end_time
                ? `–${formatTimeLabel(selectedSlot.end_time)}`
                : ""}{" "}
              ({formatDuration(totalDuration)})
            </span>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-medium text-[#0a0a0a]">Total</p>
            <p className="text-base font-bold text-[#0a0a0a]">
              {formatPrice(totalPrice)}
            </p>
          </div>
        )}

        {step < 4 ? (
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1f1f1f] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            Continuar <span aria-hidden>→</span>
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Spinner /> Procesando…
              </>
            ) : (
              "Confirmar"
            )}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      <div className="sticky top-0 z-20 bg-[#f5f5f3]/95 backdrop-blur-sm border-b border-[#e8e8e5]">
        <div className="site-container flex items-center justify-between h-14">
          <button
            onClick={handleBack}
            disabled={step === 1}
            aria-label="Volver"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#e5e5e5] bg-white text-[#0a0a0a] transition-all hover:border-[#0a0a0a] hover:shadow-sm disabled:opacity-30 disabled:cursor-default"
          >
            <IconArrowLeft />
          </button>

          <nav className="flex items-center gap-1 text-[13px]" aria-label="Pasos">
            {([1, 2, 3, 4] as Step[]).map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="text-[#d0d0d0] select-none">›</span>
                )}
                <button
                  onClick={() => s < step && setStep(s)}
                  disabled={s >= step}
                  className={`transition-colors rounded px-1 py-0.5 ${
                    s === step
                      ? "font-bold text-[#0a0a0a]"
                      : s < step
                      ? "text-[#0a0a0a] hover:text-[#C9A84C] cursor-pointer underline-offset-2 hover:underline"
                      : "text-[#c0c0bc] cursor-default"
                  }`}
                >
                  {STEP_LABELS[s]}
                </button>
              </span>
            ))}
          </nav>

          <Link
            href="/"
            aria-label="Cerrar"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#e5e5e5] bg-white text-[#0a0a0a] transition-all hover:border-[#0a0a0a] hover:shadow-sm"
          >
            <IconX />
          </Link>
        </div>
      </div>

      <div className="site-container py-8 pb-32 lg:pb-12">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            {step === 1 && (
              <div>
                <h1 className="text-[2rem] font-bold text-[#0a0a0a] mb-6 leading-tight">
                  Seleccionar servicios
                </h1>

                {availableCategories.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-6 [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        activeCategory === "all"
                          ? "bg-[#0a0a0a] text-white shadow-sm"
                          : "bg-white border border-[#e5e5e5] text-[#0a0a0a] hover:border-[#a0a0a0]"
                      }`}
                    >
                      Todos
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          activeCategory === cat.id
                            ? "bg-[#0a0a0a] text-white shadow-sm"
                            : "bg-white border border-[#e5e5e5] text-[#0a0a0a] hover:border-[#a0a0a0]"
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
                      <div
                        key={s.id}
                        className={`rounded-2xl border bg-white p-5 transition-all duration-150 ${
                          selected
                            ? "border-[#7c6af7] bg-[#faf8ff] shadow-sm"
                            : "border-[#e5e5e5] hover:border-[#b0b0b0]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] text-[#0a0a0a] leading-snug">
                              {s.name}
                            </p>
                            <p className="text-[12px] text-[#737373] mt-1">
                              {formatDuration(s.duration_min)}
                            </p>
                            {s.description && (
                              <>
                                <p
                                  className={`text-[13px] text-[#555] mt-2 leading-relaxed ${
                                    expanded ? "" : "line-clamp-2"
                                  }`}
                                >
                                  {s.description}
                                </p>
                                {longDesc && (
                                  <button
                                    onClick={() =>
                                      setExpandedServiceId(
                                        expanded ? null : s.id
                                      )
                                    }
                                    className="text-[12px] font-medium text-[#0a0a0a] mt-1 hover:text-[#C9A84C] transition-colors"
                                  >
                                    {expanded ? "Ver menos" : "Ver más"}
                                  </button>
                                )}
                              </>
                            )}
                            <p className="font-bold text-[15px] text-[#0a0a0a] mt-3">
                              {formatPrice(s.price)}
                            </p>
                          </div>

                          <button
                            onClick={() => toggleService(s.id)}
                            aria-label={
                              selected
                                ? `Quitar ${s.name}`
                                : `Agregar ${s.name}`
                            }
                            className={`shrink-0 mt-0.5 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                              selected
                                ? "bg-[#0a0a0a] border-[#0a0a0a] text-white shadow-sm"
                                : "border-[#c8c8c8] text-[#0a0a0a] hover:border-[#0a0a0a] bg-white"
                            }`}
                          >
                            {selected ? (
                              <IconCheck />
                            ) : (
                              <span className="text-xl leading-none translate-y-[-1px]">
                                +
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {filteredServices.length === 0 && (
                    <p className="text-sm text-[#737373] text-center py-8">
                      No hay servicios en esta categoría.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-[2rem] font-bold text-[#0a0a0a] mb-6 leading-tight">
                  Seleccionar profesional
                </h1>

                <div className="space-y-3">
                  <div
                    className={`rounded-2xl border bg-white p-5 flex items-center gap-4 transition-all duration-150 ${
                      selectedProfessionalId === "any"
                        ? "border-[#7c6af7] bg-[#faf8ff] shadow-sm"
                        : "border-[#e5e5e5] hover:border-[#b0b0b0]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f0f0ee] flex items-center justify-center shrink-0">
                      <IconShuffle />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-[#0a0a0a]">
                        Sin preferencia
                      </p>
                      <p className="text-[13px] text-[#737373] mt-0.5">
                        Máxima disponibilidad
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProfessionalId("any")}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-all ${
                        selectedProfessionalId === "any"
                          ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                          : "border-[#c8c8c8] text-[#0a0a0a] hover:border-[#0a0a0a] bg-white"
                      }`}
                    >
                      {selectedProfessionalId === "any"
                        ? "Seleccionado"
                        : "Seleccionar"}
                    </button>
                  </div>

                  {professionals.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl border bg-white p-5 flex items-center gap-4 transition-all duration-150 ${
                        selectedProfessionalId === p.id
                          ? "border-[#7c6af7] bg-[#faf8ff] shadow-sm"
                          : "border-[#e5e5e5] hover:border-[#b0b0b0]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#f0f0ee] overflow-hidden shrink-0">
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-[#737373]">
                            {getInitials(p.name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-[#0a0a0a]">
                          {p.name}
                        </p>
                        {p.bio && (
                          <p className="text-[13px] text-[#737373] mt-0.5 line-clamp-1">
                            {p.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <IconStar key={i} />
                          ))}
                          <span className="text-[11px] text-[#737373] ml-1">
                            5.0
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProfessionalId(p.id)}
                        className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-all ${
                          selectedProfessionalId === p.id
                            ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                            : "border-[#c8c8c8] text-[#0a0a0a] hover:border-[#0a0a0a] bg-white"
                        }`}
                      >
                        {selectedProfessionalId === p.id
                          ? "Seleccionado"
                          : "Seleccionar"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-[2rem] font-bold text-[#0a0a0a] mb-6 leading-tight">
                  Seleccionar fecha y hora
                </h1>

                <div className="mb-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#737373] mb-3">
                    Fecha
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    {availableDates.map((d) => {
                      const dateStr = toDateString(d)
                      const active = selectedDate === dateStr
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDate(dateStr)
                            setSelectedSlot(null)
                          }}
                          className={`shrink-0 rounded-xl px-4 py-3 text-center transition-all duration-150 min-w-[56px] ${
                            active
                              ? "bg-[#0a0a0a] text-white shadow-sm"
                              : "bg-white border border-[#e5e5e5] text-[#0a0a0a] hover:border-[#a0a0a0]"
                          }`}
                        >
                          <p
                            className={`text-[10px] uppercase tracking-wider leading-none ${active ? "opacity-70" : "text-[#737373]"}`}
                          >
                            {d.toLocaleDateString("es-MX", {
                              weekday: "short",
                            })}
                          </p>
                          <p className="text-[18px] font-bold leading-tight mt-1">
                            {d.getDate()}
                          </p>
                          <p
                            className={`text-[10px] leading-none mt-0.5 ${active ? "opacity-70" : "text-[#737373]"}`}
                          >
                            {d.toLocaleDateString("es-MX", { month: "short" })}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#737373] mb-3">
                    Hora
                  </p>
                  {!selectedDate ? (
                    <p className="text-sm text-[#737373]">
                      Selecciona una fecha para ver los horarios disponibles.
                    </p>
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-[#737373]">
                      <Spinner />
                      Cargando horarios…
                    </div>
                  ) : slotsError ? (
                    <p className="text-sm text-red-600">{slotsError}</p>
                  ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-[#e5e5e5] bg-white px-6 py-10 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#f5f5f3] flex items-center justify-center mx-auto mb-3">
                        <IconCalendar />
                      </div>
                      <p className="font-medium text-[#0a0a0a] text-sm">
                        Sin disponibilidad este día
                      </p>
                      <p className="text-[12px] text-[#737373] mt-1">
                        Prueba con otra fecha
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const active =
                          selectedSlot?.start_time === slot.start_time &&
                          selectedSlot?.professional_id ===
                            slot.professional_id
                        return (
                          <button
                            key={`${slot.professional_id}-${slot.start_time}`}
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-xl border py-3 text-[13px] font-medium transition-all duration-150 ${
                              active
                                ? "bg-[#C9A84C] border-[#C9A84C] text-[#0a0a0a] shadow-sm"
                                : "bg-white border-[#e5e5e5] text-[#0a0a0a] hover:border-[#a0a0a0]"
                            }`}
                          >
                            {formatTimeLabel(slot.start_time)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-[2rem] font-bold text-[#0a0a0a] mb-6 leading-tight">
                  Revisar y confirmar
                </h1>

                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0a0a0a] mb-3">
                      Más detalles
                    </p>
                    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
                      <p className="font-semibold text-[14px] text-[#0a0a0a]">
                        Política de cancelación
                      </p>
                      <p className="text-[13px] text-[#737373] mt-1 leading-relaxed">
                        Cancela con al menos 24 horas de anticipación. Los
                        pagos no son reembolsables.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold text-[#0a0a0a] mb-3">
                      Comentarios o solicitudes
                    </p>
                    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5">
                      {showNotesInput ? (
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Escribe aquí cualquier comentario o solicitud especial…"
                          rows={3}
                          className="w-full text-[13px] text-[#0a0a0a] resize-none outline-none placeholder:text-[#c0c0bc] leading-relaxed"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] text-[#737373]">
                            ¿Algo que quieras que sepamos?
                          </p>
                          <button
                            onClick={() => setShowNotesInput(true)}
                            className="text-[13px] font-medium text-[#0a0a0a] border border-[#e5e5e5] rounded-full px-4 py-1.5 hover:border-[#0a0a0a] transition-colors bg-white"
                          >
                            Añadir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-[13px] text-red-700">{submitError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-[5.5rem]">
            {sidebar}
          </div>
        </div>
      </div>

      {selectedServiceIds.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-6 py-4 flex items-center justify-between z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div>
            <p className="text-[11px] text-[#737373]">
              {selectedServiceIds.length} servicio
              {selectedServiceIds.length > 1 ? "s" : ""}
            </p>
            <p className="font-bold text-[#0a0a0a] text-[15px]">
              {formatPrice(totalPrice)}
            </p>
          </div>
          {step < 4 ? (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-35 flex items-center gap-1.5"
            >
              Continuar <span aria-hidden>→</span>
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-35 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Spinner /> Procesando…
                </>
              ) : (
                "Confirmar"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
