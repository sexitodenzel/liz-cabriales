"use client"

import { useCallback, useEffect, useState } from "react"
import DatePicker from "@/components/shared/DatePicker"
import { toast } from "@/app/components/ui/motion/toast-provider"

type CourseInfo = {
  id: string
  title: string
  start_date: string
  start_time: string
}

type CourseDayEntry = {
  id: string
  start_time: string
  end_time: string
}

type RegisteredCourse = {
  course: CourseInfo
  course_day: CourseDayEntry | null
}

type ManualDay = {
  id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

const MONTHS_ES = [
  "ene","feb","mar","abr","may","jun",
  "jul","ago","sep","oct","nov","dic",
]
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DAYS_ES[dt.getDay()]} ${d} ${MONTHS_ES[m - 1]} ${y}`
}

function fmtTime(t: string) {
  return t.slice(0, 5)
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Sub-component: row for a registered course ────────────────────────────

function CourseRow({
  item,
  onToggle,
  onSaveHours,
}: {
  item: RegisteredCourse
  onToggle: (course: CourseInfo, enabled: boolean) => Promise<void>
  onSaveHours: (id: string, start: string, end: string) => Promise<void>
}) {
  const { course, course_day } = item
  const enabled = course_day !== null

  const [start, setStart] = useState(
    course_day ? fmtTime(course_day.start_time) : "10:00"
  )
  const [end, setEnd] = useState(
    course_day ? fmtTime(course_day.end_time) : "14:00"
  )
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  const dirty =
    enabled &&
    course_day &&
    (start !== fmtTime(course_day.start_time) || end !== fmtTime(course_day.end_time))

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(course, !enabled)
    } finally {
      setToggling(false)
    }
  }

  const handleSave = async () => {
    if (!course_day) return
    setSaving(true)
    try {
      await onSaveHours(course_day.id, start, end)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        enabled
          ? "border-[#e8dcb0] bg-[#fdf9ef]"
          : "border-[#ececec] bg-[#fafafa]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 transition-colors ${
            enabled
              ? "border-[#c9a84c] bg-[#c9a84c]"
              : "border-[#d4d4d4] bg-white hover:border-[#c9a84c]"
          } ${toggling ? "opacity-50" : ""} flex items-center justify-center`}
          title={enabled ? "Deshabilitar recogida" : "Habilitar recogida"}
        >
          {enabled && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-sm font-semibold text-[#1a1a1a]">{course.title}</span>
            <span className="text-xs text-[#6b6b6b]">{fmtDate(course.start_date)}</span>
            <span className="text-xs text-[#9a9a9a]">Curso: {fmtTime(course.start_time)}</span>
          </div>

          {enabled ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#6b6b6b]">Recogida:</span>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-md border border-[#e8dcb0] bg-white px-2 py-1 text-xs outline-none focus:border-[#c9a84c] transition-colors"
              />
              <span className="text-xs text-[#9a9a9a]">a</span>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-md border border-[#e8dcb0] bg-white px-2 py-1 text-xs outline-none focus:border-[#c9a84c] transition-colors"
              />
              {dirty && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-[#c9a84c] px-3 py-1 text-xs font-semibold text-white hover:bg-[#a8893a] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-[#9a9a9a]">
              Recogida deshabilitada para este día
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function CourseDaysPanel() {
  const [registeredCourses, setRegisteredCourses] = useState<RegisteredCourse[]>([])
  const [manualDays, setManualDays] = useState<ManualDay[]>([])
  const [loading, setLoading] = useState(true)

  // Manual add form
  const [newDate, setNewDate] = useState("")
  const [newStart, setNewStart] = useState("10:00")
  const [newEnd, setNewEnd] = useState("14:00")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/course-days")
      const json = await res.json()
      if (res.ok && json.data) {
        setRegisteredCourses(json.data.registered_courses ?? [])
        setManualDays(json.data.manual_days ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Detect if selected date has a registered course
  const matchedCourse = newDate
    ? registeredCourses.find((rc) => rc.course.start_date === newDate)
    : null

  const alreadyManual = manualDays.some((d) => d.date === newDate)

  const handleToggle = async (course: CourseInfo, enable: boolean) => {
    if (!enable) {
      // Find and delete the course_day entry for this course
      const existing = registeredCourses.find(
        (rc) => rc.course.id === course.id
      )?.course_day
      if (!existing) return
      await fetch(`/api/admin/course-days/${existing.id}`, { method: "DELETE" })
    } else {
      // Create a new course_day entry linked to this course
      await fetch("/api/admin/course-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: course.start_date,
          start_time: "10:00",
          end_time: "14:00",
          course_name: course.title,
        }),
      })
    }
    fetchData()
  }

  const handleSaveHours = async (id: string, start: string, end: string) => {
    await fetch(`/api/admin/course-days/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: start, end_time: end }),
    })
    fetchData()
  }

  const handleAddManual = async () => {
    if (!newDate) return
    setError(null)

    if (alreadyManual) {
      setError("Esa fecha ya está agregada manualmente")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/course-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, start_time: newStart, end_time: newEnd }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo agregar")
        return
      }
      toast.success("Día de curso agregado")
      setNewDate("")
      fetchData()
    } catch {
      toast.error("Error de red")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteManual = async (id: string) => {
    await fetch(`/api/admin/course-days/${id}`, { method: "DELETE" })
    setManualDays((prev) => prev.filter((d) => d.id !== id))
  }

  const enabledCount =
    registeredCourses.filter((rc) => rc.course_day !== null).length +
    manualDays.length

  return (
    <div className="mt-6 rounded-2xl border border-[#ececec] bg-white p-5">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#c9a84c]">
            TIENDA · AGENDA
          </p>
          {enabledCount > 0 && (
            <span className="rounded-full bg-[#f5efdc] px-2 py-0.5 text-[11px] font-semibold text-[#a8893a]">
              {enabledCount} activo{enabledCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <h2 className="mt-0.5 text-base font-semibold text-[#1a1a1a]">
          Días de curso
        </h2>
        <p className="mt-0.5 text-xs text-[#6b6b6b]">
          En los días marcados, la recogida en tienda muestra un horario especial
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#6b6b6b]">Cargando…</p>
      ) : (
        <>
          {/* ── Registered courses ─────────────────────────────────────── */}
          {registeredCourses.length > 0 && (
            <section className="mb-5">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
                Cursos registrados
              </p>
              <div className="space-y-2">
                {registeredCourses.map((item) => (
                  <CourseRow
                    key={item.course.id}
                    item={item}
                    onToggle={handleToggle}
                    onSaveHours={handleSaveHours}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Manual days ────────────────────────────────────────────── */}
          <section>
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b]">
              Agregar sin curso registrado
            </p>

            {/* Add form */}
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-[10px] font-medium text-[#6b6b6b]">
                  Fecha
                </label>
                <DatePicker
                  value={newDate}
                  min={todayStr()}
                  onChange={(next) => {
                    setNewDate(next)
                    setError(null)
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#6b6b6b]">
                  Recogida de
                </label>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="mt-1 rounded-lg border border-[#ececec] px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#6b6b6b]">
                  a
                </label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="mt-1 rounded-lg border border-[#ececec] px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleAddManual}
                disabled={!newDate || saving || !!matchedCourse}
                className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {saving ? "Guardando…" : "Agregar"}
              </button>
            </div>

            {/* Smart detection feedback */}
            {newDate && matchedCourse && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#e8dcb0] bg-[#fdf9ef] px-3.5 py-2.5 text-[13px]">
                <span className="mt-px shrink-0 text-[#c9a84c]">ℹ</span>
                <span className="text-[#7a6020]">
                  Ya hay un curso registrado para esta fecha:{" "}
                  <strong>"{matchedCourse.course.title}"</strong>.{" "}
                  Habilítalo desde la sección de arriba.
                </span>
              </div>
            )}

            {newDate && !matchedCourse && !alreadyManual && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#ececec] bg-[#fafafa] px-3.5 py-2.5 text-[13px]">
                <span className="mt-px shrink-0 text-[#9a9a9a]">ℹ</span>
                <span className="text-[#6b6b6b]">
                  No hay curso registrado para esta fecha.{" "}
                  <a
                    href={`/admin/courses/new?start_date=${newDate}`}
                    className="font-medium text-[#a8893a] underline underline-offset-2 hover:text-[#c9a84c]"
                  >
                    ¿Crear un curso para este día?
                  </a>
                </span>
              </div>
            )}

            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}

            {/* Manual days list */}
            {manualDays.length > 0 && (
              <ul className="mt-3.5 space-y-1.5">
                {manualDays.map((day) => (
                  <li
                    key={day.id}
                    className="flex items-center justify-between rounded-lg border border-[#ececec] bg-[#fafafa] px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {fmtDate(day.date)}
                      </span>
                      <span className="text-xs text-[#9a9a9a]">
                        {fmtTime(day.start_time)}–{fmtTime(day.end_time)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteManual(day.id)}
                      className="rounded-md p-1 text-[#9a9a9a] hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
