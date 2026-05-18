"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import ImageUploader from "@/app/admin/components/ImageUploader"
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
  allow_online_registration: boolean
  show_price_public: boolean
  show_capacity_public: boolean
  public_registered_count: string
  public_capacity: string
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
      allow_online_registration: values.allow_online_registration,
      show_price_public: values.show_price_public,
      show_capacity_public: values.show_capacity_public,
      public_registered_count: values.public_registered_count
        ? Number(values.public_registered_count)
        : null,
      public_capacity: values.public_capacity
        ? Number(values.public_capacity)
        : null,
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

  const inputCls = "mt-1 w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#c9a84c] transition-colors"
  const labelCls = "block text-xs font-medium uppercase tracking-wider text-[#6b6b6b]"
  const checkboxCls = "h-4 w-4 rounded border-[#d8d8d8]"

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="border-b border-[#ececec] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/courses"
            className="text-sm font-semibold text-[#c9a84c] hover:text-[#a8893a]"
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
          className="space-y-5 rounded-xl border border-[#ececec] bg-white p-6"
        >
          <div>
            <label className={labelCls}>Título</label>
            <input
              type="text"
              required
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              required
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Instructor</label>
              <select
                required
                value={values.instructor_id}
                onChange={(e) => update("instructor_id", e.target.value)}
                className={inputCls}
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
              <label className={labelCls}>Nivel</label>
              <select
                value={values.level}
                onChange={(e) =>
                  update("level", e.target.value as CourseLevel)
                }
                className={inputCls}
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
              <label className={labelCls}>Precio (MXN)</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={values.price}
                onChange={(e) => update("price", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Cupo</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={values.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Hora de inicio</label>
              <input
                type="time"
                required
                value={values.start_time}
                onChange={(e) => update("start_time", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fecha de inicio</label>
              <input
                type="date"
                required
                value={values.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de fin (opcional)</label>
              <input
                type="date"
                value={values.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ubicación</label>
            <input
              type="text"
              required
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Estudio, dirección o ciudad"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Imagen de portada</label>
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <ImageUploader
                  folder="courses"
                  buttonLabel={
                    values.cover_image ? "Reemplazar imagen" : "Subir imagen"
                  }
                  onUpload={(url) => update("cover_image", url)}
                  onError={(msg) => setError(msg)}
                />
                {values.cover_image && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={values.cover_image}
                      alt="Vista previa de portada"
                      className="h-16 w-24 rounded-lg border border-[#ececec] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => update("cover_image", "")}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={values.cover_image}
                onChange={(e) => update("cover_image", e.target.value)}
                placeholder="O pega una URL: https://..."
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-[#3a3a3a]">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              className={checkboxCls}
            />
            Publicar ahora (visible al público)
          </label>

          <section className="rounded-xl border border-[#ececec] bg-[#fafafa] p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-[#1a1a1a]">
                Opciones en el sitio público
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#6b6b6b]">
                Controla si el curso se compra en línea o se atiende por
                WhatsApp, y qué información de disponibilidad se muestra.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm text-[#3a3a3a]">
                <input
                  type="checkbox"
                  checked={values.allow_online_registration}
                  onChange={(e) =>
                    update("allow_online_registration", e.target.checked)
                  }
                  className={`${checkboxCls} mt-0.5`}
                />
                <span>
                  <span className="block font-medium text-[#1a1a1a]">
                    Permitir inscripción y pago en línea
                  </span>
                  <span className="block text-xs leading-relaxed text-[#6b6b6b]">
                    Si está apagado, el botón público mandará a WhatsApp.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-[#3a3a3a]">
                <input
                  type="checkbox"
                  checked={values.show_price_public}
                  onChange={(e) =>
                    update("show_price_public", e.target.checked)
                  }
                  className={`${checkboxCls} mt-0.5`}
                />
                <span>
                  <span className="block font-medium text-[#1a1a1a]">
                    Mostrar precio al público
                  </span>
                  <span className="block text-xs leading-relaxed text-[#6b6b6b]">
                    El precio interno sigue guardado aunque no se muestre.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-[#3a3a3a]">
                <input
                  type="checkbox"
                  checked={values.show_capacity_public}
                  onChange={(e) =>
                    update("show_capacity_public", e.target.checked)
                  }
                  className={`${checkboxCls} mt-0.5`}
                />
                <span>
                  <span className="block font-medium text-[#1a1a1a]">
                    Mostrar disponibilidad pública
                  </span>
                  <span className="block text-xs leading-relaxed text-[#6b6b6b]">
                    Controla el texto de lugares y la barra de disponibilidad.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 grid gap-4 border-t border-[#ececec] pt-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Inscritos públicos (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={values.public_registered_count}
                  onChange={(e) =>
                    update("public_registered_count", e.target.value)
                  }
                  placeholder="Usar inscritos reales"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[#6b6b6b]">
                  Si lo dejas vacío, se usa el conteo real de pagos confirmados.
                </p>
              </div>
              <div>
                <label className={labelCls}>Cupo público (opcional)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={values.public_capacity}
                  onChange={(e) => update("public_capacity", e.target.value)}
                  placeholder="Usar cupo real"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[#6b6b6b]">
                  Si lo dejas vacío, se muestra el cupo operativo del curso.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/courses"
              className="rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
