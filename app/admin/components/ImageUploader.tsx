"use client"

import { useRef, useState } from "react"

import { createClient } from "@/lib/supabase/client"

const SIZE_HINTS: Record<string, string> = {
  products: "1:1 · mín. 800×800 px",
  courses: "16:9 · mín. 1280×720 px",
  instructors: "1:1 · mín. 400×400 px",
  hero: "16:9 · mín. 1920×1080 px",
}

type Props = {
  onUpload: (url: string) => void
  onError: (msg: string) => void
  compact?: boolean
  folder?: string
  buttonLabel?: string
}

export default function ImageUploader({
  onUpload,
  onError,
  compact = false,
  folder = "products",
  buttonLabel = "Subir imagen",
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase()
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("images").getPublicUrl(path)
      if (!data?.publicUrl) {
        throw new Error("No se pudo obtener la URL pública de la imagen.")
      }
      onUpload(data.publicUrl)
    } catch (err: unknown) {
      console.error("[ImageUploader] upload error", err)
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Error al subir la imagen."
      onError(msg)
    } finally {
      setUploading(false)
      setPreview(null)
    }
  }

  const btnClass = compact
    ? "inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"

  const hint = SIZE_HINTS[folder ?? ""]

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-col gap-2"}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview && (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className={
              compact
                ? "h-10 w-10 rounded object-cover"
                : "h-16 w-16 rounded-lg object-cover"
            }
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
              <svg
                className="h-4 w-4 animate-spin text-white"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={btnClass}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
          aria-hidden
        >
          <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
          <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
        </svg>
        {uploading ? "Subiendo…" : buttonLabel}
      </button>
      </div>
      {!compact && hint && (
        <p className="text-[11px] text-neutral-400">{hint}</p>
      )}
    </div>
  )
}
