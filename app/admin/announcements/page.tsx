"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { toast } from "@/app/components/ui/motion/toast-provider"

type AnnouncementRow = {
  id: string
  label: string
  href: string | null
  position: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

type EditDraft = {
  label: string
  href: string
  isEnabled: boolean
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AnnouncementRow[]>([])
  const [barEnabled, setBarEnabled] = useState(false)
  const [barSettingsLoading, setBarSettingsLoading] = useState(true)
  const [barSettingsSaving, setBarSettingsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, EditDraft>>({})
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newHref, setNewHref] = useState("")

  async function loadBarSettings() {
    try {
      const res = await fetch("/api/admin/announcements/settings")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo cargar la configuración.")
        return
      }
      setBarEnabled(Boolean(json.data?.barEnabled))
    } catch {
      toast.error("Error de red al cargar la configuración.")
    } finally {
      setBarSettingsLoading(false)
    }
  }

  async function toggleBarEnabled(next: boolean) {
    setBarSettingsSaving(true)
    try {
      const res = await fetch("/api/admin/announcements/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barEnabled: next }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar la configuración.")
        return
      }
      setBarEnabled(Boolean(json.data?.barEnabled))
      toast.success(
        next ? "Barra de anuncios activada." : "Barra de anuncios desactivada.",
      )
    } catch {
      toast.error("Error de red.")
    } finally {
      setBarSettingsSaving(false)
    }
  }

  async function load() {
    try {
      const res = await fetch("/api/admin/announcements")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar los anuncios.")
        return
      }
      setItems(json.data ?? [])
      setDrafts(
        Object.fromEntries(
          (json.data as AnnouncementRow[] | undefined ?? []).map((row) => [
            row.id,
            { label: row.label, href: row.href ?? "", isEnabled: row.is_enabled },
          ])
        )
      )
    } catch {
      toast.error("Error de red al cargar los anuncios.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBarSettings()
    void load()
  }, [])

  function updateDraft(id: string, patch: Partial<EditDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function saveItem(id: string) {
    const draft = drafts[id]
    if (!draft) return
    const trimmed = draft.label.trim()
    if (!trimmed) {
      toast.error("El texto no puede quedar vacío.")
      return
    }
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          href: draft.href.trim() || null,
          isEnabled: draft.isEnabled,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar.")
        return
      }
      setItems((prev) => prev.map((row) => (row.id === id ? json.data : row)))
      toast.success("Cambios guardados.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este anuncio?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar.")
        return
      }
      setItems((prev) => prev.filter((row) => row.id !== id))
      setDrafts((prev) => {
        const { [id]: _omit, ...rest } = prev
        return rest
      })
      toast.success("Anuncio eliminado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  async function move(id: string, direction: "up" | "down") {
    const index = items.findIndex((row) => row.id === id)
    if (index === -1) return
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= items.length) return
    const a = items[index]
    const b = items[target]
    setBusyId(id)
    try {
      const [ra, rb] = await Promise.all([
        fetch(`/api/admin/announcements/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: b.position }),
        }),
        fetch(`/api/admin/announcements/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: a.position }),
        }),
      ])
      if (!ra.ok || !rb.ok) {
        toast.error("No se pudo reordenar.")
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) {
      toast.error("El texto del anuncio es obligatorio.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          href: newHref.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo crear.")
        return
      }
      const created = json.data as AnnouncementRow
      setItems((prev) => [...prev, created])
      setDrafts((prev) => ({
        ...prev,
        [created.id]: {
          label: created.label,
          href: created.href ?? "",
          isEnabled: created.is_enabled,
        },
      }))
      setNewLabel("")
      setNewHref("")
      toast.success("Anuncio creado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-4 pb-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Barra de anuncios" },
        ]}
      />

      <header className="mt-2 mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Barra de anuncios</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Slides que aparecen en la franja negra superior de toda la tienda.
          Rotan automáticamente cada 5 segundos. El link es opcional.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Mostrar barra en el sitio
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Activa o desactiva la franja negra superior en la página principal.
              Los slides se conservan aunque la barra esté apagada.
            </p>
          </div>
          <label className="inline-flex shrink-0 items-center gap-3 self-start sm:self-center">
            <span className="text-xs font-medium text-neutral-700">
              {barSettingsLoading
                ? "..."
                : barEnabled
                  ? "Activa"
                  : "Desactivada"}
            </span>
            <input
              type="checkbox"
              checked={barEnabled}
              disabled={barSettingsLoading || barSettingsSaving}
              onChange={(e) => void toggleBarEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-neutral-300 accent-[#c9a84c] disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Nuevo anuncio
          </h2>
        </header>
        <form onSubmit={handleCreate} className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_2fr_auto]">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ej. Envío gratis a partir de $1,999"
            maxLength={120}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
          />
          <input
            type="text"
            value={newHref}
            onChange={(e) => setNewHref(e.target.value)}
            placeholder="Link opcional (ej. /academia)"
            maxLength={500}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-[#c9a84c] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a] disabled:opacity-50"
          >
            {creating ? "Creando..." : "Agregar"}
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Slides actuales ({items.length})
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Reordena con las flechas, edita el texto o el link, y desactiva los
            que no quieras mostrar sin borrarlos.
          </p>
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Aún no hay anuncios. Agrega uno arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((row, index) => {
              const draft = drafts[row.id] ?? {
                label: row.label,
                href: row.href ?? "",
                isEnabled: row.is_enabled,
              }
              const dirty =
                draft.label !== row.label ||
                draft.href !== (row.href ?? "") ||
                draft.isEnabled !== row.is_enabled
              const isBusy = busyId === row.id
              return (
                <li
                  key={row.id}
                  className="grid items-center gap-3 px-4 py-3 md:grid-cols-[auto_1.5fr_2fr_auto_auto]"
                >
                  <div className="flex items-center gap-1 text-neutral-500">
                    <button
                      type="button"
                      onClick={() => move(row.id, "up")}
                      disabled={index === 0 || isBusy}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(row.id, "down")}
                      disabled={index === items.length - 1 || isBusy}
                      className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
                      title="Bajar"
                    >
                      ↓
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(e) => updateDraft(row.id, { label: e.target.value })}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                    maxLength={120}
                  />
                  <input
                    type="text"
                    value={draft.href}
                    onChange={(e) => updateDraft(row.id, { href: e.target.value })}
                    placeholder="Link opcional"
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                    maxLength={500}
                  />
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.isEnabled}
                      onChange={(e) => updateDraft(row.id, { isEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300 accent-[#c9a84c]"
                    />
                    <span className="text-xs text-neutral-700">Activo</span>
                  </label>
                  <div className="flex items-center gap-2 justify-self-end">
                    <button
                      type="button"
                      onClick={() => saveItem(row.id)}
                      disabled={!dirty || isBusy}
                      className="rounded-full bg-[#c9a84c] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a] disabled:opacity-50"
                    >
                      {isBusy ? "..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(row.id)}
                      disabled={isBusy}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

    </div>
  )
}
