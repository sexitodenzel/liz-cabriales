"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { compressImage } from "@/lib/image-compress"
import Breadcrumb from "@/components/shared/Breadcrumb"
import type { LinkType, TextPosition } from "@/lib/supabase/landing-slots"
import { toast } from "@/app/components/ui/motion/toast-provider"
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"
import ImageLightbox from "@/app/components/shared/ImageLightbox"

type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  link_type: LinkType
  link_value: string
  cta_label: string
  cta_subtext: string
  subtitle: string
  text_position: TextPosition
  show_title: boolean
  show_subtitle: boolean
  updated_at: string
}

type ProductOption = { name: string; slug: string }
type CourseOption = { id: string; title: string }

const SECTION_META: Record<string, { title: string; description: string }> = {
  hero: {
    title: "Imágenes para el módulo de inicio (Hero Slider)",
    description:
      "Banners del carrusel clásico de inicio. Formato recomendado: 1920×600 px.",
  },
  brand: {
    title: "Imágenes para Quiénes somos / Sobre Liz",
    description:
      "Foto lateral de la sección de presentación. Formato recomendado: 500×750 px.",
  },
  home: {
    title: "Imágenes para el módulo de inicio (tri-cards)",
    description:
      "Las tres tarjetas del hero actual: Tienda, Academia y Cabina/Citas.",
  },
  servicios: {
    title: "Imágenes para el módulo de servicios",
    description:
      "Galería del estudio en /servicios (collage y lightbox). Formato recomendado: 1200×900 px.",
  },
  academia: {
    title: "Imágenes para el módulo de academia",
    description:
      "Collage superior de la página /academia. Formato recomendado: 1200×900 px.",
  },
  blog: {
    title: "Imágenes para el módulo de blog",
    description:
      "Collage superior de la página /blog. Formato recomendado: 700×900 px.",
  },
}

const SECTION_ORDER = ["home", "servicios", "academia", "blog", "hero", "brand"]

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
      <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

type SlotCardProps = {
  slot: LandingSlot
  onUpdate: (key: string, patch: Partial<LandingSlot>) => void
}

