"use client"

import { useState } from "react"
import { Ban, Trash2, UserRound } from "lucide-react"

import type { ProfessionalRow } from "@/lib/supabase/appointments"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  workers: ProfessionalRow[]
  onWorkersChange: (workers: ProfessionalRow[]) => void
  onBlockSchedule: (worker: ProfessionalRow) => void
}

function workerInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default function WorkersPanel({
  workers,
  onWorkersChange,
  onBlockSchedule,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeCount = workers.filter((w) => w.is_active).length

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      toast.error("Ingresa el nombre del trabajador")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo agregar el trabajador")
        return
      }

      const created = json.data.professional as ProfessionalRow
      onWorkersChange(
        [...workers, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success("Trabajador agregado")
      setNewName("")
      setShowAddModal(false)
    } catch {
      toast.error("Error de red al agregar trabajador")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(worker: ProfessionalRow) {
    setBusyId(worker.id)
    try {
      const res = await fetch(`/api/admin/professionals/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !worker.is_active }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar")
        return
      }

      const updated = json.data.professional as ProfessionalRow
      onWorkersChange(
        workers.map((w) => (w.id === updated.id ? updated : w))
      )
      toast.success(
        updated.is_active ? "Trabajador activado" : "Trabajador desactivado"
      )
    } catch {
      toast.error("Error de red al actualizar")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/professionals/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar")
        return
      }

      onWorkersChange(workers.filter((w) => w.id !== id))
      setConfirmDeleteId(null)
      toast.success("Trabajador eliminado")
    } catch {
      toast.error("Error de red al eliminar")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Trabajadores
            </p>
            <p className="mt-1 font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-[#111]">
              {workers.length}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {activeCount} activo{activeCount === 1 ? "" : "s"} en reservas
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-[#111] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c9a84c] hover:text-[#111]"
          >
            Agregar trabajador
          </button>
        </div>

        {workers.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            Aún no hay trabajadores. Agrégalos para que aparezcan al reservar
            citas.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {workers.map((worker) => (
              <li
                key={worker.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      worker.is_active
                        ? "bg-neutral-100 text-neutral-600"
                        : "bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {worker.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={worker.photo_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      workerInitials(worker.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`font-medium ${
                        worker.is_active ? "text-[#111]" : "text-neutral-400"
                      }`}
                    >
                      {worker.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {worker.is_active ? "Disponible en citas" : "Desactivado"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onBlockSchedule(worker)}
                    disabled={!worker.is_active || busyId === worker.id}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111] transition-colors hover:border-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Bloquear horario
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(worker)}
                    disabled={busyId === worker.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 transition-colors hover:border-[#c9a84c] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    {worker.is_active ? "Desactivar" : "Activar"}
                  </button>
                  {confirmDeleteId === worker.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(worker.id)}
                        disabled={busyId === worker.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:border-[#c9a84c]"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(worker.id)}
                      disabled={busyId === worker.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#111]">
                  Agregar trabajador
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Aparecerá al elegir profesional en /servicios
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-neutral-900"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="worker-name"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500"
                >
                  Nombre
                </label>
                <div className="relative mt-1.5">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="worker-name"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. María López"
                    autoFocus
                    maxLength={120}
                    className="w-full rounded-lg border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#c9a84c]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9a84c] hover:text-[#111] disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
