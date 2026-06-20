"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Breadcrumb from "@/components/shared/Breadcrumb"

type MultiSelectOption = { value: string; label: string }

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }
  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} seleccionados`

  const active = selected.length > 0

  return (
    <div ref={ref} className="relative" onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] bg-white outline-none transition-colors ${
          active
            ? "border-[#c9a84c] text-[#c9a84c] font-medium"
            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
        }`}
      >
        <span className="max-w-[120px] truncate">{label}</span>
        <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[168px] rounded-xl border border-neutral-200 bg-white shadow-lg py-1 max-h-[220px] overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-neutral-400">Sin opciones</p>
          ) : (
            options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-neutral-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                />
                <span className="text-[11px] text-neutral-700">{opt.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

type TopSearchRow = {
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

type ToastState =
  | { id: number; type: "success" | "error"; message: string }
  | null

type ProductOption = {
  id: string
  name: string
  slug: string
  image: string | null
  isActive: boolean
  isBestSeller: boolean
  isFeatured: boolean
  categoryId: string
  categoryName: string
  brand: string | null
  stock: number
  minStock: number
}

type CategoryOption = {
  id: string
  name: string
  slug: string
}

export default function AdminTopSearchesPage() {
  const router = useRouter()
  const [items, setItems] = useState<TopSearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, EditDraft>>({})
  const [toast, setToast] = useState<ToastState>(null)
  const [creating, setCreating] = useState(false)

  const [products, setProducts] = useState<ProductOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  const [categoryBusyId, setCategoryBusyId] = useState<string | null>(null)

  const [productMgmtQuery, setProductMgmtQuery] = useState("")
  const [productBusyId, setProductBusyId] = useState<string | null>(null)
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [filterBrands, setFilterBrands] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [filterInteractions, setFilterInteractions] = useState<string[]>([])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  async function load() {
    try {
      const res = await fetch("/api/admin/top-searches")
      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }
      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudieron cargar los términos.",
        })
        return
      }
      setItems(json.data ?? [])
      setDrafts(
        Object.fromEntries(
          (json.data as TopSearchRow[] | undefined ?? []).map((row) => [
            row.id,
            { label: row.label, href: row.href ?? "", isEnabled: row.is_enabled },
          ])
        )
      )
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al cargar los términos.",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalog() {
    setCatalogLoading(true)
    try {
      const res = await fetch("/api/admin/products")
      if (!res.ok) return
      const json = await res.json()
      if (json.error || !json.data) return
      const rawProducts = (json.data.products ?? []) as Array<{
        id: string
        name: string
        slug: string
        images: string[] | null
        is_active: boolean
        is_best_seller: boolean
        is_featured: boolean
        category_id: string
        category?: { name: string } | null
        brand: string | null
        stock: number | null
        min_stock: number | null
      }>
      const rawCategories = (json.data.categories ?? []) as Array<{
        id: string
        name: string
        slug: string
      }>
      setProducts(
        rawProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images && p.images.length > 0 ? p.images[0] : null,
          isActive: p.is_active,
          isBestSeller: Boolean(p.is_best_seller),
          isFeatured: Boolean(p.is_featured),
          categoryId: p.category_id,
          categoryName: p.category?.name ?? "—",
          brand: p.brand ?? null,
          stock: Number(p.stock ?? 0),
          minStock: Number(p.min_stock ?? 0),
        }))
      )
      setCategories(
        rawCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
      )
    } catch {
      // silencioso: el modo manual sigue funcionando
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    void load()
    void loadCatalog()
  }, [])

  const brandOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.brand) set.add(p.brand)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [products])

  const topSearchProductSlugs = useMemo(() => {
    const set = new Set<string>()
    items.forEach((row) => {
      if (row.href && row.href.startsWith("/tienda/")) {
        set.add(row.href.slice("/tienda/".length))
      }
    })
    return set
  }, [items])

  const managedProducts = useMemo(() => {
    const q = productMgmtQuery.trim().toLowerCase()
    let result = products
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      )
    }
    if (filterCategories.length > 0) {
      result = result.filter((p) => filterCategories.includes(p.categoryId))
    }
    if (filterBrands.length > 0) {
      result = result.filter((p) => p.brand !== null && filterBrands.includes(p.brand))
    }
    if (filterStatus === "active") {
      result = result.filter((p) => p.isActive)
    } else if (filterStatus === "inactive") {
      result = result.filter((p) => !p.isActive)
    }
    if (filterLowStock) {
      result = result.filter((p) => p.stock <= p.minStock)
    }
    if (filterInteractions.includes("bestSeller")) {
      result = result.filter((p) => p.isBestSeller)
    }
    if (filterInteractions.includes("featured")) {
      result = result.filter((p) => p.isFeatured)
    }
    if (filterInteractions.includes("topSearch")) {
      result = result.filter((p) => topSearchProductSlugs.has(p.slug))
    }
    return result
  }, [
    products,
    productMgmtQuery,
    filterCategories,
    filterBrands,
    filterStatus,
    filterLowStock,
    filterInteractions,
    topSearchProductSlugs,
  ])

  const hasProductFilters =
    productMgmtQuery.trim() !== "" ||
    filterCategories.length > 0 ||
    filterBrands.length > 0 ||
    filterStatus !== "all" ||
    filterLowStock ||
    filterInteractions.length > 0

  function clearProductFilters() {
    setProductMgmtQuery("")
    setFilterCategories([])
    setFilterBrands([])
    setFilterStatus("all")
    setFilterLowStock(false)
    setFilterInteractions([])
  }

  function updateDraft(id: string, patch: Partial<EditDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function saveItem(id: string) {
    const draft = drafts[id]
    if (!draft) return
    const trimmed = draft.label.trim()
    if (!trimmed) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "El término no puede quedar vacío.",
      })
      return
    }
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/top-searches/${id}`, {
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
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo guardar.",
        })
        return
      }
      setItems((prev) => prev.map((row) => (row.id === id ? json.data : row)))
      setToast({ id: Date.now(), type: "success", message: "Cambios guardados." })
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar este término?")) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/top-searches/${id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo eliminar.",
        })
        return
      }
      setItems((prev) => prev.filter((row) => row.id !== id))
      setDrafts((prev) => {
        const { [id]: _omit, ...rest } = prev
        return rest
      })
      setToast({ id: Date.now(), type: "success", message: "Término eliminado." })
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
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
        fetch(`/api/admin/top-searches/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: b.position }),
        }),
        fetch(`/api/admin/top-searches/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: a.position }),
        }),
      ])
      if (!ra.ok || !rb.ok) {
        setToast({
          id: Date.now(),
          type: "error",
          message: "No se pudo reordenar.",
        })
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitCreate(payload: { label: string; href: string | null }) {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/top-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo crear.",
        })
        return false
      }
      const created = json.data as TopSearchRow
      setItems((prev) => [...prev, created])
      setDrafts((prev) => ({
        ...prev,
        [created.id]: {
          label: created.label,
          href: created.href ?? "",
          isEnabled: created.is_enabled,
        },
      }))
      setToast({ id: Date.now(), type: "success", message: "Término creado." })
      return true
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
      return false
    } finally {
      setCreating(false)
    }
  }

  async function toggleCategoryChip(category: CategoryOption) {
    const href = `/tienda?categoria=${category.slug}`
    const existing = items.find((row) => row.href === href)
    setCategoryBusyId(category.id)
    try {
      if (existing) {
        const res = await fetch(`/api/admin/top-searches/${existing.id}`, {
          method: "DELETE",
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.error) {
          setToast({
            id: Date.now(),
            type: "error",
            message: json?.error?.message ?? "No se pudo quitar de Más buscados.",
          })
          return
        }
        setItems((prev) => prev.filter((row) => row.id !== existing.id))
        setDrafts((prev) => {
          const { [existing.id]: _omit, ...rest } = prev
          return rest
        })
        setToast({
          id: Date.now(),
          type: "success",
          message: "Categoría quitada de Más buscados.",
        })
      } else {
        await submitCreate({ label: category.name.trim(), href })
      }
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
    } finally {
      setCategoryBusyId(null)
    }
  }

  async function toggleProductFlag(
    product: ProductOption,
    field: "isBestSeller" | "isFeatured"
  ) {
    const nextValue =
      field === "isBestSeller" ? !product.isBestSeller : !product.isFeatured
    setProductBusyId(product.id)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo actualizar el producto.",
        })
        return
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                isBestSeller: Boolean(json.data?.is_best_seller ?? p.isBestSeller),
                isFeatured: Boolean(json.data?.is_featured ?? p.isFeatured),
              }
            : p
        )
      )
      setToast({
        id: Date.now(),
        type: "success",
        message:
          field === "isBestSeller"
            ? nextValue
              ? "Producto marcado como best seller."
              : "Producto quitado de best sellers."
            : nextValue
              ? "Producto marcado como destacado."
              : "Producto quitado de destacados.",
      })
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
    } finally {
      setProductBusyId(null)
    }
  }

  async function toggleProductChip(product: ProductOption) {
    const href = `/tienda/${product.slug}`
    const existing = items.find((row) => row.href === href)
    setProductBusyId(product.id)
    try {
      if (existing) {
        const res = await fetch(`/api/admin/top-searches/${existing.id}`, {
          method: "DELETE",
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.error) {
          setToast({
            id: Date.now(),
            type: "error",
            message: json?.error?.message ?? "No se pudo quitar de Más buscados.",
          })
          return
        }
        setItems((prev) => prev.filter((row) => row.id !== existing.id))
        setDrafts((prev) => {
          const { [existing.id]: _omit, ...rest } = prev
          return rest
        })
        setToast({
          id: Date.now(),
          type: "success",
          message: "Producto quitado de Más buscados.",
        })
      } else {
        await submitCreate({ label: product.name, href })
      }
    } catch {
      setToast({ id: Date.now(), type: "error", message: "Error de red." })
    } finally {
      setProductBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-4 pb-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Más buscados" },
        ]}
      />

      <header className="mt-2 mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Más buscados</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestiona las interacciones del overlay de búsqueda: los chips de Más
          buscados, los productos Best Seller y los Destacados. Agrega
          categorías como chips o activa las interacciones de cada producto más
          abajo.
        </p>
      </header>

      <section className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              CATEGORÍAS EN MÁS BUSCADOS
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Activa una categoría para mostrarla como chip en el overlay de
              búsqueda.
            </p>
          </div>
          <span className="text-xs text-neutral-500">
            {categories.length} categorías
          </span>
        </header>

        <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-100 text-xs uppercase tracking-[0.16em]">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 font-semibold text-neutral-500">CATEGORÍA</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-500">MÁS BUSCADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {catalogLoading && categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-neutral-500">
                    Cargando...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No hay categorías disponibles.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const isBusy = categoryBusyId === category.id
                  const chipExists = items.some(
                    (row) => row.href === `/tienda?categoria=${category.slug}`
                  )
                  return (
                    <tr key={category.id}>
                      <td className="px-6 py-3">
                        <p className="text-sm font-semibold text-neutral-900">
                          {category.name}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          /tienda?categoria={category.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCategoryChip(category)}
                          disabled={isBusy || creating}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
                            chipExists
                              ? "border-[#c9a84c] bg-[#c9a84c] text-white hover:bg-[#a8893a]"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-[#c9a84c] hover:text-[#a8893a]"
                          }`}
                        >
                          {chipExists ? "Activo" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Chips actuales ({items.length})
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Reordena, edita, activa/desactiva o elimina los chips del overlay de
            búsqueda.
          </p>
        </header>

        {loading ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            No hay chips todavía. Agrega una categoría arriba o activa &quot;Más
            buscado&quot; en un producto.
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
                    maxLength={80}
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              PRODUCTOS E INTERACCIONES
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Activa Best Seller, Destacado o Más buscado para cada producto.
            </p>
          </div>
          <span className="text-xs text-neutral-500">
            {hasProductFilters
              ? `${managedProducts.length} de ${products.length} productos`
              : `${products.length} productos`}
          </span>
        </header>

        <div className="space-y-2 border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
          <div className="relative">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden
            >
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={productMgmtQuery}
              onChange={(e) => setProductMgmtQuery(e.target.value)}
              placeholder={
                catalogLoading
                  ? "Cargando productos..."
                  : "Buscar por nombre o slug…"
              }
              disabled={catalogLoading}
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-8 text-xs outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
            />
            {productMgmtQuery && (
              <button
                type="button"
                onClick={() => setProductMgmtQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm leading-none text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MultiSelectDropdown
              options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
              selected={filterCategories}
              onChange={setFilterCategories}
              placeholder="Todas las categorías"
            />

            <MultiSelectDropdown
              options={brandOptions.map((bn) => ({ value: bn, label: bn }))}
              selected={filterBrands}
              onChange={setFilterBrands}
              placeholder="Todas las marcas"
            />

            <MultiSelectDropdown
              options={[
                { value: "bestSeller", label: "Best Seller" },
                { value: "featured", label: "Destacado" },
                { value: "topSearch", label: "Más buscado" },
              ]}
              selected={filterInteractions}
              onChange={setFilterInteractions}
              placeholder="Todas las interacciones"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#c9a84c]"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
              />
              <span className="text-[11px] text-neutral-600">Stock bajo</span>
            </label>

            {hasProductFilters && (
              <button
                type="button"
                onClick={clearProductFilters}
                className="ml-auto text-[11px] font-medium text-[#c9a84c] hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[760px] overflow-x-auto overflow-y-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-100 text-xs uppercase tracking-[0.16em]">
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-3 font-semibold text-neutral-500">PRODUCTO</th>
                <th className="px-4 py-3 font-semibold text-neutral-500">CATEGORÍA</th>
                <th className="px-4 py-3 font-semibold text-neutral-500">MARCA</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-500">BEST SELLER</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-500">DESTACADO</th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-500">MÁS BUSCADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {catalogLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                    Cargando...
                  </td>
                </tr>
              ) : managedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                    {hasProductFilters
                      ? "Sin resultados para esta búsqueda."
                      : "No hay productos disponibles."}
                  </td>
                </tr>
              ) : (
                managedProducts.map((product) => {
                  const isBusy = productBusyId === product.id
                  const chipExists = items.some(
                    (row) => row.href === `/tienda/${product.slug}`
                  )
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                                LC
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {product.name}
                              {!product.isActive && (
                                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                  Inactivo
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[11px] font-mono text-neutral-500">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {product.categoryName}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {product.brand ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductFlag(product, "isBestSeller")}
                          disabled={isBusy}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
                            product.isBestSeller
                              ? "border-[#c9a84c] bg-[#c9a84c] text-white hover:bg-[#a8893a]"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-[#c9a84c] hover:text-[#a8893a]"
                          }`}
                        >
                          {product.isBestSeller ? "Activo" : "Activar"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductFlag(product, "isFeatured")}
                          disabled={isBusy}
                          title={
                            product.isFeatured
                              ? "Quitar de destacados"
                              : "Marcar como destacado"
                          }
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
                            product.isFeatured
                              ? "border-[#c9a84c] bg-[#fdf8ec] text-[#a8893a]"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-[#c9a84c] hover:text-[#a8893a]"
                          }`}
                        >
                          <span className="text-sm leading-none">
                            {product.isFeatured ? "★" : "☆"}
                          </span>
                          {product.isFeatured ? "Activo" : "Activar"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductChip(product)}
                          disabled={isBusy || creating}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
                            chipExists
                              ? "border-[#c9a84c] bg-[#c9a84c] text-white hover:bg-[#a8893a]"
                              : "border-neutral-300 bg-white text-neutral-600 hover:border-[#c9a84c] hover:text-[#a8893a]"
                          }`}
                        >
                          {chipExists ? "Activo" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
