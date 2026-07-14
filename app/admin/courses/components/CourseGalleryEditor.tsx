"use client"

import { useState } from "react"
import ImageUploader from "@/app/admin/components/ImageUploader"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import type { CourseGalleryItem } from "@/lib/supabase/courses"

export type LocalGalleryItem = {
  tempId: string
  type: "image" | "video"
  url: string
  thumbnail_url: string | null
  caption: string
  is_cover: boolean
}

function ytThumb(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

function isValidVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}

let _uid = 0
function uid() {
  return `gallery-${++_uid}-${Math.random().toString(36).slice(2)}`
}

export function toLocalGalleryItems(raw: CourseGalleryItem[]): LocalGalleryItem[] {
  return raw.map((item) => ({
    tempId: item.id,
    type: item.type,
    url: item.url,
    thumbnail_url: item.thumbnail_url,
    caption: item.caption ?? "",
    is_cover: Boolean(item.is_cover),
  }))
}

type Props = {
  items: LocalGalleryItem[]
  onChange: (items: LocalGalleryItem[]) => void
  onError: (msg: string) => void
}

export default function CourseGalleryEditor({ items, onChange, onError }: Props) {
  const [videoUrl, setVideoUrl] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // URLs de solo las imágenes (los videos no entran al lightbox).
  const imageUrls = items.filter((i) => i.type === "image").map((i) => i.url)
  function imagePos(tempId: string): number {
    return items
      .filter((i) => i.type === "image")
      .findIndex((i) => i.tempId === tempId)
  }

  function addImage(url: string) {
    onChange([
      ...items,
      {
        tempId: uid(),
        type: "image",
        url,
        thumbnail_url: null,
        caption: "",
        is_cover: false,
      },
    ])
  }

  function addVideo() {
    const url = videoUrl.trim()
    if (!url) return
    if (!isValidVideoUrl(url)) {
      onError("URL inválida. Usa un enlace de YouTube o Vimeo.")
      return
    }
    onChange([
      ...items,
      {
        tempId: uid(),
        type: "video",
        url,
        thumbnail_url: ytThumb(url),
        caption: "",
        is_cover: false,
      },
    ])
    setVideoUrl("")
  }

  function remove(tempId: string) {
    onChange(items.filter((i) => i.tempId !== tempId))
  }

  function updateCaption(tempId: string, caption: string) {
    onChange(items.map((i) => (i.tempId === tempId ? { ...i, caption } : i)))
  }

  function setGalleryCover(tempId: string) {
    onChange(
      items.map((i) => ({
        ...i,
        is_cover: i.tempId === tempId ? !i.is_cover : false,
      }))
    )
  }

  const labelCls =
    "block text-xs font-medium uppercase tracking-wider text-[#6b6b6b]"

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.tempId}
              className="flex items-start gap-3 rounded-lg border border-[#ececec] bg-[#fafafa] p-3"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                {item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="h-16 w-24 rounded-md object-cover"
                  />
                ) : item.type === "image" ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(imagePos(item.tempId))}
                    aria-label="Ampliar imagen"
                    className="cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="h-16 w-24 rounded-md bg-neutral-100 object-contain"
                    />
                  </button>
                ) : (
                  <div className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-md bg-[#1a1a1a] text-white/50">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[10px]">Video</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.type === "image"
                        ? "bg-[#f5efdc] text-[#a8893a]"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {item.type === "image" ? "Imagen" : "Video"}
                  </span>
                  {item.type === "image" && (
                    <button
                      type="button"
                      onClick={() => setGalleryCover(item.tempId)}
                      title="La foto que representa al curso en la galería de eventos"
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        item.is_cover
                          ? "bg-[#c9a84c] text-white"
                          : "bg-white text-[#9a9a9a] ring-1 ring-inset ring-[#ececec] hover:text-[#a8893a] hover:ring-[#c9a84c]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={item.is_cover ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3 w-3"
                      >
                        <path d="M12 2.5l2.95 6.06 6.68.92-4.87 4.67 1.2 6.63L12 17.6l-5.96 3.18 1.2-6.63-4.87-4.67 6.68-.92L12 2.5z" />
                      </svg>
                      {item.is_cover ? "Portada de galería" : "Usar en galería"}
                    </button>
                  )}
                  {item.type === "video" && (
                    <span className="truncate text-[11px] text-[#9a9a9a]">
                      {item.url}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={item.caption}
                  onChange={(e) => updateCaption(item.tempId, e.target.value)}
                  className="w-full rounded border border-[#ececec] bg-white px-2 py-1.5 text-xs text-[#3a3a3a] outline-none transition-colors focus:border-[#c9a84c]"
                />
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(item.tempId)}
                aria-label="Eliminar"
                className="flex-shrink-0 rounded p-1.5 text-[#9a9a9a] transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agregar controles */}
      <div className="flex flex-col gap-3">
        {/* Imagen */}
        <div className="flex items-center gap-3">
          <ImageUploader
            folder="courses-gallery"
            buttonLabel="Agregar imagen"
            onUpload={addImage}
            onError={onError}
          />
          {items.length === 0 && (
            <span className="text-xs text-[#9a9a9a]">
              Sube fotos y agrega videos de lo que se aprendió.
            </span>
          )}
        </div>

        {/* Video URL */}
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="URL de YouTube o Vimeo…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addVideo()
              }
            }}
            className="flex-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-xs text-[#3a3a3a] outline-none transition-colors focus:border-[#c9a84c]"
          />
          <button
            type="button"
            onClick={addVideo}
            disabled={!videoUrl.trim()}
            className="rounded-lg border border-[#c9a84c] px-3 py-2 text-xs font-medium text-[#c9a84c] transition-colors hover:bg-[#c9a84c] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Video
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="mt-1 text-[11px] text-[#9a9a9a]">
          La galería aparece en el sitio público cuando el curso ya pasó.
        </p>
      )}

      {lightboxIndex !== null && lightboxIndex >= 0 && imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
