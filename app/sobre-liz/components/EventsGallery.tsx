"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

export type EventGalleryItem = {
  id: string
  url: string
  caption: string | null
  date?: string
  /** Si la foto pertenece a un curso, navega a su página en vez de abrir lightbox */
  href?: string
}

type Lightbox = { url: string; caption: string | null; idx: number } | null

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  )
}

function ChevLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function LightboxOverlay({
  lb,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  lb: NonNullable<Lightbox>
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
      >
        <CloseIcon />
      </button>

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Anterior"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        >
          <ChevLeft />
        </button>
      )}

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Siguiente"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        >
          <ChevRight />
        </button>
      )}

      <div className="relative mx-16 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lb.url}
          alt={lb.caption ?? ""}
          className="max-h-[82vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
        />
        {lb.caption && (
          <p className="mt-4 text-center text-[13px] leading-relaxed text-white/70">
            {lb.caption}
          </p>
        )}
      </div>
    </div>
  )
}

type Props = {
  items: EventGalleryItem[]
  eyebrow?: string
  title?: string
  description?: string
  showYearFilter?: boolean
}

const ALL_YEARS = "all"

function extractYear(date?: string): string | null {
  const match = date?.match(/\b(20\d{2})\b/)
  return match ? match[1] : null
}

export default function EventsGallery({
  items,
  eyebrow = "Galería",
  title = "Momentos de la academia",
  description = "Detrás de cámaras de nuestros talleres, masterclasses y eventos especiales.",
  showYearFilter = false,
}: Props) {
  const [lightbox, setLightbox] = useState<Lightbox>(null)
  const [year, setYear] = useState<string>(ALL_YEARS)

  // En móvil el navegador dispara un "ghost click" ~300ms después del toque que
  // caería sobre el overlay recién montado y lo cerraría solo; ignoramos cierres
  // dentro de esa ventana.
  const openedAtRef = useRef(0)
  const handleOpen = useCallback((lb: Lightbox) => {
    openedAtRef.current = Date.now()
    setLightbox(lb)
  }, [])

  const years = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      const y = extractYear(item.date)
      if (y) set.add(y)
    })
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [items])

  const visibleItems = useMemo(() => {
    if (!showYearFilter || year === ALL_YEARS) return items
    return items.filter((item) => extractYear(item.date) === year)
  }, [items, showYearFilter, year])

  const indexMap = useMemo(() => {
    const map = new Map<string, number>()
    visibleItems.forEach((item, idx) => map.set(item.id, idx))
    return map
  }, [visibleItems])

  const handleClose = useCallback(() => {
    if (Date.now() - openedAtRef.current < 400) return
    setLightbox(null)
  }, [])
  const handlePrev = useCallback(() => {
    if (!lightbox || visibleItems.length === 0) return
    const newIdx = (lightbox.idx - 1 + visibleItems.length) % visibleItems.length
    const it = visibleItems[newIdx]
    setLightbox({ url: it.url, caption: it.caption, idx: newIdx })
  }, [lightbox, visibleItems])
  const handleNext = useCallback(() => {
    if (!lightbox || visibleItems.length === 0) return
    const newIdx = (lightbox.idx + 1) % visibleItems.length
    const it = visibleItems[newIdx]
    setLightbox({ url: it.url, caption: it.caption, idx: newIdx })
  }, [lightbox, visibleItems])

  if (items.length === 0) return null

  return (
    <>
      <section className="py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
              {eyebrow}
            </p>
            <h2
              className="font-medium leading-[1.05] tracking-[-0.01em] text-[#111]"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(32px, 4vw, 52px)",
              }}
            >
              {title}
            </h2>
            <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c6a75e]" aria-hidden />
            {description && (
              <p className="mt-5 max-w-xl text-[15px] leading-[1.6] text-[#6b6b6b]">
                {description}
              </p>
            )}
          </div>
        </div>

        {showYearFilter && years.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {[ALL_YEARS, ...years].map((y) => {
              const isActive = year === y
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? "border-[#c6a75e] bg-[#c6a75e] text-white"
                      : "border-[#c6a75e]/40 text-[#a8862f] hover:bg-[#c6a75e]/10"
                  }`}
                >
                  {y === ALL_YEARS ? "Todos" : y}
                </button>
              )
            })}
          </div>
        )}

        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
          {visibleItems.map((item, idx) => {
            const media = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                />

                {(item.caption || item.date) && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.date && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e]">
                        {item.date}
                      </p>
                    )}
                    {item.caption && (
                      <p className="mt-1 text-[13px] leading-snug text-white">{item.caption}</p>
                    )}
                    {item.href && (
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6a75e]">
                        Ver curso →
                      </p>
                    )}
                  </div>
                )}

                <div className="absolute left-0 top-0 h-0.5 w-0 bg-[#c6a75e] transition-all duration-500 group-hover:w-full" />
              </>
            )

            return (
              <div key={item.id} className="break-inside-avoid">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="group relative block w-full overflow-hidden rounded-2xl bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a75e]"
                  >
                    {media}
                  </Link>
                ) : (
                  <button
                    className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a75e]"
                    onClick={() =>
                      handleOpen({
                        url: item.url,
                        caption: item.caption,
                        idx: indexMap.get(item.id) ?? idx,
                      })
                    }
                  >
                    {media}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {lightbox && (
        <LightboxOverlay
          lb={lightbox}
          total={visibleItems.length}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  )
}
