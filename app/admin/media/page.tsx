"use client"

import { useEffect, useState, useRef } from "react"
import { compressImage } from "@/lib/image-compress"
import Breadcrumb from "@/components/shared/Breadcrumb"
import AdminPageHeader from "@/app/admin/components/AdminPageHeader"
import { toast } from "@/app/components/ui/motion/toast-provider"
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"
import ImageLightbox from "@/app/components/shared/ImageLightbox"

type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  updated_at: string
}

const SECTION_META: Record<string, { title: string; description: string }> = {
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

const SECTION_ORDER = ["home", "servicios", "academia", "blog", "brand"]

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

  useEffect(() => {
    setCurrentUrl(slot.url)
    setLabel(slot.label ?? "")
  }, [slot])

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
        style={{ aspectRatio: "2/3" }}
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
          <label className="mb-1 block text-[11px] font-medium text-neutral-600">Nombre de la imagen</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Tri-card Tienda"
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
    </div>
  )
}

export default function AdminMediaPage() {
  const [slots, setSlots] = useState<LandingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

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

        <AdminPageHeader
          eyebrow="Contenido"
          title="Media"
          description="Imágenes organizadas por módulo. Cada sección indica dónde se ve en el sitio. Los cambios se reflejan en menos de 1 minuto."
        />

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
              Asegúrate de haber ejecutado el SQL de <code>docs/delivery/sql/sql-landing-slots.sql</code> en Supabase.
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
                    <h2 className="text-base font-semibold text-[#1a1a1a]">{meta.title}</h2>
                    <p className="mt-0.5 text-xs text-[#6b6b6b]">{meta.description}</p>
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