function SlotCard({ slot, onUpdate }: SlotCardProps) {
  const [uploading, setUploading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(slot.url)
  const [label, setLabel] = useState(slot.label ?? "")
  const [savingLabel, setSavingLabel] = useState(false)
  const [labelSaved, setLabelSaved] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [linkType, setLinkType] = useState<LinkType>(slot.link_type ?? "none")
  const [linkValue, setLinkValue] = useState(slot.link_value ?? "")
  const [ctaLabel, setCtaLabel] = useState(slot.cta_label ?? "")
  const [ctaSubtext, setCtaSubtext] = useState(slot.cta_subtext ?? "")
  const [subtitle, setSubtitle] = useState(slot.subtitle ?? "")
  const [textPosition, setTextPosition] = useState<TextPosition>(slot.text_position ?? "right")
  const [showTitle, setShowTitle] = useState(slot.show_title ?? true)
  const [showSubtitle, setShowSubtitle] = useState(slot.show_subtitle ?? true)
  const [savingLink, setSavingLink] = useState(false)
  const [linkSaved, setLinkSaved] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)

  const [products, setProducts] = useState<ProductOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const isHero = slot.section === "hero"

  useEffect(() => {
    if (!isHero) return
    if (linkType === "product") loadProducts()
    if (linkType === "course") loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCurrentUrl(slot.url)
    setLabel(slot.label ?? "")
    setLinkType(slot.link_type ?? "none")
    setLinkValue(slot.link_value ?? "")
    setCtaLabel(slot.cta_label ?? "")
    setCtaSubtext(slot.cta_subtext ?? "")
    setSubtitle(slot.subtitle ?? "")
    setTextPosition(slot.text_position ?? "right")
    setShowTitle(slot.show_title ?? true)
    setShowSubtitle(slot.show_subtitle ?? true)
  }, [slot])

  useEffect(() => {
    if (!isHero || !linkPanelOpen) return
    if (linkType === "product") loadProducts()
    if (linkType === "course") loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHero, linkPanelOpen, linkType])

  async function loadProducts() {
    if (products.length > 0) return
    setLoadingOptions(true)
    try {
      const res = await fetch("/api/admin/products")
      const body = await res.json()
      const list: ProductOption[] = (body?.data?.products ?? [])
        .filter((p: { is_active: boolean }) => p.is_active)
        .map((p: { name: string; slug: string }) => ({ name: p.name, slug: p.slug }))
      setProducts(list)
    } finally {
      setLoadingOptions(false)
    }
  }

  async function loadCourses() {
    if (courses.length > 0) return
    setLoadingOptions(true)
    try {
      const res = await fetch("/api/admin/courses")
      const body = await res.json()
      const list: CourseOption[] = (body?.data?.courses ?? [])
        .filter((c: { is_published: boolean }) => c.is_published)
        .map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
      setCourses(list)
    } finally {
      setLoadingOptions(false)
    }
  }

  function handleLinkTypeChange(val: LinkType) {
    setLinkType(val)
    setLinkValue("")
    if (val === "product") loadProducts()
    if (val === "course") loadCourses()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setError(null)
    setUploading(true)
    setSaved(false)

    try {
      const compressed = await compressImage(file, { maxWidthOrHeight: 2400 })

      const uploadBody = new FormData()
      uploadBody.append("file", compressed)
      uploadBody.append("folder", "landing")
      const uploadRes = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: uploadBody,
      })
      const uploadJson = (await uploadRes.json()) as {
        data: { url: string } | null
        error: { message: string } | null
      }
      if (!uploadRes.ok || !uploadJson.data?.url) {
        throw new Error(uploadJson.error?.message ?? "Error al subir la imagen.")
      }
      const publicUrl = uploadJson.data.url

      const res = await fetch("/api/admin/landing-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slot.key, url: publicUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? "Error al guardar.")
      }

      setCurrentUrl(publicUrl)
      onUpdate(slot.key, { url: publicUrl })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toast.success("Imagen actualizada")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al subir la imagen."
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  async function saveLinkConfig() {
    setLinkError(null)
    setSavingLink(true)
    setLinkSaved(false)

    try {
      const res = await fetch("/api/admin/landing-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: slot.key,
          link_type: linkType,
          link_value: linkValue,
          cta_label: ctaLabel,
          cta_subtext: ctaSubtext,
          subtitle,
          text_position: textPosition,
          show_title: showTitle,
          show_subtitle: showSubtitle,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? "Error al guardar.")
      }

      onUpdate(slot.key, { link_type: linkType, link_value: linkValue, cta_label: ctaLabel, cta_subtext: ctaSubtext, subtitle, text_position: textPosition, show_title: showTitle, show_subtitle: showSubtitle })
      setLinkSaved(true)
      setTimeout(() => {
        setLinkSaved(false)
        setLinkPanelOpen(false)
      }, 1200)
      toast.success("Enlace guardado")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar el enlace."
      setLinkError(message)
      toast.error(message)
    } finally {
      setSavingLink(false)
    }
  }

  async function saveLabel() {
    setLabelError(null)
    setSavingLabel(true)
    setLabelSaved(false)
    try {
      const nextLabel = label.trim() || slot.label || slot.key
      const res = await fetch("/api/admin/landing-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: slot.key,
          label: nextLabel,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? "Error al guardar nombre.")
      }

      onUpdate(slot.key, { label: nextLabel })
      setLabel(nextLabel)
      setLabelSaved(true)
      setTimeout(() => setLabelSaved(false), 2500)
      toast.success("Nombre guardado")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar nombre."
      setLabelError(message)
      toast.error(message)
    } finally {
      setSavingLabel(false)
    }
  }

  const hasImage = Boolean(currentUrl)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-lg bg-neutral-100"
        style={{ aspectRatio: slot.section === "hero" ? "16/9" : "2/3" }}
      >
        {hasImage ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ampliar imagen"
            className="absolute inset-0 cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt={slot.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </button>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-neutral-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[11px] font-medium">Sin imagen</span>
          </div>
        )}
      </div>

      {lightboxOpen && hasImage && (
        <ImageLightbox images={[currentUrl]} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Label + saved indicator */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-neutral-700">{slot.label}</span>
        {saved && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckIcon />
            Guardado
          </span>
        )}
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[11px] font-medium text-neutral-600">Nombre del slide</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Hero 1"
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
          />
          {labelError && <p className="mt-1 text-[11px] text-red-500">{labelError}</p>}
        </div>
        <button
          type="button"
          disabled={savingLabel}
          onClick={saveLabel}
          className="mt-[22px] inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar nombre
        </button>
        {(savingLabel || labelSaved) && (
          <span className="mt-[22px]">
            <AnimatedBadge status={savingLabel ? "loading" : "success"} size="sm">
              {savingLabel ? "Guardando" : "Guardado"}
            </AnimatedBadge>
          </span>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Subiendo…
          </>
        ) : (
          <>
            <UploadIcon />
            {hasImage ? "Cambiar imagen" : "Subir imagen"}
          </>
        )}
      </button>

      {/* Link config — solo visible en slides del hero */}
      {isHero && (
        <div className="mt-1 rounded-lg border border-neutral-100 bg-neutral-50">
          {/* Header con resumen + toggle */}
          <button
            type="button"
            onClick={() => setLinkPanelOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Enlace del slide
              </span>
              <span className="text-[11px] text-neutral-400">
                {linkType === "none" && "Sin enlace"}
                {linkType === "product" && (linkValue ? `Producto: ${linkValue}` : "Producto (sin elegir)")}
                {linkType === "course" && (linkValue ? "Curso seleccionado" : "Curso (sin elegir)")}
                {linkType === "services" && "→ /servicios"}
                {linkType === "custom" && (linkValue || "URL personalizada (vacía)")}
              </span>
            </div>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${linkPanelOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {linkPanelOpen && (
          <div className="flex flex-col gap-3 border-t border-neutral-100 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Configurar enlace
          </p>

          {/* Tipo de destino */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-600">Destino del slide</label>
            <select
              value={linkType}
              onChange={(e) => handleLinkTypeChange(e.target.value as LinkType)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
            >
              <option value="none">Sin enlace</option>
              <option value="product">Producto</option>
              <option value="course">Curso</option>
              <option value="services">Página de servicios</option>
              <option value="custom">URL personalizada</option>
            </select>
          </div>

          {/* Selector condicional */}
          {linkType === "product" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-neutral-600">Producto</label>
              {loadingOptions ? (
                <p className="text-[11px] text-neutral-400">Cargando productos…</p>
              ) : (
                <select
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
                >
                  <option value="">— Elige un producto —</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {linkType === "course" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-neutral-600">Curso</label>
              {loadingOptions ? (
                <p className="text-[11px] text-neutral-400">Cargando cursos…</p>
              ) : (
                <select
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
                >
                  <option value="">— Elige un curso —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-neutral-500">
                En desktop el bloque va a la derecha de la imagen; en móvil va debajo.
                Puedes usar título/subtítulo/botón en cualquier destino (producto, curso o URL).
              </p>
            </div>
          )}

          {linkType === "services" && (
            <p className="text-[11px] text-neutral-500">
              Redirige a <span className="font-mono font-medium">/servicios</span>
            </p>
          )}

          {linkType === "custom" && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-neutral-600">URL</label>
              <input
                type="text"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="/tienda?promo=verano"
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
              />
            </div>
          )}

          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-600">
              Título <span className="font-normal text-neutral-400">(texto grande principal)</span>
            </label>
            <input
              type="text"
              value={ctaSubtext}
              onChange={(e) => setCtaSubtext(e.target.value)}
              placeholder="Nueva colección de verano"
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
            />
          </div>

          {/* Subtítulo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-600">
              Subtítulo <span className="font-normal text-neutral-400">(aparece debajo del título)</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Descubre los colores de la temporada"
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
            />
          </div>

          {/* CTA label */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-neutral-600">
              Texto del botón <span className="font-normal text-neutral-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Inscríbete ahora"
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[12px] text-neutral-700 focus:border-[#c9a84c] focus:outline-none"
            />
            <p className="text-[11px] text-neutral-500">
              Si el destino es producto/curso/custom y defines este texto, se muestra el botón en el hero.
            </p>
          </div>

          {/* Posición del texto y botón */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-neutral-600">
              Alineación del texto y botón <span className="font-normal text-neutral-400">(móvil y desktop)</span>
            </label>
            <div className="flex gap-2">
              {([
                { value: "left", label: "Izquierda" },
                { value: "center", label: "Centro" },
                { value: "right", label: "Derecha" },
              ] as { value: TextPosition; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTextPosition(value)}
                  className={`flex-1 rounded-md border py-1.5 text-[11px] font-medium transition-colors ${
                    textPosition === value
                      ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mostrar/ocultar campos del bloque de texto */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-neutral-600">Visibilidad del bloque de texto</label>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
              <span className="text-[12px] text-neutral-700">Mostrar título</span>
              <div
                onClick={() => setShowTitle(v => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${showTitle ? "bg-[#c9a84c]" : "bg-neutral-300"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showTitle ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
              <span className="text-[12px] text-neutral-700">Mostrar subtítulo</span>
              <div
                onClick={() => setShowSubtitle(v => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${showSubtitle ? "bg-[#c9a84c]" : "bg-neutral-300"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showSubtitle ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>

          {linkError && <p className="text-[11px] text-red-500">{linkError}</p>}

          {(savingLink || linkSaved) && (
            <div className="flex justify-center">
              <AnimatedBadge status={savingLink ? "loading" : "success"} size="sm">
                {savingLink ? "Guardando enlace" : "Enlace guardado"}
              </AnimatedBadge>
            </div>
          )}
          <button
            type="button"
            disabled={savingLink}
            onClick={saveLinkConfig}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingLink ? (
              "Guardando…"
            ) : linkSaved ? (
              <>
                <CheckIcon />
                Enlace guardado
              </>
            ) : (
              "Guardar enlace"
            )}
          </button>
          </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminMediaPage() {
  const [slots, setSlots] = useState<LandingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [addingSlide, setAddingSlide] = useState(false)

  useEffect(() => {
    fetch("/api/admin/landing-slots")
      .then((r) => r.json())
      .then((body) => {
        if (body.error) {
          setFetchError(body.error.message ?? "Error al cargar.")
        } else {
          setSlots(body.data ?? [])
        }
      })
      .catch(() => setFetchError("No se pudo conectar con el servidor."))
      .finally(() => setLoading(false))
  }, [])

  function handleUpdate(key: string, patch: Partial<LandingSlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    )
  }

  async function handleAddSlide() {
    setAddingSlide(true)
    try {
      const res = await fetch("/api/admin/landing-slots", { method: "POST" })
      const body = await res.json()
      if (body.error) throw new Error(body.error.message)
      setSlots((prev) => [...prev, body.data])
      toast.success("Slide agregado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar slide")
    } finally {
      setAddingSlide(false)
    }
  }

  const bySection = SECTION_ORDER.reduce<Record<string, LandingSlot[]>>((acc, sec) => {
    acc[sec] = slots.filter((s) => s.section === sec)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-10">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Mi Perfil", href: "/perfil" },
            { label: "Panel de administrador", href: "/admin" },
            { label: "Media" },
          ]}
        />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-[#c9a84c]">
              PANEL ADMINISTRADOR
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1a1a1a]">Media</h1>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Imágenes organizadas por módulo. Cada sección indica dónde se ve
              en el sitio. Los cambios se reflejan en menos de 1 minuto.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin"
              className="text-sm font-medium text-[#6b6b6b] transition-colors hover:text-[#1a1a1a]"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-[#6b6b6b]">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Cargando…
          </div>
        )}

        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <strong>Error:</strong> {fetchError}
            <p className="mt-1 text-xs text-red-500">
              Asegúrate de haber ejecutado el SQL de <code>docs/delivery/sql-landing-slots.sql</code> en Supabase.
            </p>
          </div>
        )}

        {!loading && !fetchError && (
          <div className="flex flex-col gap-12">
            {SECTION_ORDER.map((sec) => {
              const sectionSlots = bySection[sec] ?? []
              if (sectionSlots.length === 0) return null
              const meta = SECTION_META[sec]

              return (
                <section key={sec}>
                  <div className="mb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-semibold text-[#1a1a1a]">{meta.title}</h2>
                        <p className="mt-0.5 text-xs text-[#6b6b6b]">{meta.description}</p>
                      </div>
                      {sec === "hero" && (
                        <button
                          type="button"
                          disabled={addingSlide}
                          onClick={handleAddSlide}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#c9a84c] disabled:opacity-50"
                        >
                          {addingSlide ? (
                            <>
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                              </svg>
                              Agregando…
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                              </svg>
                              Agregar slide
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 h-px bg-[#ececec]" aria-hidden />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sectionSlots.map((slot) => (
                      <SlotCard key={slot.key} slot={slot} onUpdate={handleUpdate} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
