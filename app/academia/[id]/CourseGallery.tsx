"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { CourseGalleryItem } from "@/lib/supabase/courses"

// ─── helpers ─────────────────────────────────────────────────────────────────

function ytId(url: string) {
  return (
    url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )?.[1] ?? null
  )
}

function vimeoId(url: string) {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? null
}

function toEmbedUrl(url: string) {
  const yt = ytId(url)
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`
  const vm = vimeoId(url)
  if (vm) return `https://player.vimeo.com/video/${vm}?autoplay=1`
  return null
}

function videoThumb(url: string, fallback: string | null) {
  const yt = ytId(url)
  if (yt) return `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`
  return fallback
}

// ─── types ───────────────────────────────────────────────────────────────────

type Lightbox =
  | { kind: "image"; url: string; caption: string | null; idx: number }
  | { kind: "video"; embed: string; caption: string | null }
  | null

// ─── icons ───────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="h-9 w-9 drop-shadow-lg">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5"
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  )
}

function ChevLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-5 w-5"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-5 w-5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

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
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
      >
        <CloseIcon />
      </button>

      {lb.kind === "image" ? (
        <>
          {/* Prev */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrev()
              }}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <ChevLeft />
            </button>
          )}

          {/* Next */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <ChevRight />
            </button>
          )}

          {/* Image */}
          <div
            className="relative mx-16 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
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
        </>
      ) : (
        <div
          className="mx-4 w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
            <iframe
              src={lb.embed}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          {lb.caption && (
            <p className="mt-4 text-center text-[13px] text-white/70">
              {lb.caption}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── GalleryItem ─────────────────────────────────────────────────────────────

function GalleryItem({
  item,
  imgIndex,
  onOpen,
}: {
  item: CourseGalleryItem
  imgIndex: number
  onOpen: (lb: Lightbox) => void
}) {
  if (item.type === "image") {
    return (
      <button
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a75e]"
        onClick={() =>
          onOpen({
            kind: "image",
            url: item.url,
            caption: item.caption,
            idx: imgIndex,
          })
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? ""}
          className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Caption overlay */}
        {item.caption && (
          <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-4 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-[13px] leading-snug text-white">{item.caption}</p>
          </div>
        )}

        {/* Gold corner accent */}
        <div className="absolute left-0 top-0 h-0.5 w-0 bg-[#c6a75e] transition-all duration-500 group-hover:w-full" />
      </button>
    )
  }

  // Video
  const thumb = videoThumb(item.url, item.thumbnail_url)
  const embed = toEmbedUrl(item.url)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111]">
      <div className="aspect-video">
        {thumb ? (
          <button
            className="group relative h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a75e]"
            onClick={() =>
              embed &&
              onOpen({ kind: "video", embed, caption: item.caption })
            }
            disabled={!embed}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={item.caption ?? "Video"}
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-70"
              loading="lazy"
            />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-black/50 pl-1 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#c6a75e]/60 group-hover:bg-[#c6a75e]/20">
                <PlayIcon />
              </div>
            </div>

            {/* Caption */}
            {item.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
                <p className="text-[13px] text-white">{item.caption}</p>
              </div>
            )}
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/30">
            <PlayIcon />
            <span className="text-xs">Video</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CourseGallery({ items }: { items: CourseGalleryItem[] }) {
  const [lightbox, setLightbox] = useState<Lightbox>(null)

  // Momento en el que se abrió el lightbox. En móvil, el navegador dispara un
  // "ghost click" ~300ms después del toque que caería sobre el overlay recién
  // montado y lo cerraría solo; ignoramos cierres dentro de esa ventana.
  const openedAtRef = useRef(0)

  const handleOpen = useCallback((lb: Lightbox) => {
    openedAtRef.current = Date.now()
    setLightbox(lb)
  }, [])

  const imageItems = useMemo(
    () => items.filter((i) => i.type === "image"),
    [items]
  )

  const imageIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    for (const item of items) {
      if (item.type === "image") map.set(item.id, n++)
    }
    return map
  }, [items])

  const handleClose = useCallback(() => {
    if (Date.now() - openedAtRef.current < 400) return
    setLightbox(null)
  }, [])

  const handlePrev = useCallback(() => {
    if (!lightbox || lightbox.kind !== "image") return
    const newIdx =
      (lightbox.idx - 1 + imageItems.length) % imageItems.length
    const item = imageItems[newIdx]
    setLightbox({ kind: "image", url: item.url, caption: item.caption, idx: newIdx })
  }, [lightbox, imageItems])

  const handleNext = useCallback(() => {
    if (!lightbox || lightbox.kind !== "image") return
    const newIdx = (lightbox.idx + 1) % imageItems.length
    const item = imageItems[newIdx]
    setLightbox({ kind: "image", url: item.url, caption: item.caption, idx: newIdx })
  }, [lightbox, imageItems])

  if (items.length === 0) return null

  return (
    <>
      <section className="mt-16 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h2
            className="mb-1 text-[28px] font-medium tracking-tight text-[#1a1a1a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Lo que aprendimos
          </h2>
          <div className="mb-4 h-0.5 w-9 bg-[#c6a75e]" />
          <p className="text-[14px] leading-relaxed text-[#6b6b6b]">
            Momentos e imágenes de esta edición del taller.
          </p>
        </div>

        {/* Masonry grid — CSS columns */}
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
          {items.map((item) => (
            <div key={item.id} className="break-inside-avoid">
              <GalleryItem
                item={item}
                imgIndex={imageIndexMap.get(item.id) ?? 0}
                onOpen={handleOpen}
              />
            </div>
          ))}
        </div>
      </section>

      {lightbox && (
        <LightboxOverlay
          lb={lightbox}
          total={imageItems.length}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  )
}
