"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import ImageUploader from "@/app/admin/components/ImageUploader"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import DatePicker from "@/components/shared/DatePicker"
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
  short_description: string
  description: string
  instructor_id: string
  price: string
  capacity: string
  level: CourseLevel
  start_date: string
  end_date: string
  start_time: string
  location: string
  diploma_included: boolean
  highlights: string[]
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

const MAX_HIGHLIGHTS = 6

// Ejemplos de un clic para los chips/distintivos del curso.
const HIGHLIGHT_PRESETS = [
  "Kit de materiales",
  "Coffee break",
  "Cupo limitado",
  "Certificado avalado",
  "Práctica en modelo real",
  "Material descargable",
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
  const [chipDraft, setChipDraft] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  function addChip(raw: string) {
    const chip = raw.trim().slice(0, 40)
    if (!chip) return
    setValues((prev) => {
      if (
        prev.highlights.length >= MAX_HIGHLIGHTS ||
        prev.highlights.some((h) => h.toLowerCase() === chip.toLowerCase())
      ) {
        return prev
      }
      return { ...prev, highlights: [...prev.highlights, chip] }
    })
    setChipDraft("")
  }

  function removeChip(chip: string) {
    setValues((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h !== chip),
    }))
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
      short_description: values.short_description.trim() || null,
      description: values.description.trim(),
      instructor_id: values.instructor_id,
      price: Number(values.price),
      capacity: Number(values.capacity),
      level: values.level,
      start_date: values.start_date,
      end_date: values.end_date ? values.end_date : null,
      start_time: values.start_time,
      location: values.location.trim(),
      diploma_included: values.diploma_included,
      highlights: values.highlights,
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
                is_cover: item.is_cover,
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
            <label className={labelCls}>Descripción breve (opcional)</label>
            <textarea
              rows={2}
              maxLength={300}
              value={values.short_description}
              onChange={(e) => update("short_description", e.target.value)}
              placeholder="Gancho corto que acompaña al flyer (1–2 líneas)."
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-[#9a9a9a]">
              Es lo que sale en el banner y en la tarjeta del listado. Si la
              dejas vacía, se usa el inicio de la descripción larga.{" "}
              {values.short_description.length}/300
            </p>
          </div>

          <div>
            <label className={labelCls}>Descripción larga</label>
            <textarea
              required
              rows={9}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={`Eleva el nivel de tus servicios con técnicas de vanguardia.

## ¿Qué vas a aprender?
- Técnica de Dry Pedicura con alineación avanzada
- Creación paso a paso de prótesis ungueales

## ¿Qué incluye tu inscripción?
- Reconocimiento
- Coffee Break durante la capacitación`}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-[#9a9a9a]">
              Se muestra con formato bonito en la página del curso. Usa{" "}
              <code className="rounded bg-[#f0f0f0] px-1">## Título</code> para
              secciones, <code className="rounded bg-[#f0f0f0] px-1">- </code>{" "}
              al inicio de un renglón para viñetas y{" "}
              <code className="rounded bg-[#f0f0f0] px-1">**texto**</code> para
              negritas.
            </p>
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
              <DatePicker
                value={values.start_date}
                onChange={(next) => update("start_date", next)}
                className="mt-1"
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de fin (opcional)</label>
              <DatePicker
                value={values.end_date}
                onChange={(next) => update("end_date", next)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ubicación</label>
            <textarea
              required
              rows={2}
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Estudio, dirección o ciudad"
              className={inputCls}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#9a9a9a]">Rápido:</span>
              {["Tampico, Tamaulipas", "Ubicación privada"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => update("location", preset)}
                  className="rounded-full border border-[#ececec] bg-white px-2.5 py-1 text-[11px] text-[#3a3a3a] transition-colors hover:border-[#c9a84c] hover:text-[#a8893a]"
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-[#9a9a9a]">
              Se muestra tal cual en la página del curso. Puedes escribir varias
              líneas (ciudad, referencia, etc.).
            </p>
          </div>

          {/* ── Distintivos / chips del curso ─────────────────────────── */}
          <section className="rounded-xl border border-[#ececec] bg-[#fafafa] p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-[#1a1a1a]">
                Distintivos del curso
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#6b6b6b]">
                Son los pequeños chips dorados que aparecen debajo de la
                descripción. El nivel del curso siempre se muestra
                automáticamente.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-[#3a3a3a]">
              <input
                type="checkbox"
                checked={values.diploma_included}
                onChange={(e) => update("diploma_included", e.target.checked)}
                className={`${checkboxCls} mt-0.5`}
              />
              <span>
                <span className="block font-medium text-[#1a1a1a]">
                  Mostrar chip “Diploma incluido”
                </span>
                <span className="block text-xs leading-relaxed text-[#6b6b6b]">
                  Actívalo solo si este curso entrega diploma o constancia.
                </span>
              </span>
            </label>

            <div className="mt-4 border-t border-[#ececec] pt-4">
              <label className={labelCls}>Chips adicionales (opcional)</label>

              {values.highlights.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {values.highlights.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e8dcb0] bg-[#f5efdc] py-[5px] pl-3 pr-2 text-[12px] font-medium text-[#a8893a]"
                    >
                      {chip}
                      <button
                        type="button"
                        onClick={() => removeChip(chip)}
                        aria-label={`Quitar ${chip}`}
                        className="grid h-4 w-4 place-items-center rounded-full text-[#a8893a]/70 transition-colors hover:bg-[#a8893a] hover:text-white"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {values.highlights.length < MAX_HIGHLIGHTS && (
                <>
                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      maxLength={40}
                      value={chipDraft}
                      onChange={(e) => setChipDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addChip(chipDraft)
                        }
                      }}
                      placeholder="Ej. Kit de materiales"
                      className={`${inputCls} mt-0`}
                    />
                    <button
                      type="button"
                      onClick={() => addChip(chipDraft)}
                      disabled={!chipDraft.trim()}
                      className="shrink-0 rounded-lg border border-[#c9a84c] bg-white px-4 text-sm font-semibold text-[#a8893a] transition-colors hover:bg-[#c9a84c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#9a9a9a]">Ejemplos:</span>
                    {HIGHLIGHT_PRESETS.filter(
                      (p) =>
                        !values.highlights.some(
                          (h) => h.toLowerCase() === p.toLowerCase()
                        )
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addChip(preset)}
                        className="rounded-full border border-dashed border-[#d8c68a] bg-white px-2.5 py-1 text-[11px] text-[#a8893a] transition-colors hover:border-[#c9a84c] hover:bg-[#f5efdc]"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-2 text-[11px] text-[#9a9a9a]">
                {values.highlights.length}/{MAX_HIGHLIGHTS} chips · máx. 40
                caracteres cada uno.
              </p>
            </div>
          </section>

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
                {localImages.map((img, i) => (
                  <div
                    key={img.tempId}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                      img.isCover
                        ? "border-[#c9a84c]"
                        : "border-[#ececec] hover:border-[#c9a84c]/40"
                    }`}
                  >
                    {/* Miniatura completa (object-contain): muestra el flyer sin
                        recortar. Al clicar abre el lightbox en grande. */}
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      aria-label="Ampliar imagen"
                      className="block w-full cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="aspect-[4/3] w-full bg-neutral-100 object-contain"
                      />
                    </button>

                    {img.isCover && (
                      <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-[#c9a84c] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        Portada
                      </span>
                    )}

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-colors group-hover:bg-black/40">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => setCover(img.tempId)}
                          className="pointer-events-auto hidden rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#1a1a1a] transition-all hover:bg-[#c9a84c] hover:text-white group-hover:block"
                        >
                          Portada
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.tempId)}
                        className="pointer-events-auto hidden rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-red-600 transition-all hover:bg-red-600 hover:text-white group-hover:block"
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

            {lightboxIndex !== null && localImages.length > 0 && (
              <ImageLightbox
                images={localImages.map((img) => img.url)}
                startIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
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
