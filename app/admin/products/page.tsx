"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type {
  AdminCategory,
  AdminProductWithCategory,
} from "@/lib/supabase/admin"

type ToastState = {
  id: number
  type: "success" | "error"
  message: string
} | null

type CreateFormState = {
  name: string
  slug: string
  description: string
  basePrice: string
  categoryId: string
  brand: string
  imagesInput: string
  isActive: boolean
}

const BRAND_GOLD = "#C9A84C"
const BRAND_BLACK = "#000000"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [products, setProducts] = useState<AdminProductWithCategory[]>([])
  const [form, setForm] = useState<CreateFormState>({
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    categoryId: "",
    brand: "",
    imagesInput: "",
    isActive: true,
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreateFormState | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function fetchProducts() {
    try {
      const res = await fetch("/api/admin/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudieron cargar los productos. Intenta de nuevo.",
        })
        return
      }

      setCategories(json.data.categories ?? [])
      setProducts(json.data.products ?? [])
    } catch (error) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al cargar los productos.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let timeout: number | undefined
    if (toast) {
      timeout = window.setTimeout(() => setToast(null), 4000)
    }
    return () => {
      if (timeout) {
        window.clearTimeout(timeout)
      }
    }
  }, [toast])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!slugTouched) {
      setForm((prev) => ({
        ...prev,
        slug: slugify(prev.name),
      }))
    }
  }, [form.name, slugTouched])

  const activeProducts = useMemo(
    () => products.filter((p) => p.deleted_at === null),
    [products]
  )

  const handleFormChange = (
    field: keyof CreateFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditFormChange = (
    field: keyof CreateFormState,
    value: string | boolean
  ) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      [field]: value,
    })
  }

  async function handleCreateProduct(event: React.FormEvent) {
    event.preventDefault()
    if (!form.categoryId) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Selecciona una categoría.",
      })
      return
    }
    const basePriceNumber = Number(form.basePrice)
    if (Number.isNaN(basePriceNumber)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "El precio base debe ser un número.",
      })
      return
    }

    const images =
      form.imagesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? []

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          basePrice: basePriceNumber,
          categoryId: form.categoryId,
          brand: form.brand || null,
          images,
          isActive: form.isActive,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudo crear el producto. Intenta de nuevo.",
        })
        return
      }

      await fetchProducts()

      setForm({
        name: "",
        slug: "",
        description: "",
        basePrice: "",
        categoryId: "",
        brand: "",
        imagesInput: "",
        isActive: true,
      })
      setSlugTouched(false)

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto creado correctamente.",
      })
    } catch (error) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al crear el producto.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function startEditing(product: AdminProductWithCategory) {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      basePrice: String(product.base_price),
      categoryId: product.category_id,
      brand: product.brand ?? "",
      imagesInput: (product.images ?? []).join(", "),
      isActive: product.is_active,
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEditing() {
    if (!editingId || !editForm) return

    const basePriceNumber = Number(editForm.basePrice)
    if (Number.isNaN(basePriceNumber)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "El precio base debe ser un número.",
      })
      return
    }

    const images =
      editForm.imagesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean) ?? []

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          description: editForm.description || null,
          basePrice: basePriceNumber,
          categoryId: editForm.categoryId,
          brand: editForm.brand || null,
          images: images.length > 0 ? images : undefined,
          isActive: editForm.isActive,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudo actualizar el producto. Intenta de nuevo.",
        })
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? json.data : p))
      )

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto actualizado correctamente.",
      })
      cancelEditing()
    } catch (error) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al actualizar el producto.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(product: AdminProductWithCategory) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !product.is_active,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudo actualizar el estado del producto.",
        })
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? json.data : p))
      )

      setToast({
        id: Date.now(),
        type: "success",
        message: "Estado del producto actualizado.",
      })
    } catch (error) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al actualizar el estado del producto.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${confirmDeleteId}`, {
        method: "DELETE",
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || json?.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudo eliminar el producto. Intenta de nuevo.",
        })
        return
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === confirmDeleteId ? { ...p, deleted_at: new Date().toISOString() } : p
        )
      )

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto eliminado correctamente.",
      })
      setConfirmDeleteId(null)
    } catch (error) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al eliminar el producto.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-sm tracking-wide text-neutral-200">
          Cargando catálogo de productos…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <p
            className="text-xs font-semibold tracking-[0.25em] text-center sm:text-left"
            style={{ color: BRAND_GOLD }}
          >
            PANEL ADMINISTRADOR
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-neutral-900">
            CATÁLOGO DE PRODUCTOS
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
          <section className="rounded-2xl bg-white shadow-sm border border-neutral-200/80">
            <header className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
                NUEVO PRODUCTO
              </h2>
            </header>

            <form onSubmit={handleCreateProduct} className="px-6 py-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    NOMBRE
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleFormChange("name", event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        // CSS variable para reutilizar el dorado
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="Nombre del producto"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    SLUG
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true)
                      handleFormChange("slug", event.target.value)
                    }}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-mono text-[13px] outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="slug-del-producto"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Se genera automáticamente, pero puedes editarlo.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  DESCRIPCIÓN
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleFormChange("description", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={
                    {
                      "--brand-gold": BRAND_GOLD,
                    } as React.CSSProperties
                  }
                  placeholder="Describe brevemente el producto…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    PRECIO BASE MXN
                  </label>
                  <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-[color:var(--brand-gold)] focus-within:ring-1 focus-within:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                  >
                    <span className="mr-2 text-xs text-neutral-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(event) =>
                        handleFormChange("basePrice", event.target.value)
                      }
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    CATEGORÍA
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      handleFormChange("categoryId", event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    MARCA
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(event) =>
                      handleFormChange("brand", event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="Ej. Exotic, Miss Nails…"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    IMÁGENES (URLs separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={form.imagesInput}
                    onChange={(event) =>
                      handleFormChange("imagesInput", event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="https://... , https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      handleFormChange("isActive", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[color:var(--brand-gold)]"
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                  />
                  <span className="text-xs font-medium text-neutral-700">
                    PRODUCTO ACTIVO
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "CREANDO..." : "CREAR PRODUCTO"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow-sm border border-neutral-200/80 overflow-hidden">
            <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
                PRODUCTOS
              </h2>
              <span className="text-xs text-neutral-500">
                {activeProducts.length} productos activos
              </span>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">PRODUCTO</th>
                    <th className="px-4 py-3 font-semibold">MARCA</th>
                    <th className="px-4 py-3 font-semibold">CATEGORÍA</th>
                    <th className="px-4 py-3 font-semibold">PRECIO</th>
                    <th className="px-4 py-3 font-semibold">ESTADO</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {activeProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-sm text-neutral-500"
                      >
                        Aún no hay productos creados.
                      </td>
                    </tr>
                  ) : (
                    activeProducts.map((product) => {
                      const isEditing = editingId === product.id
                      return (
                        <tr key={product.id} className="align-top">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-neutral-900">
                                {product.name}
                              </p>
                              <p className="text-[11px] font-mono text-neutral-500">
                                /{product.slug}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700">
                            {product.brand ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700">
                            {product.category.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-900">
                            ${product.base_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                backgroundColor: product.is_active
                                  ? "rgba(201, 168, 76, 0.12)"
                                  : "rgba(120, 120, 120, 0.12)",
                                color: product.is_active
                                  ? BRAND_BLACK
                                  : "rgb(115, 115, 115)",
                                border: product.is_active
                                  ? `1px solid rgba(201, 168, 76, 0.6)`
                                  : "1px solid rgba(163, 163, 163, 0.6)",
                              }}
                            >
                              {product.is_active ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() =>
                                  isEditing
                                    ? cancelEditing()
                                    : startEditing(product)
                                }
                                className="text-neutral-900 hover:underline"
                              >
                                {isEditing ? "CANCELAR" : "EDITAR"}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleActive(product)}
                                className="text-[color:var(--brand-gold)] hover:underline"
                                style={
                                  {
                                    "--brand-gold": BRAND_GOLD,
                                  } as React.CSSProperties
                                }
                              >
                                {product.is_active
                                  ? "DESACTIVAR"
                                  : "ACTIVAR"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
                                className="text-red-600 hover:underline"
                              >
                                ELIMINAR
                              </button>
                            </div>

                            {isEditing && editForm && (
                              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      NOMBRE
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "name",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      SLUG
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.slug}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "slug",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                    DESCRIPCIÓN
                                  </label>
                                  <textarea
                                    value={editForm.description}
                                    onChange={(event) =>
                                      handleEditFormChange(
                                        "description",
                                        event.target.value
                                      )
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={
                                      {
                                        "--brand-gold": BRAND_GOLD,
                                      } as React.CSSProperties
                                    }
                                  />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      PRECIO BASE MXN
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editForm.basePrice}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "basePrice",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      CATEGORÍA
                                    </label>
                                    <select
                                      value={editForm.categoryId}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "categoryId",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    >
                                      <option value="">Selecciona</option>
                                      {categories.map((category) => (
                                        <option
                                          key={category.id}
                                          value={category.id}
                                        >
                                          {category.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      MARCA
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.brand}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "brand",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      IMÁGENES (URLs)
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.imagesInput}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "imagesInput",
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <label className="inline-flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={editForm.isActive}
                                      onChange={(event) =>
                                        handleEditFormChange(
                                          "isActive",
                                          event.target.checked
                                        )
                                      }
                                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[color:var(--brand-gold)]"
                                      style={
                                        {
                                          "--brand-gold": BRAND_GOLD,
                                        } as React.CSSProperties
                                      }
                                    />
                                    <span className="text-[11px] font-medium text-neutral-700">
                                      PRODUCTO ACTIVO
                                    </span>
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={cancelEditing}
                                      className="rounded-full border border-neutral-300 px-3 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEditing}
                                      disabled={submitting}
                                      className="rounded-full bg-black px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-neutral-900 disabled:opacity-60"
                                    >
                                      {submitting ? "GUARDANDO..." : "GUARDAR"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
          <div
            className={`pointer-events-auto max-w-md rounded-full border px-4 py-2.5 text-sm shadow-md ${
              toast.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">
              ¿Eliminar este producto?
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Esta acción marcará el producto como eliminado. Podrás restaurarlo
              manualmente desde la base de datos si es necesario.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

