"use client"

import { useEffect, useState } from "react"

import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  className?: string
}

export default function TransferSettingsPanel({ className = "" }: Props) {
  const [transferAccountNumber, setTransferAccountNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    void fetch("/api/admin/studio-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!mounted) return
        if (typeof json?.data?.transfer_account_number === "string") {
          setTransferAccountNumber(json.data.transfer_account_number)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/studio-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfer_account_number: transferAccountNumber,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar el número")
        return
      }
      if (typeof json.data?.transfer_account_number === "string") {
        setTransferAccountNumber(json.data.transfer_account_number)
      }
      toast.success("Número de transferencias guardado")
    } catch {
      toast.error("Error de red al guardar el número")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={`overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="transfer-account-number"
            className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
          >
            Transferencias a:
          </label>
          <p className="mt-1 text-sm text-neutral-600">
            Número de cuenta o CLABE que verán las clientas al reservar para
            enviar el anticipo.
          </p>
          {loading ? (
            <p className="mt-3 text-sm text-neutral-500">Cargando…</p>
          ) : (
            <input
              id="transfer-account-number"
              type="text"
              value={transferAccountNumber}
              onChange={(e) => setTransferAccountNumber(e.target.value)}
              placeholder="Ej. 0123 4567 8901 234567"
              className="mt-3 w-full max-w-xl rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition-colors focus:border-[#c9a84c] sm:font-mono sm:tracking-wide"
            />
          )}
        </div>
        {!loading && (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="shrink-0 rounded-lg bg-[#111] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        )}
      </div>
    </section>
  )
}
