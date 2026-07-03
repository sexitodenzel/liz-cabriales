"use client"

import { useEffect, useMemo, useState } from "react"

import {
  buildStudioTimeOptions,
  DEFAULT_STUDIO_WEEKLY_HOURS,
  STUDIO_WEEK_DAYS,
  type StudioWeeklyHourRow,
} from "@/lib/appointments/studio-hours"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  className?: string
}

function sortByUiOrder(rows: StudioWeeklyHourRow[]): StudioWeeklyHourRow[] {
  const order = STUDIO_WEEK_DAYS.map((d) => d.day_of_week)
  return [...rows].sort(
    (a, b) => order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week)
  )
}

function initialWeeklyRows(): StudioWeeklyHourRow[] {
  return sortByUiOrder(DEFAULT_STUDIO_WEEKLY_HOURS)
}

export default function AvailabilitySchedulePanel({ className = "" }: Props) {
  const timeOptions = useMemo(() => buildStudioTimeOptions(), [])

  const [weeklyHours, setWeeklyHours] = useState<StudioWeeklyHourRow[]>(
    initialWeeklyRows
  )
  const [loadingHours, setLoadingHours] = useState(true)
  const [savingHours, setSavingHours] = useState(false)

  useEffect(() => {
    let mounted = true
    void fetch("/api/admin/studio-hours")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: StudioWeeklyHourRow[] } | null) => {
        if (!mounted || !Array.isArray(json?.data)) return
        setWeeklyHours(sortByUiOrder(json.data))
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingHours(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const updateDay = (
    dayOfWeek: StudioWeeklyHourRow["day_of_week"],
    patch: Partial<StudioWeeklyHourRow>
  ) => {
    setWeeklyHours((prev) =>
      prev.map((row) =>
        row.day_of_week === dayOfWeek ? { ...row, ...patch } : row
      )
    )
  }

  const handleSaveWeeklyHours = async () => {
    setSavingHours(true)
    try {
      const res = await fetch("/api/admin/studio-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: weeklyHours }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar el horario")
        return
      }
      if (Array.isArray(json.data)) {
        setWeeklyHours(sortByUiOrder(json.data))
      }
      toast.success("Horario de disponibilidad guardado")
    } catch {
      toast.error("Error de red al guardar el horario")
    } finally {
      setSavingHours(false)
    }
  }

  return (
    <section
      className={`overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Disponibilidad de horario
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Define desde qué hora se pueden agendar citas cada día. Los clientes
          solo verán esos horarios al reservar.
        </p>
      </div>

      <div className="space-y-6 px-5 py-5">
        {loadingHours ? (
          <p className="text-sm text-neutral-500">Cargando horario…</p>
        ) : (
          <div className="space-y-4">
            {STUDIO_WEEK_DAYS.map(({ day_of_week, label }) => {
              const row =
                weeklyHours.find((h) => h.day_of_week === day_of_week) ??
                DEFAULT_STUDIO_WEEKLY_HOURS.find(
                  (h) => h.day_of_week === day_of_week
                )!

              return (
                <div
                  key={day_of_week}
                  className="grid gap-4 rounded-lg border border-neutral-100 bg-neutral-50/60 p-4 md:grid-cols-[120px_1fr]"
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={`open-${day_of_week}`}
                      type="checkbox"
                      checked={row.is_open}
                      onChange={(e) =>
                        updateDay(day_of_week, { is_open: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-[#c9a84c] focus:ring-[#c9a84c]"
                    />
                    <label
                      htmlFor={`open-${day_of_week}`}
                      className="text-sm font-semibold text-[#111]"
                    >
                      {label}
                    </label>
                  </div>

                  {row.is_open ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                          Citas a partir de
                        </label>
                        <select
                          value={row.open_time.slice(0, 5)}
                          onChange={(e) =>
                            updateDay(day_of_week, {
                              open_time: e.target.value,
                            })
                          }
                          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                        >
                          {timeOptions.map((opt) => (
                            <option
                              key={`open-${day_of_week}-${opt.value}`}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                          Hasta
                        </label>
                        <select
                          value={row.close_time.slice(0, 5)}
                          onChange={(e) =>
                            updateDay(day_of_week, {
                              close_time: e.target.value,
                            })
                          }
                          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c]"
                        >
                          {timeOptions.map((opt) => (
                            <option
                              key={`close-${day_of_week}-${opt.value}`}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      Cerrado — sin citas este día
                    </p>
                  )}
                </div>
              )
            })}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleSaveWeeklyHours()}
                disabled={savingHours}
                className="rounded-lg bg-[#111] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {savingHours ? "Guardando…" : "Guardar horario"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
