"use client"

import { useEffect, useMemo, useState } from "react"
import { Ban, Pencil, Trash2, UserRound } from "lucide-react"

import type {
  BlockedSlotRow,
  ProfessionalRow,
  ServiceFilterRow,
} from "@/lib/supabase/appointments"
import {
  formatStudioTimeLabel,
  isBlockedSlotActive,
} from "@/lib/appointments/studio-hours"
import ImageUploader from "@/app/admin/components/ImageUploader"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  workers: ProfessionalRow[]
  filters: ServiceFilterRow[]
  blockedSlots: BlockedSlotRow[]
  onWorkersChange: (workers: ProfessionalRow[]) => void
  onBlockSchedule: (worker: ProfessionalRow) => void
}

type WorkerFormState = {
  id: string | null
  name: string
  photo_url: string
  filter_ids: string[]
}

const EMPTY_FORM: WorkerFormState = {
  id: null,
  name: "",
  photo_url: "",
  filter_ids: [],
}

function workerInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function sortWorkers(workers: ProfessionalRow[]) {
  return [...workers].sort((a, b) => a.name.localeCompare(b.name))
}

function isFullDayBlock(block: BlockedSlotRow): boolean {
  return block.start_time.startsWith("00:00") && block.end_time.startsWith("23:59")
}

function blockUnavailableLabel(block: BlockedSlotRow): string {
  if (isFullDayBlock(block)) return "No disponible todo el día"
  return `No disponible de ${formatStudioTimeLabel(block.start_time)} a ${formatStudioTimeLabel(block.end_time)}`
}

export default function WorkersPanel({
  workers,
  filters,
  blockedSlots,
  onWorkersChange,
  onBlockSchedule,
}: Props) {
  const [form, setForm] = useState<WorkerFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const activeCount = workers.filter((w) => w.is_active).length
  const isEditing = Boolean(form?.id)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const nextBlockByWorker = useMemo(() => {
    const map = new Map<string, BlockedSlotRow>()
    for (const block of blockedSlots) {
      if (!block.professional_id) continue
      if (!isBlockedSlotActive(block, now)) continue
      if (!map.has(block.professional_id)) {
        map.set(block.professional_id, block)
      }
    }
    return map
  }, [blockedSlots, now])

  function openCreateModal() {
    setForm({ ...EMPTY_FORM })
  }

  function openEditModal(worker: ProfessionalRow) {
    setForm({
      id: worker.id,
      name: worker.name,
      photo_url: worker.photo_url ?? "",
      filter_ids: [...worker.filter_ids],
    })
  }

  function closeFormModal() {
    setForm(null)
  }

  function toggleFilter(filterId: string) {
    setForm((current) => {
      if (!current) return current
      const has = current.filter_ids.includes(filterId)
      return {
        ...current,
        filter_ids: has
          ? current.filter_ids.filter((id) => id !== filterId)
          : [...current.filter_ids, filterId],
      }
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    const name = form.name.trim()
    if (!name) {
      toast.error("Ingresa el nombre del trabajador")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        photo_url: form.photo_url.trim() || null,
        filter_ids: form.filter_ids,
      }

      const res = await fetch(
        form.id ? `/api/admin/professionals/${form.id}` : "/api/admin/professionals",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(
          json?.error?.message ??
            (form.id
              ? "No se pudo actualizar el trabajador"
              : "No se pudo agregar el trabajador")
        )
        return
      }

      const saved = json.data.professional as ProfessionalRow
      onWorkersChange(
        form.id
          ? sortWorkers(workers.map((w) => (w.id === saved.id ? saved : w)))
          : sortWorkers([...workers, saved])
      )
      toast.success(form.id ? "Trabajador actualizado" : "Trabajador agregado")
      closeFormModal()
    } catch {
      toast.error("Error de red al guardar trabajador")
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

  function filterLabels(worker: ProfessionalRow): string {
    if (worker.filter_ids.length === 0) return "Todas las áreas"
    return worker.filter_ids
      .map((id) => filters.find((f) => f.id === id)?.name)
      .filter(Boolean)
      .join(" · ")
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
            onClick={openCreateModal}
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
            {workers.map((worker) => {
              const nextBlock = nextBlockByWorker.get(worker.id)

              return (
                <li
                  key={worker.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold ${
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
                        className="h-full w-full object-cover"
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
                      {" · "}
                      {filterLabels(worker)}
                    </p>
                    {nextBlock && (
                      <div className="mt-1 space-y-0.5 text-xs">
                        <p className="font-medium text-red-600">
                          {blockUnavailableLabel(nextBlock)}
                        </p>
                        <p className="text-[#111]">
                          Por: {nextBlock.reason?.trim() || "Sin motivo registrado"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(worker)}
                    disabled={busyId === worker.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111] transition-colors hover:border-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
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
              )
            })}
          </ul>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#111]">
                  {isEditing ? "Editar trabajador" : "Agregar trabajador"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Foto y áreas en las que aparecerá al reservar en /servicios
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="text-neutral-500 hover:text-neutral-900"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Foto (opcional)
                </label>
                <div className="mt-2 flex items-center gap-3">
                  {form.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photo_url}
                      alt=""
                      className="h-14 w-14 rounded-full border border-neutral-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-500">
                      {form.name ? workerInitials(form.name) : "?"}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <ImageUploader
                      folder="professionals"
                      buttonLabel="Subir foto"
                      compact
                      onUpload={(url) =>
                        setForm((current) =>
                          current ? { ...current, photo_url: url } : current
                        )
                      }
                      onError={(msg) => toast.error(msg)}
                    />
                    {form.photo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) =>
                            current ? { ...current, photo_url: "" } : current
                          )
                        }
                        className="text-left text-[11px] text-red-500 hover:text-red-700"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                    value={form.name}
                    onChange={(e) =>
                      setForm((current) =>
                        current ? { ...current, name: e.target.value } : current
                      )
                    }
                    placeholder="Ej. María López"
                    autoFocus
                    maxLength={120}
                    className="w-full rounded-lg border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#c9a84c]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Filtros en los que aparece
                </label>
                <p className="mt-1 text-xs text-neutral-500">
                  Elige las áreas según sus conocimientos. Si no seleccionas
                  ninguna, aparecerá en todas.
                </p>
                {filters.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">
                    Primero agrega filtros en la sección de servicios (Manos,
                    Pies, etc.).
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filters.map((filter) => {
                      const selected = form.filter_ids.includes(filter.id)
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => toggleFilter(filter.id)}
                          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                            selected
                              ? "border-[#c9a84c] bg-[#fdfaf3] text-[#111]"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-[#c9a84c]/50"
                          }`}
                        >
                          {filter.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9a84c] hover:text-[#111] disabled:opacity-50"
                >
                  {saving ? "Guardando…" : isEditing ? "Guardar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
