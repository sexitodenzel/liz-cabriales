"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Breadcrumb from "@/components/shared/Breadcrumb"
import ImageUploader from "@/app/admin/components/ImageUploader"
import { toast } from "@/app/components/ui/motion/toast-provider"

type SpotlightRow = {
  id: string
  image_url: string
  avatar_url: string | null
  label: string | null
  link_href: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminHomeSpotlightPage() {
  const router = useRouter()
  const [items, setItems] = useState<SpotlightRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const [settings, setSettings] = useState({
    eyebrow: "",
    title: "",
    subtitle: "",
    body: "",
    cta_label: "",
    cta_href: "",
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fImage, setFImage] = useState("")
  const [fAvatar, setFAvatar] = useState("")
  const [fLabel, setFLabel] = useState("")
  const [fLink, setFLink] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/admin/home-spotlight")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar los items.")
        return
      }
      setItems(json.data ?? [])
    } catch {
      toast.error("Error de red al cargar los items.")
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/home-spotlight/settings")
      if (!res.ok) return
      const json = await res.json()
      if (json?.data) {
        setSettings({
          eyebrow: json.data.eyebrow ?? "",
          title: json.data.title ?? "",
          subtitle: json.data.subtitle ?? "",
          body: json.data.body ?? "",
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
      const res = await fetch("/api/admin/home-spotlight/settings", {
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
    setFImage("")
    setFAvatar("")
    setFLabel("")
    setFLink("")
    setModalOpen(true)
  }

  function openEdit(row: SpotlightRow) {
    setEditingId(row.id)
    setFImage(row.image_url)
    setFAvatar(row.avatar_url ?? "")
    setFLabel(row.label ?? "")
    setFLink(row.link_href ?? "")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fImage) {
      toast.error("Sube la imagen principal primero.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        imageUrl: fImage,
        avatarUrl: fAvatar.trim() || null,
        label: fLabel.trim() || null,
        linkHref: fLink.trim() || null,
      }
      const res = await fetch(
        editingId
          ? `/api/admin/home-spotlight/${editingId}`
          : "/api/admin/home-spotlight",
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
          prev.map((it) => (it.id === editingId ? (json.data as SpotlightRow) : it))
        )
        toast.success("Item actualizado.")
      } else {
        setItems((prev) => [...prev, json.data as SpotlightRow])
        toast.success("Item agregado.")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error de red.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este item del spotlight?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/home-spotlight/${id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar.")
        return
      }
      setItems((prev) => prev.filter((it) => it.id !== id))
      toast.success("Item eliminado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(row: SpotlightRow) {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/home-spotlight/${row.id}`, {
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
        prev.map((it) => (it.id === row.id ? (json.data as SpotlightRow) : it))
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
      const res = await fetch("/api/admin/home-spotlight", {
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
        items={[{ label: "Admin", href: "/admin" }, { label: "Spotlight del home" }]}
      />

      <header className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Spotlight del home
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            El collage editorial que aparece en la página principal. Sube lo que
            quieras destacar —nail art, fotos del estudio, promos— y ordénalo.
            Cada imagen puede llevar una foto redonda (avatar) y una etiqueta.
          </p>
          <p className="mt-2 rounded-lg border border-[#e8dcb0] bg-[#f7f2e3] px-3 py-2 text-[13px] leading-snug text-[#7a5f21]">
            Recomendado <strong>4 a 6 imágenes</strong> para que el collage se vea
            balanceado. Las que ocultes no aparecen en el home pero se quedan aquí
            guardadas.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-[#c9a84c] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a]"
        >
          Agregar imagen
        </button>
      </header>

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
              placeholder="El estudio"
              maxLength={40}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Subtítulo
            </label>
            <input
              type="text"
              value={settings.subtitle}
              onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))}
              placeholder="Una frase corta y opcional"
              maxLength={120}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Título grande
            </label>
            <textarea
              value={settings.title}
              onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
              placeholder={"Lo último del\nestudio"}
              rows={2}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              Escribe cada renglón en una línea distinta (Enter). Cada línea entra
              con la animación de cortina.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Párrafo de apoyo
            </label>
            <textarea
              value={settings.body}
              onChange={(e) => setSettings((s) => ({ ...s, body: e.target.value }))}
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
              placeholder="Ver la galería"
              maxLength={40}
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
              placeholder="/nail-art"
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
            Imágenes ({items.length}) · {activeCount} visibles
          </h2>
          {reordering && (
            <span className="text-[11px] text-neutral-400">Guardando orden…</span>
          )}
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Aún no hay imágenes. Agrega la primera con el botón de arriba.
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

                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.image_url}
                      alt={row.label ?? "Imagen"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {row.avatar_url && (
                      <span className="absolute bottom-1 right-1 h-6 w-6 overflow-hidden rounded-full ring-2 ring-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-neutral-800">
                      {row.label || <span className="text-neutral-400">Sin etiqueta</span>}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                      {row.link_href || "Sin enlace"}
                    </p>
                    {!row.is_active && (
                      <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                        Oculta
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
              {editingId ? "Editar imagen" : "Nueva imagen del spotlight"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              La imagen principal es obligatoria. El avatar, la etiqueta y el
              enlace son opcionales.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Imagen principal
                </label>
                {fImage ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fImage}
                      alt="Vista previa"
                      className="h-24 w-20 rounded-lg bg-neutral-100 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFImage("")}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    folder="home-spotlight"
                    buttonLabel="Subir imagen"
                    onUpload={(url) => setFImage(url)}
                    onError={(msg) => toast.error(msg)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Avatar (opcional)
                </label>
                {fAvatar ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fAvatar}
                      alt="Avatar"
                      className="h-14 w-14 rounded-full bg-neutral-100 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFAvatar("")}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    folder="home-spotlight"
                    compact
                    buttonLabel="Subir avatar"
                    onUpload={(url) => setFAvatar(url)}
                    onError={(msg) => toast.error(msg)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Etiqueta (opcional)
                </label>
                <input
                  type="text"
                  value={fLabel}
                  onChange={(e) => setFLabel(e.target.value)}
                  placeholder="Ej. @lizcabriales · Encapsulado"
                  maxLength={80}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Enlace (opcional)
                </label>
                <input
                  type="text"
                  value={fLink}
                  onChange={(e) => setFLink(e.target.value)}
                  placeholder="Ej. /nail-art/mi-diseno o /servicios"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  Ruta interna del sitio. Déjalo vacío si la imagen no debe llevar
                  a ningún lado.
                </p>
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
                  disabled={saving || !fImage}
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
