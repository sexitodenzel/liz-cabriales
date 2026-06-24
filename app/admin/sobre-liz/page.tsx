"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Breadcrumb from "@/components/shared/Breadcrumb"
import ImageUploader from "@/app/admin/components/ImageUploader"
import { toast } from "@/app/components/ui/motion/toast-provider"

type LizEventRow = {
  id: string
  image_url: string
  caption: string | null
  event_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
}

export default function AdminSobreLizPage() {
  const router = useRouter()
  const [items, setItems] = useState<LizEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [newImage, setNewImage] = useState("")
  const [newCaption, setNewCaption] = useState("")
  const [newDate, setNewDate] = useState("")
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/admin/events")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudieron cargar los eventos.")
        return
      }
      setItems(json.data ?? [])
    } catch {
      toast.error("Error de red al cargar los eventos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openModal() {
    setNewImage("")
    setNewCaption("")
    setNewDate("")
    setModalOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newImage) {
      toast.error("Sube una imagen primero.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: newImage,
          caption: newCaption.trim() || null,
          eventDate: newDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo agregar el evento.")
        return
      }
      setItems((prev) => [...prev, json.data as LizEventRow])
      setModalOpen(false)
      toast.success("Evento agregado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setCreating(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este evento de la galería?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar.")
        return
      }
      setItems((prev) => prev.filter((row) => row.id !== id))
      toast.success("Evento eliminado.")
    } catch {
      toast.error("Error de red.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-4 pb-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Galería de eventos" },
        ]}
      />

      <header className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Galería de eventos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Fotos de masterclasses, talleres y eventos que aparecen en la página
            &ldquo;Sobre Liz&rdquo;.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="rounded-full bg-[#c9a84c] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a]"
        >
          Agregar evento
        </button>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Eventos ({items.length})
          </h2>
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Aún no hay eventos. Agrega el primero con el botón de arriba.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((row) => {
              const isBusy = busyId === row.id
              return (
                <li
                  key={row.id}
                  className="group overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  <div className="relative aspect-[4/3] w-full bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.image_url}
                      alt={row.caption ?? "Evento"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <p className="line-clamp-2 text-[13px] font-medium text-neutral-800">
                      {row.caption || "Sin descripción"}
                    </p>
                    <p className="text-[11px] text-neutral-500">{formatDate(row.event_date)}</p>
                    <button
                      type="button"
                      onClick={() => deleteItem(row.id)}
                      disabled={isBusy}
                      className="mt-1 self-start rounded-full border border-red-200 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isBusy ? "..." : "Eliminar"}
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
          onClick={() => !creating && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-neutral-900">Nuevo evento</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Sube una foto y agrega una descripción y la fecha del evento.
            </p>

            <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Imagen
                </label>
                {newImage ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newImage}
                      alt="Vista previa"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImage("")}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <ImageUploader
                    folder="events"
                    buttonLabel="Subir foto del evento"
                    onUpload={(url) => setNewImage(url)}
                    onError={(msg) => toast.error(msg)}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Ej. Masterclass de acrílico nivel profesional"
                  maxLength={160}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newImage}
                  className="rounded-full bg-[#c9a84c] px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#a8893a] disabled:opacity-50"
                >
                  {creating ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
