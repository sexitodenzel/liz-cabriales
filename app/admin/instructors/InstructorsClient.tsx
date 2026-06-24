"use client"

import { useState } from "react"
import ImageUploader from "@/app/admin/components/ImageUploader"
import type { InstructorRow } from "@/lib/supabase/courses"
import { toast } from "@/app/components/ui/motion/toast-provider"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
}

type EditState = {
  id: string | null
  name: string
  bio: string
  photo_url: string
}

const EMPTY_EDIT: EditState = { id: null, name: "", bio: "", photo_url: "" }

export default function InstructorsClient({
  initial,
}: {
  initial: InstructorRow[]
}) {
  const [instructors, setInstructors] = useState<InstructorRow[]>(initial)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function openCreate() {
    setEditing({ ...EMPTY_EDIT })
  }

  function openEdit(inst: InstructorRow) {
    setEditing({
      id: inst.id,
      name: inst.name,
      bio: inst.bio ?? "",
      photo_url: inst.photo_url ?? "",
    })
  }

  function closeEdit() {
    setEditing(null)
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.name.trim()) {
      toast.error("El nombre es obligatorio.")
      return
    }
    setSaving(true)

    try {
      const isNew = editing.id === null
      const url = isNew
        ? "/api/admin/instructors"
        : `/api/admin/instructors/${editing.id}`

      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name.trim(),
          bio: editing.bio.trim() || null,
          photo_url: editing.photo_url.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar")
        return
      }

      const saved = json.data.instructor as InstructorRow
      setInstructors((prev) =>
        isNew
          ? [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
          : prev.map((i) => (i.id === saved.id ? saved : i))
      )
      toast.success(isNew ? "Instructor creado" : "Instructor actualizado")
      closeEdit()
    } catch {
      toast.error("Error de red al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/instructors/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar")
        return
      }
      setInstructors((prev) => prev.filter((i) => i.id !== id))
      setConfirmDelete(null)
      toast.success("Instructor eliminado")
    } catch {
      toast.error("Error de red al eliminar")
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#c9a84c] transition-colors"
  const labelCls =
    "block text-xs font-medium uppercase tracking-wider text-[#6b6b6b]"

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Instructores</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            Gestiona los técnicos e instructores que aparecen en los cursos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a8893a]"
        >
          + Nuevo instructor
        </button>
      </div>

      {/* List */}
      {instructors.length === 0 ? (
        <div className="rounded-xl border border-[#ececec] bg-[#fafafa] px-6 py-12 text-center">
          <p className="text-sm text-[#6b6b6b]">
            Aún no hay instructores. Crea el primero.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {instructors.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center gap-4 rounded-xl border border-[#ececec] bg-white p-4"
            >
              {/* Avatar */}
              {inst.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inst.photo_url}
                  alt={inst.name}
                  className="h-12 w-12 flex-shrink-0 rounded-full border border-[#e8dcb0] object-cover"
                />
              ) : (
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#e8dcb0] bg-[#f5efdc] text-base font-semibold italic text-[#a8893a]"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {initials(inst.name)}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#1a1a1a]">{inst.name}</div>
                {inst.bio && (
                  <p className="mt-0.5 truncate text-xs text-[#6b6b6b]">
                    {inst.bio}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(inst)}
                  className="rounded-lg border border-[#ececec] px-3 py-1.5 text-xs font-medium text-[#3a3a3a] transition-colors hover:border-[#c9a84c] hover:text-[#a8893a]"
                >
                  Editar
                </button>
                {confirmDelete === inst.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(inst.id)}
                      disabled={saving}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg border border-[#ececec] px-3 py-1.5 text-xs text-[#6b6b6b] transition-colors hover:border-[#c9a84c]"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(inst.id)}
                    className="rounded-lg border border-[#ececec] px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-[#1a1a1a]">
              {editing.id ? "Editar instructor" : "Nuevo instructor"}
            </h2>

            <div className="space-y-4">
              {/* Foto */}
              <div>
                <label className={labelCls}>Foto (opcional)</label>
                <div className="mt-2 flex items-center gap-3">
                  {editing.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editing.photo_url}
                      alt=""
                      className="h-14 w-14 rounded-full border border-[#e8dcb0] object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8dcb0] bg-[#f5efdc] text-lg font-semibold italic text-[#a8893a]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {editing.name ? initials(editing.name) : "?"}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <ImageUploader
                      folder="instructors"
                      buttonLabel="Subir foto"
                      compact
                      onUpload={(url) =>
                        setEditing((e) => e && { ...e, photo_url: url })
                      }
                      onError={(msg) => toast.error(msg)}
                    />
                    {editing.photo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((e) => e && { ...e, photo_url: "" })
                        }
                        className="text-left text-[11px] text-red-500 hover:text-red-700"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className={labelCls}>Nombre *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  placeholder="Ej. Liz Cabriales"
                  className={inputCls}
                />
              </div>

              {/* Bio */}
              <div>
                <label className={labelCls}>Biografía (opcional)</label>
                <textarea
                  rows={3}
                  value={editing.bio}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, bio: e.target.value } : prev
                    )
                  }
                  placeholder="Breve descripción del instructor…"
                  className={inputCls}
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                disabled={saving}
                className="rounded-lg border border-[#ececec] px-4 py-2 text-sm font-medium text-[#3a3a3a] transition-colors hover:border-[#c9a84c] hover:text-[#a8893a] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando…" : editing.id ? "Guardar cambios" : "Crear instructor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
