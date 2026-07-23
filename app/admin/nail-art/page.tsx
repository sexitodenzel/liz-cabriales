"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import NailArtForm, { type NailArtFormData } from "./NailArtForm"
import type { NailArtPost } from "@/lib/supabase/nail-art"
import { nailArtImageApiPath } from "@/lib/nail-art-image"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Panel = { mode: "create" } | { mode: "edit"; post: NailArtPost }

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return ""
  }
}

export default function AdminNailArtPage() {
  const [posts, setPosts] = useState<NailArtPost[]>([])
  const [pending, setPending] = useState<NailArtPost[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NailArtPost | null>(null)

  const catalogPosts = useMemo(
    () => posts.filter((p) => p.status !== "pending"),
    [posts]
  )

  useEffect(() => {
    void loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setFetchError(null)
    try {
      const [allRes, pendingRes] = await Promise.all([
        fetch("/api/admin/nail-art"),
        fetch("/api/admin/nail-art?pending=1"),
      ])
      const allBody = await allRes.json()
      const pendingBody = await pendingRes.json()
      if (allBody.error) {
        setFetchError(allBody.error.message ?? "Error al cargar.")
      } else {
        setPosts(allBody.data ?? [])
      }
      setPending(pendingBody.data ?? [])
    } catch {
      setFetchError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(data: NailArtFormData) {
    setSaving(true)
    setSaveError(null)
    try {
      const isEdit = panel?.mode === "edit"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit ? { id: (panel as { mode: "edit"; post: NailArtPost }).post.id, ...data } : data

      const res = await fetch("/api/admin/nail-art", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const resBody = await res.json()
      if (!res.ok || resBody.error) {
        const message = resBody.error?.message ?? "Error al guardar."
        setSaveError(message)
        toast.error(message)
        return
      }
      toast.success(isEdit ? "Publicación actualizada" : "Publicación creada")
      setPanel(null)
      await loadAll()
    } catch {
      const message = "Error al guardar. Intenta de nuevo."
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(post: NailArtPost) {
    setTogglingId(post.id)
    try {
      const res = await fetch("/api/admin/nail-art", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, is_active: !post.is_active }),
      })
      if (res.ok) {
        const next = !post.is_active
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, is_active: next } : p))
        )
        toast.success(next ? "Publicación activada" : "Publicación oculta")
      } else {
        toast.error("No se pudo cambiar el estado.")
      }
    } catch {
      toast.error("Error de red.")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(post: NailArtPost) {
    setDeletingId(post.id)
    try {
      const res = await fetch(`/api/admin/nail-art?id=${post.id}`, { method: "DELETE" })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id))
        setPending((prev) => prev.filter((p) => p.id !== post.id))
        setDeleteTarget(null)
        toast.success("Publicación eliminada")
      } else {
        toast.error("No se pudo eliminar.")
      }
    } catch {
      toast.error("Error de red.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleModerate(post: NailArtPost, action: "approve" | "reject") {
    if (action === "reject" && !confirm(`¿Rechazar la inspiración de ${post.author_display_name ?? "usuario"}?`)) {
      return
    }
    setModeratingId(post.id)
    try {
      const res = await fetch("/api/admin/nail-art", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, action }),
      })
      const body = await res.json()
      if (!res.ok || body.error) {
        toast.error(body.error?.message ?? "No se pudo moderar")
        return
      }
      toast.success(action === "approve" ? "Inspiración aprobada" : "Inspiración rechazada")
      await loadAll()
    } catch {
      toast.error("Error de red.")
    } finally {
      setModeratingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-[1400px] px-6 py-10">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-[#c9a84c]">PANEL ADMINISTRADOR</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1a1a1a]">Nail Art</h1>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Publicaciones del estudio e inspiraciones de usuarias pendientes de aprobación.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/admin" className="text-sm font-medium text-[#6b6b6b] transition-colors hover:text-[#1a1a1a]">
              ← Volver al panel
            </Link>
            {!panel && (
              <button
                type="button"
                onClick={() => { setPanel({ mode: "create" }); setSaveError(null) }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9a84c]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nuevo Nail Art
              </button>
            )}
          </div>
        </div>

        {panel && (
          <div className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-[15px] font-semibold text-[#1a1a1a]">
              {panel.mode === "create" ? "Nueva publicación (Elaborado por Nosotros)" : `Editar: ${panel.post.title}`}
            </h2>
            {saveError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {saveError}
              </div>
            )}
            <NailArtForm
              key={panel.mode === "edit" ? panel.post.id : "create"}
              initialData={
                panel.mode === "edit"
                  ? {
                      id: panel.post.id,
                      title: panel.post.title,
                      slug: panel.post.slug,
                      description: panel.post.description ?? "",
                      cover_image: panel.post.cover_image ?? "",
                      is_active: panel.post.is_active,
                      sort_order: panel.post.sort_order,
                      products: panel.post.linked_products.map((lp, i) => ({
                        product_id: lp.product.id,
                        usage_description: lp.usage_description ?? "",
                        sort_order: i,
                      })),
                    }
                  : undefined
              }
              onSave={handleSave}
              onCancel={() => { setPanel(null); setSaveError(null) }}
              saving={saving}
            />
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-[#6b6b6b]">
            <Spinner />
            Cargando…
          </div>
        )}

        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <strong>Error:</strong> {fetchError}
            <p className="mt-1 text-xs text-red-500">
              Ejecuta también <code>supabase/migrations/20260723_nail_art_ugc.sql</code> en Supabase.
            </p>
          </div>
        )}

        {/* Inspiraciones por aprobar */}
        {!loading && !fetchError && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">
                Inspiraciones por aprobar
                {pending.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold text-amber-800">
                    {pending.length}
                  </span>
                )}
              </h2>
            </div>

            {pending.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-200 px-5 py-8 text-center text-[13px] text-neutral-400">
                No hay inspiraciones pendientes.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fffdf8] shadow-sm"
                  >
                    <div className="relative bg-neutral-100" style={{ aspectRatio: "3/4" }}>
                      <Image
                        src={nailArtImageApiPath(post.id)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-[13px] font-semibold text-[#111]">
                        {post.author_display_name ?? "Usuario"}
                      </p>
                      <p className="line-clamp-3 text-[12px] leading-relaxed text-neutral-600">
                        {post.description}
                      </p>
                      <p className="text-[11px] text-neutral-400">{formatDate(post.created_at)}</p>
                      {post.linked_products.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.linked_products.map((lp) => (
                            <span
                              key={lp.id}
                              className="rounded-full border border-[#c9a84c]/30 px-2 py-0.5 text-[10px] text-[#a8862f]"
                            >
                              {lp.product.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 border-t border-amber-100 px-4 py-3">
                      <button
                        type="button"
                        disabled={moderatingId === post.id}
                        onClick={() => void handleModerate(post, "approve")}
                        className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={moderatingId === post.id}
                        onClick={() => void handleModerate(post, "reject")}
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-[12px] font-semibold text-red-600 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Catálogo editorial / aprobado */}
        {!loading && !fetchError && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Publicaciones</h2>

            {catalogPosts.length === 0 && !panel ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-20 text-center">
                <p className="text-[14px] text-neutral-400">Aún no hay publicaciones de Nail Art.</p>
                <button
                  type="button"
                  onClick={() => setPanel({ mode: "create" })}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9a84c]"
                >
                  Crear la primera
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalogPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-opacity ${
                      !post.is_active ? "opacity-60" : "border-neutral-200"
                    }`}
                  >
                    <div className="relative bg-neutral-100" style={{ aspectRatio: "3/4" }}>
                      {post.cover_image ? (
                        <Image
                          src={nailArtImageApiPath(post.id)}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-neutral-300" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-col gap-1">
                        {post.is_editorial && (
                          <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8a6d26] shadow-sm">
                            Elaborado por Nosotros
                          </span>
                        )}
                        {post.status === "rejected" && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[9px] font-semibold text-red-700">
                            Rechazada
                          </span>
                        )}
                      </div>
                      <div className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        post.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"
                      }`}>
                        {post.is_active ? "Activo" : "Inactivo"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-[family-name:var(--font-playfair),serif] text-[14px] font-medium italic leading-snug text-[#111]">
                        {post.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        {post.author_display_name ?? "—"} · {post.likes_count} likes ·{" "}
                        {post.linked_products.length} producto{post.linked_products.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setPanel({ mode: "edit", post }); setSaveError(null) }}
                        className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(post)}
                        disabled={togglingId === post.id}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 disabled:opacity-50"
                      >
                        {togglingId === post.id ? "…" : (post.is_active ? "Ocultar" : "Activar")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(post)}
                        disabled={deletingId === post.id}
                        className="rounded-lg border border-transparent p-1.5 text-neutral-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        {deletingId === post.id ? (
                          <Spinner />
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nail-art-delete-title"
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default"
            onClick={() => {
              if (!deletingId) setDeleteTarget(null)
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2
              id="nail-art-delete-title"
              className="text-lg font-semibold text-[#1a1a1a]"
            >
              ¿Estás seguro que quieres eliminar este post?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Se eliminará{" "}
              <span className="font-medium text-[#1a1a1a]">
                “{deleteTarget.title}”
              </span>
              . Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => void handleDelete(deleteTarget)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === deleteTarget.id ? (
                  <>
                    <Spinner />
                    Eliminando…
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
