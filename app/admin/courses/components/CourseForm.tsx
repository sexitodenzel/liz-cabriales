"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type { InstructorRow } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

export type CourseFormInitialValues = {
  title: string
  description: string
  instructor_id: string
  price: string
  capacity: string
  level: CourseLevel
  start_date: string
  end_date: string
  start_time: string
  location: string
  cover_image: string
  is_published: boolean
}

type Props = {
  mode: "create" | "edit"
  courseId?: string
  instructors: InstructorRow[]
  initialValues: CourseFormInitialValues
}

const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "open", label: "Abierto" },
]

export default function CourseForm({
  mode,
  courseId,
  instructors,
  initialValues,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<CourseFormInitialValues>(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof CourseFormInitialValues>(
    key: K,
    value: CourseFormInitialValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim(),
      instructor_id: values.instructor_id,
      price: Number(values.price),
      capacity: Number(values.capacity),
      level: values.level,
      start_date: values.start_date,
      end_date: values.end_date ? values.end_date : null,
      start_time: values.start_time,
      location: values.location.trim(),
      cover_image: values.cover_image.trim()
        ? values.cover_image.trim()
        : null,
      is_published: values.is_published,
    }

    try {
      const url =
        mode === "create"
          ? "/api/admin/courses"
          : `/api/admin/courses/${courseId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo guardar el curso")
        return
      }

      router.push("/admin/courses")
      router.refresh()
    } catch {
      setError("Error de red al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/courses"
            className="text-sm font-semibold text-[#C9A84C] hover:text-white"
          >
            ← Cursos
          </Link>
          <h1 className="text-lg font-semibold">
            {mode === "create" ? "Nuevo curso" : "Editar curso"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Título
            </label>
            <input
              type="text"
              required
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Descripción
            </label>
            <textarea
              required
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Instructor
              </label>
              <select
                required
                value={values.instructor_id}
                onChange={(e) => update("instructor_id", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              >
                <option value="">Selecciona…</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Nivel
              </label>
              <select
                value={values.level}
                onChange={(e) =>
                  update("level", e.target.value as CourseLevel)
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Precio (MXN)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={values.price}
                onChange={(e) => update("price", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Cupo
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={values.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Hora de inicio
              </label>
              <input
                type="time"
                required
                value={values.start_time}
                onChange={(e) => update("start_time", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Fecha de inicio
              </label>
              <input
                type="date"
                required
                value={values.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Fecha de fin (opcional)
              </label>
              <input
                type="date"
                value={values.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Ubicación
            </label>
            <input
              type="text"
              required
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Estudio, dirección o ciudad"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Imagen de portada (URL)
            </label>
            <input
              type="url"
              value={values.cover_image}
              onChange={(e) => update("cover_image", e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              className="h-4 w-4"
            />
            Publicar ahora (visible al público)
          </label>

          {error && (
            <p
              className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/courses"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Guardando…"
                : mode === "create"
                  ? "Crear curso"
                  : "Guardar cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
