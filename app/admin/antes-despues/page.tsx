"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Breadcrumb from "@/components/shared/Breadcrumb"
import AdminPageHeader from "@/app/admin/components/AdminPageHeader"
import ImageUploader from "@/app/admin/components/ImageUploader"
import { toast } from "@/app/components/ui/motion/toast-provider"

type BeforeAfterRow = {
  id: string
  before_image_url: string
  after_image_url: string
  service_label: string | null
  caption: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminBeforeAfterPage() {
  const router = useRouter()
  const [items, setItems] = useState<BeforeAfterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const [settings, setSettings] = useState({
    eyebrow: "",
    title: "",
    subtitle: "",
    cta_label: "",
    cta_href: "",
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fBefore, setFBefore] = useState("")
  const [fAfter, setFAfter] = useState("")
  const [fServiceLabel, setFServiceLabel] = useState("")
  const [fCaption, setFCaption] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/admin/before-after")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar los pares.")
        return
      }
      setItems(json.data ?? [])
    } catch {
      toast.error("Error de red al cargar los pares.")
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/before-after/settings")
      if (!res.ok) return
      const json = await res.json()
      if (json?.data) {
        setSettings({
          eyebrow: json.data.eyebrow ?? "",
          title: json.data.title ?? "",
          subtitle: json.data.subtitle ?? "",
          cta_label: json.data.cta_label ?? "",
          cta_href: json.data.cta_href ?? "",
        })
      }
    } catch {
      // Silencioso: si falla, el formulario queda con placeholders.
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch("/api/admin/before-after/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron guardar los textos.")
        return
      }
      toast.success("Textos guardados.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setSavingSettings(false)
    }
  }

  useEffect(() => {
    void load()
    void loadSettings()
  }, [])

  function openCreate() {
    setEditingId(null)
    setFBefore("")
    setFAfter("")
    setFServiceLabel("")
    setFCaption("")
    setModalOpen(true)
  }

  function openEdit(row: BeforeAfterRow) {
    setEditingId(row.id)
    setFBefore(row.before_image_url)
    setFAfter(row.after_image_url)
    setFServiceLabel(row.service_label ?? "")
    setFCaption(row.caption ?? "")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fBefore || !fAfter) {
      toast.error("Sube las dos fotos: antes y después.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        beforeImageUrl: fBefore,
        afterImageUrl: fAfter,
        serviceLabel: fServiceLabel.trim() || null,
        caption: fCaption.trim() || null,
      }
      const res = await fetch(
        editingId ? `/api/admin/before-after/${editingId}` : "/api/admin/before-after",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo guardar.")
        return
      }
      if (editingId) {
        setItems((prev) =>
          prev.map((it) => (it.id === editingId ? (json.data as BeforeAfterRow) : it))
        )
        toast.success("Par actualizado.")
      } else {
        setItems((prev) => [...prev, json.data as BeforeAfterRow])
        toast.success("Par agregado.")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error de red.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este par de fotos?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/before-after/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar.")
        return
      }
      setItems((prev) => prev.filter((it) => it.id !== id))
      toast.success("Par eliminado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(row: BeforeAfterRow) {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/before-after/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.is_active }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar.")
        return
      }
      setItems((prev) =>
        prev.map((it) => (it.id === row.id ? (json.data as BeforeAfterRow) : it))
      )
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setItems(next)
    setReordering(true)
    try {
      const res = await fetch("/api/admin/before-after", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((it) => it.id) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo reordenar.")
        void load()
      }
    } catch {
      toast.error("Error de red al reordenar.")
      void load()
    } finally {
      setReordering(false)
    }
  }

  const activeCount = items.filter((it) => it.is_active).length

  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-4 pb-6">
      <Breadcrumb
        items={[{ label: "Admin", href: "/admin" }, { label: "Antes y Después" }]}
      />

      <AdminPageHeader
        eyebrow="Contenido"
        title="Antes y Después"
        description={
          <>
            El comparador de fotos que aparece en la página principal, junto a
            Nail Art. Sube un par de fotos (antes y después) del resultado de
            un servicio —quiropodia, pedicura, reflexología— con una etiqueta
            y descripción opcionales.
            <span className="mt-2 block rounded-lg border border-[#e8dcb0] bg-[#f7f2e3] px-3 py-2 text-[13px] leading-snug text-[#7a5f21]">
              Usa las fotos reales de tus clientas (con su permiso). Las dos
              fotos del par deben ser del mismo pie/mano/rostro, tomadas desde
              el mismo ángulo, para que la comparación se vea bien.
            </span>
          </>
        }
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-[#c9a84c] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a]"
          >
            Agregar par
          </button>
        }
      />

      <form
        onSubmit={saveSettings}
        className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm"
      >
        <header className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Textos del encabezado
          </h2>
        </header>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Antetítulo (eyebrow)
            </label>
            <input
              type="text"
              value={settings.eyebrow}
              onChange={(e) => setSettings((s) => ({ ...s, eyebrow: e.target.value }))}
              placeholder="Resultados reales"
              maxLength={40}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Título
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
              placeholder="Antes y Después"
              maxLength={60}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Subtítulo
            </label>
            <textarea
              value={settings.subtitle}
              onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))}
              placeholder="Un par de líneas describiendo la sección."
              rows={2}
              maxLength={220}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Texto del botón
            </label>
            <input
              type="text"
              value={settings.cta_label}
              onChange={(e) => setSettings((s) => ({ ...s, cta_label: e.target.value }))}
              placeholder="Ver servicios y agenda tu cita"
              maxLength={60}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Enlace del botón
            </label>
            <input
              type="text"
              value={settings.cta_href}
              onChange={(e) => setSettings((s) => ({ ...s, cta_href: e.target.value }))}
              placeholder="/servicios"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
          <p className="text-[11px] text-neutral-400">
            Los campos que dejes vacíos usan el texto por defecto.
          </p>
          <button
            type="submit"
            disabled={savingSettings}
            className="rounded-full bg-neutral-900 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {savingSettings ? "Guardando…" : "Guardar textos"}
          </button>
        </footer>
      </form>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Pares ({items.length}) · {activeCount} visibles
          </h2>
          {reordering && (
            <span className="text-[11px] text-neutral-400">Guardando orden…</span>
          )}
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Aún no hay pares. Mientras no agregues ninguno, esta sección no
            aparece en la página principal. Agrega el primero con el botón de
            arriba.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((row, i) => {
              const isBusy = busyId === row.id
              return (
                <li key={row.id} className="flex items-center gap-4 p-4">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || reordering}
                      aria-label="Subir"
                      className="rounded border border-neutral-200 px-2 py-0.5 text-neutral-600 hover:border-neutral-400 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1 || reordering}
                      aria-label="Bajar"
                      className="rounded border border-neutral-200 px-2 py-0.5 text-neutral-600 hover:border-neutral-400 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.before_image_url}
                        alt="Antes"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-white/90 px-1 text-[8px] font-semibold uppercase tracking-wide text-ink">
                        Antes
                      </span>
                    </div>
                    <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.after_image_url}
                        alt="Después"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-ink/85 px-1 text-[8px] font-semibold uppercase tracking-wide text-white">
                        Después
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-neutral-800">
                      {row.service_label || <span className="text-neutral-400">Sin etiqueta de servicio</span>}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                      {row.caption || "Sin descripción"}
                    </p>
                    {!row.is_active && (
                      <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                        Oculto
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      disabled={isBusy}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600 hover:border-neutral-400 disabled:opacity-50"
                    >
                      {row.is_active ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      disabled={isBusy}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-600 hover:border-neutral-400 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(row.id)}
                      disabled={isBusy}
                      className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isBusy ? "…" : "Eliminar"}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              {editingId ? "Editar par" : "Nuevo par antes/después"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Las dos fotos son obligatorias. La etiqueta de servicio y la
              descripción son opcionales.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Foto "antes"
                </label>
                {fBefore ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fBefore}
                      alt="Vista previa antes"
                      className="h-24 w-20 rounded-lg bg-neutral-100 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFBefore("")}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    folder="antes-despues"
                    buttonLabel="Subir foto de antes"
                    onUpload={(url) => setFBefore(url)}
                    onError={(msg) => toast.error(msg)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Foto "después"
                </label>
                {fAfter ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fAfter}
                      alt="Vista previa después"
                      className="h-24 w-20 rounded-lg bg-neutral-100 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFAfter("")}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    folder="antes-despues"
                    buttonLabel="Subir foto de después"
                    onUpload={(url) => setFAfter(url)}
                    onError={(msg) => toast.error(msg)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Servicio (opcional)
                </label>
                <input
                  type="text"
                  value={fServiceLabel}
                  onChange={(e) => setFServiceLabel(e.target.value)}
                  placeholder="Ej. Quiropodia"
                  maxLength={40}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={fCaption}
                  onChange={(e) => setFCaption(e.target.value)}
                  placeholder="Ej. Eliminación de callosidad en una sesión"
                  maxLength={100}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !fBefore || !fAfter}
                  className="rounded-full bg-[#c9a84c] px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a] disabled:opacity-50"
                >
                  {saving ? "Guardando…" : editingId ? "Guardar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
