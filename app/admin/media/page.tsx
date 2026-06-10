"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Breadcrumb from "@/components/shared/Breadcrumb"

type LandingSlot = {
  key: string
  url: string
  label: string
  section: string
  updated_at: string
}

const SECTION_META: Record<string, { title: string; description: string }> = {
  hero: {
    title: "Hero Slider",
    description: "Banners principales del carrusel de inicio. Formato recomendado: 1400×700 px.",
  },
  brand: {
    title: "Quiénes somos",
    description: "Foto lateral de la sección de presentación. Formato recomendado: 500×750 px.",
  },
  pillar_dist: {
    title: "Tres pilares — Distribuidora",
    description: "Tríptico de imágenes del pilar Distribuidora. Formato recomendado: 400×600 px.",
  },
  pillar_acad: {
    title: "Tres pilares — Academia",
    description: "Tríptico de imágenes del pilar Academia. Formato recomendado: 400×600 px.",
  },
  pillar_serv: {
    title: "Tres pilares — Servicios",
    description: "Tríptico de imágenes del pilar Servicios. Formato recomendado: 400×600 px.",
  },
}

const SECTION_ORDER = ["hero", "brand", "pillar_dist", "pillar_acad", "pillar_serv"]

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
  onUpdate: (key: string, url: string) => void
}

function SlotCard({ slot, onUpdate }: SlotCardProps) {
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(slot.url)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setError(null)
    setUploading(true)
    setSaved(false)

    try {
      const supabase = createClient()
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase()
      const path = `landing/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("images").getPublicUrl(path)
      if (!data?.publicUrl) throw new Error("No se pudo obtener la URL pública.")

      const res = await fetch("/api/admin/landing-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slot.key, url: data.publicUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? "Error al guardar.")
      }

      setCurrentUrl(data.publicUrl)
      onUpdate(slot.key, data.publicUrl)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.")
    } finally {
      setUploading(false)
    }
  }

  const hasImage = Boolean(currentUrl)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-lg bg-neutral-100"
        style={{ aspectRatio: slot.section === "hero" ? "16/9" : "2/3" }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={slot.label}
            className="absolute inset-0 h-full w-full object-cover"
          />
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

      {/* Label + action */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-neutral-700">{slot.label}</span>

        {saved && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckIcon />
            Guardado
          </span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}

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

  function handleUpdate(key: string, url: string) {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, url } : s))
    )
  }

  const bySection = SECTION_ORDER.reduce<Record<string, LandingSlot[]>>((acc, sec) => {
    acc[sec] = slots.filter((s) => s.section === sec)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
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
              Sube banners, fotos y GIFs para cada sección de la página principal. Los cambios se reflejan en menos de 1 minuto.
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
