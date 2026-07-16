"use client"

import { useRef, useState } from "react"

type Props = {
  orderId: string
}

export default function TicketUpload({ orderId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/orders/${orderId}/ticket-upload`, {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "Error al subir el archivo.")
        return
      }
      setDone(true)
    } catch {
      setError("Error de red. Intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Ticket recibido
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          Recibimos la foto de tu ticket. En cuanto procesemos tu factura te avisamos por correo.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#e8e1d3] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b8b65]">
        Foto del ticket de pago
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        Para emitir tu factura CFDI necesitamos la foto o PDF de tu comprobante de pago.
      </p>

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="truncate text-sm font-medium text-[#0a0a0a]">{file.name}</p>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="ml-3 shrink-0 text-xs text-neutral-400 hover:text-[#0a0a0a]"
            >
              Quitar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-4 text-sm text-neutral-500 transition-colors hover:border-[#c6a75e] hover:text-[#c6a75e]"
          >
            Seleccionar archivo (JPG, PNG, PDF · máx. 10 MB)
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#0a0a0a] text-[11px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : "Enviar comprobante"}
        </button>
      )}
    </div>
  )
}
