"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import ImageUploader from "@/app/admin/components/ImageUploader"
import CourseGalleryEditor, {
  type LocalGalleryItem,
  toLocalGalleryItems,
} from "./CourseGalleryEditor"
import type { InstructorRow, CourseImage, CourseGalleryItem } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"
import { toast } from "@/app/components/ui/motion/toast-provider"
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"

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

type LocalImage = {
  tempId: string
  url: string
  isCover: boolean
}

type Props = {
  mode: "create" | "edit"
  courseId?: string
  instructors: InstructorRow[]
  initialValues: CourseFormInitialValues
  initialImages?: CourseImage[]
  initialGallery?: CourseGalleryItem[]
}

const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "open", label: "Abierto" },
]

let _uid = 0
function uid() {
  return `img-${++_uid}-${Math.random().toString(36).slice(2)}`
}

export default function CourseForm({
  mode,
  courseId,
  instructors,
  initialValues,
  initialImages,
  initialGallery,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<CourseFormInitialValues>(initialValues)
  const [submitting, setSubmitting] = useState(false)

  const [localGallery, setLocalGallery] = useState<LocalGalleryItem[]>(() =>
    initialGallery && initialGallery.length > 0
      ? toLocalGalleryItems(initialGallery)
      : []
  )

  const [localImages, setLocalImages] = useState<LocalImage[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return initialImages.map((img) => ({
        tempId: img.id,
        url: img.image_url,
        isCover: img.is_cover,
      }))
    }
    if (initialValues.cover_image) {
      return [{ tempId: "initial-cover", url: initialValues.cover_image, isCover: true }]
    }
    return []
  })

  const update = <K extends keyof CourseFormInitialValues>(
    key: K,
    value: CourseFormInitialValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function addImage(url: string) {
    setLocalImages((prev) => {
      const isFirst = prev.length === 0
      return [...prev, { tempId: uid(), url, isCover: isFirst }]
    })
  }

  function removeImage(tempId: string) {
    setLocalImages((prev) => {
      const remaining = prev.filter((img) => img.tempId !== tempId)
      const hasCover = remaining.some((img) => img.isCover)
      if (!hasCover && remaining.length > 0) {
        return remaining.map((img, i) => ({ ...img, isCover: i === 0 }))
      }
      return remaining
    })
  }

  function setCover(tempId: string) {
    setLocalImages((prev) =>
      prev.map((img) => ({ ...img, isCover: img.tempId === tempId }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const coverUrl =
      localImages.find((img) => img.isCover)?.url ??
      localImages[0]?.url ??
      null

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
      cover_image: coverUrl,
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
        toast.error(json?.error?.message ?? "No se pudo guardar el curso")
        return
      }

      const savedId =
        mode === "create" ? json?.data?.course?.id : courseId

      if (savedId) {
        await Promise.all([
          fetch(`/api/admin/courses/${savedId}/images`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: localImages.map((img, i) => ({
                image_url: img.url,
                is_cover: img.isCover,
                position: i,
              })),
            }),
          }),
          fetch(`/api/admin/courses/${savedId}/gallery`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: localGallery.map((item, i) => ({
                type: item.type,
                url: item.url,
                thumbnail_url: item.thumbnail_url,
                caption: item.caption || null,
                position: i,
              })),
            }),
          }),
        ])
      }

      toast.success(mode === "create" ? "Curso creado" : "Curso actualizado")
      router.push("/admin/courses")
      router.refresh()
    } catch {
      toast.error("Error de red al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#c9a84c] transition-colors"
  const labelCls =
    "block text-xs font-medium uppercase tracking-wider text-[#6b6b6b]"
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

          {/* ── Galería de imágenes ──────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelCls}>Galería de imágenes</label>
              <span className="text-[11px] text-[#9a9a9a]">
                {localImages.length} {localImages.length === 1 ? "imagen" : "imágenes"}
              </span>
            </div>

            {localImages.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {localImages.map((img) => (
                  <div
                    key={img.tempId}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                      img.isCover
                        ? "border-[#c9a84c]"
                        : "border-[#ececec] hover:border-[#c9a84c]/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />

                    {img.isCover && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-[#c9a84c] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        Portada
                      </span>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-colors group-hover:bg-black/40">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => setCover(img.tempId)}
                          className="hidden rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#1a1a1a] transition-all hover:bg-[#c9a84c] hover:text-white group-hover:block"
                        >
                          Portada
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.tempId)}
                        className="hidden rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-red-600 transition-all hover:bg-red-600 hover:text-white group-hover:block"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <ImageUploader
                folder="courses"
                buttonLabel="Agregar imagen"
                onUpload={addImage}
                onError={(msg) => toast.error(msg)}
              />
              {localImages.length === 0 && (
                <span className="text-xs text-[#9a9a9a]">
                  Sube varias imágenes del curso. La primera será la portada.
                </span>
              )}
            </div>
          </div>

          {/* ── Galería del curso ──────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <label className={labelCls}>Galería del curso</label>
                <p className="mt-0.5 text-[11px] text-[#9a9a9a]">
                  Imágenes y videos de lo aprendido. Se muestra en cursos pasados.
                </p>
              </div>
              <span className="text-[11px] text-[#9a9a9a]">
                {localGallery.length}{" "}
                {localGallery.length === 1 ? "elemento" : "elementos"}
              </span>
            </div>
            <CourseGalleryEditor
              items={localGallery}
              onChange={setLocalGallery}
              onError={(msg) => toast.error(msg)}
            />
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
                WhatsApp, si se muestra el precio y si se muestran inscritos
                y cupo en la página pública.
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
                    Mostrar inscritos y cupo al público
                  </span>
                  <span className="block text-xs leading-relaxed text-[#6b6b6b]">
                    Si está activo, en el sitio se ve cuántos lugares hay,
                    cuántos quedan y la barra de progreso. Si lo apagas, esa
                    información no aparece.
                  </span>
                </span>
              </label>
            </div>

            {values.show_capacity_public && (
              <div className="mt-4 space-y-3 border-t border-[#ececec] pt-4">
                <p className="text-xs leading-relaxed text-[#6b6b6b]">
                  Por defecto se usan los números reales del curso. Solo llena
                  los campos de abajo si quieres mostrar otros números (por
                  ejemplo, para dar sensación de urgencia o redondear el cupo).
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>
                      Inscritos a mostrar (opcional)
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
                      Vacío = conteo real de pagos confirmados.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Cupo a mostrar (opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={values.public_capacity}
                      onChange={(e) =>
                        update("public_capacity", e.target.value)
                      }
                      placeholder="Usar cupo del curso"
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      Vacío = cupo operativo del curso.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end gap-3">
            {submitting && (
              <AnimatedBadge status="loading" size="md">
                Guardando
              </AnimatedBadge>
            )}
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
              {mode === "create" ? "Crear curso" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
