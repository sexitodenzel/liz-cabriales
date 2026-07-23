"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { compressImage } from "@/lib/image-compress"

type ProductOption = {
  id: string
  name: string
  slug: string
  images: string[] | null
}

type Props = {
  isLoggedIn: boolean
}

export default function NailArtSubmitForm({ isLoggedIn }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [coverPath, setCoverPath] = useState("")
  const [coverPreview, setCoverPreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [publishedLive, setPublishedLive] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [results, setResults] = useState<ProductOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<ProductOption[]>([])

  // Abrir modal si se llega con #subir (mega menú / drawer).
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash === "#subir") setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || !isLoggedIn || searchQ.trim().length < 2) {
      setResults([])
      return
    }
    const t = window.setTimeout(() => {
      setSearching(true)
      void fetch(`/api/nail-art/products?q=${encodeURIComponent(searchQ.trim())}`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json: { data?: ProductOption[] }) => {
          setResults(Array.isArray(json.data) ? json.data : [])
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 280)
    return () => window.clearTimeout(t)
  }, [searchQ, isLoggedIn, open])

  function openModal() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/nail-art#subir")}`)
      return
    }
    setError(null)
    setSuccess(false)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setResults([])
    setSearchQ("")
  }

  async function handleFile(file: File | null) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append("file", compressed)
      const res = await fetch("/api/nail-art/upload", { method: "POST", body: fd })
      const body = await res.json()
      if (!res.ok || body.error) {
        setError(body.error?.message ?? "No se pudo subir la imagen")
        return
      }
      setCoverPath(body.data.path as string)
      setCoverPreview((body.data.previewUrl as string) || "")
    } catch {
      setError("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  function addProduct(p: ProductOption) {
    setSelected((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
    setSearchQ("")
    setResults([])
  }

  function removeProduct(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent("/nail-art#subir")}`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/nail-art/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          cover_image: coverPath,
          product_ids: selected.map((p) => p.id),
        }),
      })
      const body = await res.json()
      if (!res.ok || body.error) {
        setError(body.error?.message ?? "No se pudo enviar")
        return
      }
      const live = Boolean(body.data?.published)
      setPublishedLive(live)
      setSuccess(true)
      setDescription("")
      setCoverPath("")
      setCoverPreview("")
      setSelected([])
      if (live) router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        id="subir"
        type="button"
        onClick={openModal}
        className="inline-flex h-9 scroll-mt-28 items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
      >
        Subir inspiración
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-stretch justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nail-art-submit-title"
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative z-10 flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[min(90dvh,640px)] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
              <h2
                id="nail-art-submit-title"
                className="font-[family-name:var(--font-playfair),serif] text-[18px] font-medium text-[#111] sm:text-[20px]"
              >
                Subir inspiración
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#111]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
                <p className="font-[family-name:var(--font-playfair),serif] text-[22px] font-medium text-[#111]">
                  {publishedLive ? "¡Publicado!" : "¡Gracias!"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-[14px] text-neutral-600">
                  {publishedLive
                    ? "Ya aparece en Nail Art con el sello Elaborado por Nosotros."
                    : "Tu inspiración quedó en revisión. Cuando un administrador la apruebe, aparecerá en la galería."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false)
                    setPublishedLive(false)
                  }}
                  className="mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a6d26]"
                >
                  Subir otra
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3 sm:gap-4 sm:px-5 sm:py-5">
                  <p className="shrink-0 text-[12px] leading-snug text-neutral-500 sm:text-[13px]">
                    Indica al menos un producto. Se publica tras aprobación.
                  </p>

                  {/* Móvil: foto + descripción en una fila compacta */}
                  <div className="grid shrink-0 grid-cols-[88px_1fr] items-start gap-3 sm:grid-cols-[140px_1fr] sm:gap-5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-[11px] leading-tight text-neutral-500 transition-colors hover:border-[#c6a75e] sm:h-auto sm:w-full sm:aspect-[3/4] sm:text-[12px]"
                    >
                      {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreview}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : uploading ? (
                        "…"
                      ) : (
                        <span className="px-1 text-center">Elegir foto</span>
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
                    />

                    <label className="block min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 sm:text-[11px]">
                        Descripción
                      </span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        required
                        className="mt-1 h-[88px] w-full resize-none rounded-xl border border-neutral-200 bg-ivory px-2.5 py-2 text-[13px] outline-none focus:border-[#c6a75e] sm:mt-1.5 sm:h-auto sm:min-h-[120px] sm:px-3 sm:py-2.5 sm:text-[14px]"
                        placeholder="Cuéntanos sobre tu diseño…"
                      />
                    </label>
                  </div>

                  <div className="flex shrink-0 flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 sm:text-[11px]">
                      Productos usados (mín. 1)
                    </span>
                    <input
                      type="search"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Buscar en la tienda…"
                      autoComplete="off"
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-ivory px-3 py-2 text-[13px] outline-none focus:border-[#c6a75e] sm:mt-1.5 sm:py-2.5 sm:text-[14px]"
                    />
                    {searching && (
                      <p className="mt-1.5 text-[11px] text-neutral-400">Buscando…</p>
                    )}
                    {!searching && searchQ.trim().length >= 2 && results.length === 0 && (
                      <p className="mt-1.5 text-[11px] text-neutral-400">
                        Sin resultados para “{searchQ.trim()}”
                      </p>
                    )}
                    {results.length > 0 && (
                      <ul className="mt-2 max-h-[40dvh] overflow-y-auto rounded-xl border border-neutral-200 bg-white sm:max-h-36">
                        {results.map((p) => (
                          <li key={p.id} className="border-b border-neutral-100 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => addProduct(p)}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] active:bg-neutral-100 hover:bg-neutral-50"
                            >
                              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                                {p.images?.[0] ? (
                                  <Image
                                    src={p.images[0]}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="36px"
                                  />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {selected.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {selected.map((p) => (
                          <li
                            key={p.id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-ivory py-0.5 pl-2.5 pr-1.5 text-[11px] sm:text-[12px]"
                          >
                            <span className="truncate">{p.name}</span>
                            <button
                              type="button"
                              onClick={() => removeProduct(p.id)}
                              className="shrink-0 rounded-full px-1 text-neutral-400 hover:text-[#111]"
                              aria-label={`Quitar ${p.name}`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {error && (
                    <p className="shrink-0 text-[12px] text-red-600 sm:text-[13px]">{error}</p>
                  )}
                </div>

                <div className="shrink-0 border-t border-neutral-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
                  <button
                    type="submit"
                    disabled={submitting || uploading || !coverPath || selected.length < 1}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-neutral-900 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40 sm:h-10 sm:w-fit"
                  >
                    {submitting ? "Enviando…" : "Enviar a revisión"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
