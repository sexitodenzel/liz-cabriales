"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  ProfessionalRow,
  ServiceRow,
} from "@/lib/supabase/appointments"

type Props = {
  services: ServiceRow[]
  professionals: ProfessionalRow[]
  isAuthenticated: boolean
  activeAppointmentId: string | null
}

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

const DAYS_MS = 1000 * 60 * 60 * 24

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

function prettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function buildAvailableDates(): Date[] {
  const out: Date[] = []
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i < 30; i++) {
    const d = new Date(start.getTime() + i * DAYS_MS)
    if (d.getDay() === 0) continue // sin domingos
    out.push(d)
  }
  return out
}

export default function CitasClient({
  services,
  professionals,
  isAuthenticated,
  activeAppointmentId,
}: Props) {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
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

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Carga slots cada vez que cambia fecha / profesional / duración
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
      const res = await fetch(`/api/appointments/availability?${qs.toString()}`)
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
    if (step === 3) {
      fetchSlots()
    }
  }, [step, fetchSlots])

  const canAdvanceFromStep1 = selectedServiceIds.length > 0
  const canAdvanceFromStep2 = selectedProfessionalId !== null
  const canAdvanceFromStep3 = selectedSlot !== null

  const handleReserve = async () => {
    if (!isAuthenticated) {
      // Preservamos contexto en sessionStorage para restaurar selección al volver
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
      } catch {
        // noop
      }
      router.push("/login?redirect=/citas")
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
        setSubmitError(
          json?.error?.message ?? "No se pudo crear la cita"
        )
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
        window.location.href = payJson.data.payment_url
      } else {
        setSubmitError("MercadoPago no devolvió una URL de pago")
      }
    } catch {
      setSubmitError("Error de red al reservar")
    } finally {
      setSubmitting(false)
    }
  }

  if (activeAppointmentId) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-16 text-[#0a0a0a]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e8e1d3] bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
            Ya tienes una cita activa
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            No puedes reservar otra cita
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Solo puedes tener una cita activa a la vez. Revisa o cancela tu cita
            actual antes de reservar una nueva.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/cita/${activeAppointmentId}`}
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Ver mi cita
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] px-6 py-12 text-[#0a0a0a]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
            Reservar cita
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Agenda tu cita</h1>
        </header>

        {/* Progreso */}
        <div className="mb-8 flex items-center justify-between gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider ${
                step >= n
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-white/70 text-neutral-400 border border-neutral-200"
              }`}
            >
              Paso {n}
            </div>
          ))}
        </div>

        <section className="rounded-[24px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold">Selecciona tus servicios</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Puedes combinar varios; la duración se suma.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {services.map((s) => {
                  const active = selectedServiceIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? "border-[#C9A84C] bg-[#fdf8ea]"
                          : "border-neutral-200 bg-[#fcfbf8] hover:border-[#C9A84C]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          {s.description && (
                            <p className="mt-1 text-xs text-neutral-500">
                              {s.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs uppercase tracking-wider text-neutral-500">
                            {formatDuration(s.duration_min)}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold">
                          {formatPrice(s.price)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold">Selecciona profesional</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Cada profesional tiene su propia agenda.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfessionalId("any")}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    selectedProfessionalId === "any"
                      ? "border-[#C9A84C] bg-[#fdf8ea]"
                      : "border-neutral-200 bg-[#fcfbf8] hover:border-[#C9A84C]/60"
                  }`}
                >
                  <p className="text-sm font-semibold">Cualquiera</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Asignamos quien esté disponible.
                  </p>
                </button>
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProfessionalId(p.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selectedProfessionalId === p.id
                        ? "border-[#C9A84C] bg-[#fdf8ea]"
                        : "border-neutral-200 bg-[#fcfbf8] hover:border-[#C9A84C]/60"
                    }`}
                  >
                    <p className="text-sm font-semibold">{p.name}</p>
                    {p.bio && (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                        {p.bio}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold">Selecciona fecha y hora</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Horarios lunes a sábado, 9:00 a.m. – 7:00 p.m.
              </p>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Fecha
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
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
                        className={`shrink-0 rounded-xl border px-4 py-2 text-center transition-colors ${
                          active
                            ? "border-[#C9A84C] bg-[#fdf8ea]"
                            : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                          {d.toLocaleDateString("es-MX", {
                            weekday: "short",
                          })}
                        </p>
                        <p className="text-base font-semibold">
                          {d.getDate()}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {d.toLocaleDateString("es-MX", { month: "short" })}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Hora
                </p>
                {!selectedDate ? (
                  <p className="text-sm text-neutral-500">
                    Primero selecciona una fecha.
                  </p>
                ) : loadingSlots ? (
                  <p className="text-sm text-neutral-500">
                    Cargando horarios…
                  </p>
                ) : slotsError ? (
                  <p className="text-sm text-red-700">{slotsError}</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No hay horarios disponibles para este día.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((slot) => {
                      const active =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.professional_id === slot.professional_id
                      return (
                        <button
                          key={`${slot.professional_id}-${slot.start_time}`}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            active
                              ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                              : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
                          }`}
                        >
                          {formatTimeLabel(slot.start_time)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold">Resumen</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    Servicios
                  </p>
                  <ul className="mt-2 space-y-2">
                    {selectedServices.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {s.name}{" "}
                          <span className="text-xs text-neutral-500">
                            ({formatDuration(s.duration_min)})
                          </span>
                        </span>
                        <span className="font-semibold">
                          {formatPrice(s.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Profesional
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedProfessionalId === "any"
                        ? "Cualquiera disponible"
                        : professionals.find(
                            (p) => p.id === selectedProfessionalId
                          )?.name ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Fecha y hora
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedDate ? prettyDate(selectedDate) : "—"}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {selectedSlot
                        ? formatTimeLabel(selectedSlot.start_time)
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-5 py-4 text-white">
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-lg font-semibold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500">
                  El pago se realiza en su totalidad al reservar. Las
                  cancelaciones requieren al menos 24 horas de anticipación y no
                  son reembolsables.
                </p>

                {submitError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
              disabled={step === 1 || submitting}
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-50"
            >
              Atrás
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => ((s + 1) as 2 | 3 | 4))}
                disabled={
                  (step === 1 && !canAdvanceFromStep1) ||
                  (step === 2 && !canAdvanceFromStep2) ||
                  (step === 3 && !canAdvanceFromStep3)
                }
                className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReserve}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Procesando…" : "Reservar y pagar"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
