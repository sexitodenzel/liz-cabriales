"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type {
  AdminBrand,
  AdminCategory,
  AdminProductWithCategory,
} from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/client"
import ImageUploader from "@/app/admin/components/ImageUploader"

type ToastState = {
  id: number
  type: "success" | "error"
  message: string
} | null

type CreateFormState = {
  name: string
  slug: string
  sku: string
  description: string
  longDescription: string
  basePrice: string
  costPrice: string
  wholesalePrice: string
  categoryId: string
  subcategory: string
  brand: string
  department: string
  imagesInput: string
  initialStock: string
  minStock: string
  stock: string
  isActive: boolean
  isFeatured: boolean
}

type ManagedCategory = AdminCategory & {
  productCount: number
}

type ManagedBrand = AdminBrand & {
  productCount: number
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
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [brands, setBrands] = useState<ManagedBrand[]>([])
  const [products, setProducts] = useState<AdminProductWithCategory[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState("")
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [brandSubmitting, setBrandSubmitting] = useState(false)
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateFormState>({
    name: "",
    slug: "",
    sku: "",
    description: "",
    longDescription: "",
    basePrice: "",
    costPrice: "",
    wholesalePrice: "",
    categoryId: "",
    subcategory: "",
    brand: "",
    department: "",
    imagesInput: "",
    initialStock: "",
    minStock: "",
    stock: "",
    isActive: true,
    isFeatured: false,
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreateFormState | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterLowStock, setFilterLowStock] = useState(false)

  function syncCategories(nextCategories: ManagedCategory[]) {
    setManagedCategories(nextCategories)
    setCategories(
      nextCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }))
    )
  }

  function syncBrands(nextBrands: ManagedBrand[]) {
    setBrands(nextBrands)
  }

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

      setProducts(json.data.products ?? [])
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al cargar los productos.",
      })
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/products/categories", {
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
            "No se pudieron cargar las categorías. Intenta de nuevo.",
        })
        return
      }

      syncCategories((json.data ?? []) as ManagedCategory[])
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al cargar las categorías.",
      })
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch("/api/admin/products/brands", {
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
            "No se pudieron cargar las marcas. Intenta de nuevo.",
        })
        return
      }

      syncBrands((json.data ?? []) as ManagedBrand[])
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al cargar las marcas.",
      })
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
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!form.categoryId) return
    const stillExists = categories.some((category) => category.id === form.categoryId)
    if (!stillExists) {
      setForm((prev) => ({ ...prev, categoryId: "" }))
    }
  }, [categories, form.categoryId])

  useEffect(() => {
    if (!editForm?.categoryId) return
    const stillExists = categories.some(
      (category) => category.id === editForm.categoryId
    )
    if (!stillExists) {
      setEditForm((prev) => (prev ? { ...prev, categoryId: "" } : prev))
    }
  }, [categories, editForm?.categoryId])

  useEffect(() => {
    if (!form.brand) return
    const stillExists = brands.some((brand) => brand.name === form.brand)
    if (!stillExists) {
      setForm((prev) => ({ ...prev, brand: "" }))
    }
  }, [brands, form.brand])

  useEffect(() => {
    if (!editForm?.brand) return
    const stillExists = brands.some((brand) => brand.name === editForm.brand)
    if (!stillExists) {
      setEditForm((prev) => (prev ? { ...prev, brand: "" } : prev))
    }
  }, [brands, editForm?.brand])

  useEffect(() => {
    const supabase = createClient()
    const categoriesChannel = supabase
      .channel("admin-products-categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCategories()
          fetchProducts()
        }
      )
      .subscribe()

    const brandsChannel = supabase
      .channel("admin-products-brands")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands" },
        () => {
          fetchBrands()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(categoriesChannel)
      void supabase.removeChannel(brandsChannel)
    }
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
  const brandOptions = useMemo(() => brands.map((brand) => brand.name), [brands])

  const filteredProducts = useMemo(() => {
    let result = activeProducts
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      )
    }
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory)
    }
    if (filterBrand) {
      result = result.filter((p) => p.brand === filterBrand)
    }
    if (filterStatus === "active") {
      result = result.filter((p) => p.is_active)
    } else if (filterStatus === "inactive") {
      result = result.filter((p) => !p.is_active)
    }
    if (filterLowStock) {
      result = result.filter((p) => p.stock <= p.min_stock)
    }
    return result
  }, [activeProducts, searchQuery, filterCategory, filterBrand, filterStatus, filterLowStock])

  const hasActiveFilters = searchQuery.trim() !== "" || filterCategory !== "" || filterBrand !== "" || filterStatus !== "all" || filterLowStock

  function clearFilters() {
    setSearchQuery("")
    setFilterCategory("")
    setFilterBrand("")
    setFilterStatus("all")
    setFilterLowStock(false)
  }

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

  async function handleCreateCategory(event: React.FormEvent) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "El nombre de la categoría es obligatorio.",
      })
      return
    }

    setCategorySubmitting(true)
    try {
      const res = await fetch("/api/admin/products/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ?? "No se pudo crear la categoría. Intenta de nuevo.",
        })
        return
      }

      setCategoryName("")
      await fetchCategories()
      setToast({
        id: Date.now(),
        type: "success",
        message: "Categoría creada correctamente.",
      })
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al crear la categoría.",
      })
    } finally {
      setCategorySubmitting(false)
    }
  }

  async function handleDeleteCategory(category: ManagedCategory) {
    if (category.productCount > 0) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "No puedes eliminar categorías con productos asociados.",
      })
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeletingCategoryId(category.id)
    try {
      const res = await fetch(`/api/admin/products/categories/${category.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ??
            "No se pudo eliminar la categoría. Intenta de nuevo.",
        })
        return
      }

      await fetchCategories()
      setToast({
        id: Date.now(),
        type: "success",
        message: "Categoría eliminada correctamente.",
      })
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al eliminar la categoría.",
      })
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function handleCreateBrand() {
    const name = brandName.trim()
    if (!name) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "El nombre de la marca es obligatorio.",
      })
      return
    }

    setBrandSubmitting(true)
    try {
      const res = await fetch("/api/admin/products/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: brandLogoUrl.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo crear la marca. Intenta de nuevo.",
        })
        return
      }

      const createdBrand = json.data as AdminBrand
      setBrands((prev) => {
        if (prev.some((brand) => brand.id === createdBrand.id)) {
          return prev
        }
        return [
          ...prev,
          {
            ...createdBrand,
            productCount: 0,
          },
        ].sort((a, b) => a.name.localeCompare(b.name, "es"))
      })

      setBrandName("")
      setBrandLogoUrl("")
      void fetchBrands()
      setToast({
        id: Date.now(),
        type: "success",
        message: "Marca creada correctamente.",
      })
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al crear la marca.",
      })
    } finally {
      setBrandSubmitting(false)
    }
  }

  async function handleDeleteBrand(brand: ManagedBrand) {
    if (brand.productCount > 0) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "No puedes eliminar marcas con productos asociados.",
      })
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeletingBrandId(brand.id)
    try {
      const res = await fetch(`/api/admin/products/brands/${brand.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message:
            json?.error?.message ?? "No se pudo eliminar la marca. Intenta de nuevo.",
        })
        return
      }

      await fetchBrands()
      setToast({
        id: Date.now(),
        type: "success",
        message: "Marca eliminada correctamente.",
      })
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al eliminar la marca.",
      })
    } finally {
      setDeletingBrandId(null)
    }
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
    if (!categories.some((category) => category.id === form.categoryId)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "La categoría seleccionada ya no está disponible.",
      })
      return
    }
    if (form.brand && !brands.some((brand) => brand.name === form.brand)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "La marca seleccionada ya no está disponible.",
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
          sku: form.sku || null,
          description: form.description || null,
          longDescription: form.longDescription || null,
          basePrice: basePriceNumber,
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
          categoryId: form.categoryId,
          subcategory: form.subcategory || null,
          brand: form.brand || null,
          department: form.department || null,
          images,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          initialStock: form.initialStock ? Number(form.initialStock) : 0,
          minStock: form.minStock ? Number(form.minStock) : 0,
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

      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()])

      setForm({
        name: "",
        slug: "",
        sku: "",
        description: "",
        longDescription: "",
        basePrice: "",
        costPrice: "",
        wholesalePrice: "",
        categoryId: "",
        subcategory: "",
        brand: "",
        department: "",
        imagesInput: "",
        initialStock: "",
        minStock: "",
        stock: "",
        isActive: true,
        isFeatured: false,
      })
      setSlugTouched(false)

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto creado correctamente.",
      })
    } catch {
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
      sku: product.sku ?? "",
      description: product.description ?? "",
      longDescription: product.long_description ?? "",
      basePrice: String(product.base_price),
      costPrice: product.cost_price !== null ? String(product.cost_price) : "",
      wholesalePrice: product.wholesale_price !== null ? String(product.wholesale_price) : "",
      categoryId: product.category_id,
      subcategory: product.subcategory ?? "",
      brand: product.brand ?? "",
      department: product.department ?? "",
      imagesInput: (product.images ?? []).join(", "),
      initialStock: "",
      minStock: String(product.min_stock ?? 0),
      stock: String(product.stock ?? 0),
      isActive: product.is_active,
      isFeatured: product.is_featured,
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEditing() {
    if (!editingId || !editForm) return
    if (!editForm.categoryId) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Selecciona una categoría.",
      })
      return
    }
    if (!categories.some((category) => category.id === editForm.categoryId)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "La categoría seleccionada ya no está disponible.",
      })
      return
    }
    if (editForm.brand && !brands.some((brand) => brand.name === editForm.brand)) {
      setToast({
        id: Date.now(),
        type: "error",
        message: "La marca seleccionada ya no está disponible.",
      })
      return
    }

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
          sku: editForm.sku || null,
          description: editForm.description || null,
          longDescription: editForm.longDescription || null,
          basePrice: basePriceNumber,
          costPrice: editForm.costPrice ? Number(editForm.costPrice) : null,
          wholesalePrice: editForm.wholesalePrice ? Number(editForm.wholesalePrice) : null,
          categoryId: editForm.categoryId,
          subcategory: editForm.subcategory || null,
          brand: editForm.brand || null,
          department: editForm.department || null,
          images: images.length > 0 ? images : undefined,
          isActive: editForm.isActive,
          isFeatured: editForm.isFeatured,
          stock: editForm.stock !== "" ? Number(editForm.stock) : null,
          minStock: editForm.minStock ? Number(editForm.minStock) : 0,
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
      await Promise.all([fetchCategories(), fetchBrands()])

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto actualizado correctamente.",
      })
      cancelEditing()
    } catch {
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
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al actualizar el estado del producto.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleFeatured(product: AdminProductWithCategory) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !product.is_featured }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast({
          id: Date.now(),
          type: "error",
          message: json?.error?.message ?? "No se pudo actualizar el destacado.",
        })
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? json.data : p))
      )

      setToast({
        id: Date.now(),
        type: "success",
        message: json.data.is_featured
          ? "Producto marcado como destacado."
          : "Producto quitado de destacados.",
      })
    } catch {
      setToast({
        id: Date.now(),
        type: "error",
        message: "Error de red al actualizar el destacado.",
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
      await Promise.all([fetchCategories(), fetchBrands()])

      setToast({
        id: Date.now(),
        type: "success",
        message: "Producto eliminado correctamente.",
      })
      setConfirmDeleteId(null)
    } catch {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm tracking-wide text-[#6b6b6b]">
          Cargando catálogo de productos…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-center sm:text-left text-[#c9a84c]">
            PANEL ADMINISTRADOR
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-[#1a1a1a]">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    CÓDIGO (SKU)
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(event) => handleFormChange("sku", event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-mono outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    placeholder="Ej. NAI-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    DEPARTAMENTO
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(event) => handleFormChange("department", event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    placeholder="Ej. Uñas"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  DESCRIPCIÓN CORTA
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleFormChange("description", event.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Describe brevemente el producto…"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  DESCRIPCIÓN LARGA
                </label>
                <textarea
                  value={form.longDescription}
                  onChange={(event) =>
                    handleFormChange("longDescription", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Descripción completa del producto, características, modo de uso…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    PRECIO COSTO MXN
                  </label>
                  <div
                    className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-[color:var(--brand-gold)] focus-within:ring-1 focus-within:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <span className="mr-2 text-xs text-neutral-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(event) => handleFormChange("costPrice", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    PRECIO VENTA MXN
                  </label>
                  <div
                    className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-[color:var(--brand-gold)] focus-within:ring-1 focus-within:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <span className="mr-2 text-xs text-neutral-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(event) => handleFormChange("basePrice", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    PRECIO MAYOREO MXN
                  </label>
                  <div
                    className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-[color:var(--brand-gold)] focus-within:ring-1 focus-within:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <span className="mr-2 text-xs text-neutral-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.wholesalePrice}
                      onChange={(event) => handleFormChange("wholesalePrice", event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    SUBCATEGORÍA
                  </label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(event) => handleFormChange("subcategory", event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    placeholder="Ej. Gel UV"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    MARCA
                  </label>
                  <select
                    value={form.brand}
                    onChange={(event) =>
                      handleFormChange("brand", event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <option value="">Selecciona una marca (opcional)</option>
                    {brandOptions.map((brandName) => (
                      <option key={brandName} value={brandName}>
                        {brandName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    INVENTARIO INICIAL
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.initialStock}
                    onChange={(event) => handleFormChange("initialStock", event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    INV. MÍNIMO
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.minStock}
                    onChange={(event) => handleFormChange("minStock", event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  IMÁGENES
                </label>
                <ImageUploader
                  onUpload={(url) => {
                    const current = form.imagesInput.trim()
                    handleFormChange(
                      "imagesInput",
                      current ? `${current}, ${url}` : url
                    )
                  }}
                  onError={(msg) =>
                    setToast({ id: Date.now(), type: "error", message: msg })
                  }
                />
                {(() => {
                  const urls = form.imagesInput.split(",").map((u) => u.trim()).filter(Boolean)
                  if (urls.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {urls.map((url, idx) => (
                        <div key={idx} className="relative group shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`imagen ${idx + 1}`}
                            className="h-14 w-14 rounded-lg object-cover border border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = urls.filter((_, i) => i !== idx)
                              handleFormChange("imagesInput", next.join(", "))
                            }}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <input
                  type="text"
                  value={form.imagesInput}
                  onChange={(event) =>
                    handleFormChange("imagesInput", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="O pega URLs separadas por coma"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        handleFormChange("isActive", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[color:var(--brand-gold)]"
                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium text-neutral-700">
                      ACTIVO
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(event) =>
                        handleFormChange("isFeatured", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-neutral-300 focus:ring-[color:var(--brand-gold)]"
                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium text-[#c9a84c]">
                      ★ DESTACADO
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:opacity-60 disabled:cursor-not-allowed"
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
                {hasActiveFilters
                  ? `${filteredProducts.length} de ${activeProducts.length} productos`
                  : `${activeProducts.length} productos activos`}
              </span>
            </header>

            <div className="border-b border-neutral-100 px-4 py-3 space-y-2 bg-neutral-50/60">
              <div className="relative">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400"
                  aria-hidden
                >
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código…"
                  className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-8 py-1.5 text-xs outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-sm leading-none"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Todas las marcas</option>
                  {brandOptions.map((bn) => (
                    <option key={bn} value={bn}>{bn}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#c9a84c]"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-neutral-300"
                  />
                  <span className="text-[11px] text-neutral-600">Stock bajo</span>
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-auto text-[11px] font-medium text-[#c9a84c] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-50 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">PRODUCTO</th>
                    <th className="px-4 py-3 font-semibold">CÓDIGO</th>
                    <th className="px-4 py-3 font-semibold">MARCA</th>
                    <th className="px-4 py-3 font-semibold">CATEGORÍA</th>
                    <th className="px-4 py-3 font-semibold text-right">P.COSTO</th>
                    <th className="px-4 py-3 font-semibold text-right">P.VENTA</th>
                    <th className="px-4 py-3 font-semibold text-right">P.MAYOREO</th>
                    <th className="px-4 py-3 font-semibold text-center">STOCK</th>
                    <th className="px-4 py-3 font-semibold">ESTADO</th>
                    <th className="px-4 py-3 font-semibold text-center">DEST.</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-8 text-center text-sm text-neutral-500"
                      >
                        {hasActiveFilters ? "Sin resultados para esta búsqueda." : "Aún no hay productos creados."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
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
                          <td className="px-4 py-4 text-xs font-mono text-neutral-600">
                            {product.sku ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700">
                            {product.brand ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-neutral-700">
                            <div>{product.category.name}</div>
                            {product.subcategory && (
                              <div className="text-[11px] text-neutral-400">{product.subcategory}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-neutral-600">
                            {product.cost_price !== null ? `$${product.cost_price.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-neutral-900 font-medium">
                            ${product.base_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-neutral-600">
                            {product.wholesale_price !== null ? `$${product.wholesale_price.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: product.stock <= product.min_stock
                                  ? "rgba(239,68,68,0.1)"
                                  : "rgba(201,168,76,0.1)",
                                color: product.stock <= product.min_stock ? "rgb(185,28,28)" : "rgb(120,90,30)",
                                border: product.stock <= product.min_stock
                                  ? "1px solid rgba(239,68,68,0.4)"
                                  : "1px solid rgba(201,168,76,0.4)",
                              }}
                            >
                              {product.stock}
                            </span>
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
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleFeatured(product)}
                              disabled={submitting}
                              title={product.is_featured ? "Quitar de destacados" : "Marcar como destacado"}
                              className="text-xl leading-none transition-opacity disabled:opacity-40"
                              style={{ color: product.is_featured ? BRAND_GOLD : "#d4d4d4" }}
                            >
                              {product.is_featured ? "★" : "☆"}
                            </button>
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
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">NOMBRE</label>
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => handleEditFormChange("name", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">SLUG</label>
                                    <input
                                      type="text"
                                      value={editForm.slug}
                                      onChange={(e) => handleEditFormChange("slug", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">CÓDIGO (SKU)</label>
                                    <input
                                      type="text"
                                      value={editForm.sku}
                                      onChange={(e) => handleEditFormChange("sku", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      placeholder="Ej. NAI-001"
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">DEPARTAMENTO</label>
                                    <input
                                      type="text"
                                      value={editForm.department}
                                      onChange={(e) => handleEditFormChange("department", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      placeholder="Ej. Uñas"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">SUBCATEGORÍA</label>
                                    <input
                                      type="text"
                                      value={editForm.subcategory}
                                      onChange={(e) => handleEditFormChange("subcategory", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      placeholder="Ej. Gel UV"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">DESCRIPCIÓN CORTA</label>
                                  <textarea
                                    value={editForm.description}
                                    onChange={(e) => handleEditFormChange("description", e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">DESCRIPCIÓN LARGA</label>
                                  <textarea
                                    value={editForm.longDescription}
                                    onChange={(e) => handleEditFormChange("longDescription", e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    placeholder="Descripción completa del producto…"
                                  />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">PRECIO COSTO</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={editForm.costPrice}
                                      onChange={(e) => handleEditFormChange("costPrice", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">PRECIO VENTA</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={editForm.basePrice}
                                      onChange={(e) => handleEditFormChange("basePrice", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">PRECIO MAYOREO</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={editForm.wholesalePrice}
                                      onChange={(e) => handleEditFormChange("wholesalePrice", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">CATEGORÍA</label>
                                    <select
                                      value={editForm.categoryId}
                                      onChange={(e) => handleEditFormChange("categoryId", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    >
                                      <option value="">Selecciona</option>
                                      {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">MARCA</label>
                                    <select
                                      value={editForm.brand}
                                      onChange={(e) => handleEditFormChange("brand", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    >
                                      <option value="">Selecciona (opcional)</option>
                                      {brandOptions.map((bn) => (
                                        <option key={bn} value={bn}>{bn}</option>
                                      ))}
                                      {editForm.brand && !brandOptions.includes(editForm.brand) && (
                                        <option value={editForm.brand}>{editForm.brand} (no disponible)</option>
                                      )}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">INVENTARIO</label>
                                    <input
                                      type="number" min="0" step="1"
                                      value={editForm.stock}
                                      onChange={(e) => handleEditFormChange("stock", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">INV. MÍNIMO</label>
                                    <input
                                      type="number" min="0" step="1"
                                      value={editForm.minStock}
                                      onChange={(e) => handleEditFormChange("minStock", e.target.value)}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">IMÁGENES</label>
                                  <ImageUploader
                                    compact
                                    onUpload={(url) => {
                                      const current = editForm.imagesInput.trim()
                                      handleEditFormChange("imagesInput", current ? `${current}, ${url}` : url)
                                    }}
                                    onError={(msg) => setToast({ id: Date.now(), type: "error", message: msg })}
                                  />
                                  {(() => {
                                    const urls = editForm.imagesInput.split(",").map((u) => u.trim()).filter(Boolean)
                                    if (urls.length === 0) return null
                                    return (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {urls.map((url, idx) => (
                                          <div key={idx} className="relative group shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={url}
                                              alt={`imagen ${idx + 1}`}
                                              className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const next = urls.filter((_, i) => i !== idx)
                                                handleEditFormChange("imagesInput", next.join(", "))
                                              }}
                                              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  })()}
                                  <input
                                    type="text"
                                    value={editForm.imagesInput}
                                    onChange={(e) => handleEditFormChange("imagesInput", e.target.value)}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    placeholder="O pega URLs separadas por coma"
                                  />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                  <div className="flex items-center gap-4">
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={(e) => handleEditFormChange("isActive", e.target.checked)}
                                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[color:var(--brand-gold)]"
                                        style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      />
                                      <span className="text-[11px] font-medium text-neutral-700">ACTIVO</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editForm.isFeatured}
                                        onChange={(e) => handleEditFormChange("isFeatured", e.target.checked)}
                                        className="h-4 w-4 rounded border-neutral-300 focus:ring-[color:var(--brand-gold)]"
                                        style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      />
                                      <span className="text-[11px] font-medium text-[#c9a84c]">★ DESTACADO</span>
                                    </label>
                                  </div>
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
                                      className="rounded-full bg-[#c9a84c] px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#a8893a] transition-colors disabled:opacity-60"
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

        <section className="mt-8 rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          <header className="border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              GESTIONAR CATEGORÍAS
            </h2>
          </header>

          <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  NUEVA CATEGORÍA
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Ej. Acrílico"
                />
                <p className="text-[11px] text-neutral-500">
                  El slug se genera automáticamente a partir del nombre.
                </p>
              </div>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {categorySubmitting ? "CREANDO..." : "CREAR CATEGORÍA"}
              </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">NOMBRE</th>
                    <th className="px-4 py-3 font-semibold">SLUG</th>
                    <th className="px-4 py-3 font-semibold text-center">PRODUCTOS</th>
                    <th className="px-4 py-3 font-semibold text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {managedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  ) : (
                    managedCategories.map((category) => {
                      const isDeleting = deletingCategoryId === category.id
                      const canDelete = category.productCount === 0
                      return (
                        <tr key={category.id}>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            {category.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                            {category.slug}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-700">
                            {category.productCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={!canDelete || isDeleting}
                              className="text-xs font-semibold text-red-600 transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                canDelete
                                  ? "Eliminar categoría"
                                  : "No se puede eliminar: tiene productos asociados"
                              }
                            >
                              {isDeleting ? "ELIMINANDO..." : "ELIMINAR"}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          <header className="border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              GESTIONAR MARCAS
            </h2>
          </header>

          <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleCreateBrand()
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  NUEVA MARCA
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Ej. Exotic"
                />
                <p className="text-[11px] text-neutral-500">
                  El slug se genera automáticamente a partir del nombre.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  LOGO
                </label>
                <ImageUploader
                  folder="brands"
                  onUpload={(url) => setBrandLogoUrl(url)}
                  onError={(msg) =>
                    setToast({ id: Date.now(), type: "error", message: msg })
                  }
                />
                <input
                  type="text"
                  value={brandLogoUrl}
                  onChange={(event) => setBrandLogoUrl(event.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="O pega URL del logo"
                />
              </div>

              <button
                type="submit"
                disabled={brandSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {brandSubmitting ? "CREANDO..." : "CREAR MARCA"}
              </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">MARCA</th>
                    <th className="px-4 py-3 font-semibold">SLUG</th>
                    <th className="px-4 py-3 font-semibold text-center">PRODUCTOS</th>
                    <th className="px-4 py-3 font-semibold text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {brands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500">
                        No hay marcas registradas.
                      </td>
                    </tr>
                  ) : (
                    brands.map((brand) => {
                      const isDeleting = deletingBrandId === brand.id
                      const canDelete = brand.productCount === 0
                      return (
                        <tr key={brand.id}>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              {brand.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={brand.logo_url}
                                  alt={brand.name}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-[10px] text-neutral-500">
                                  —
                                </span>
                              )}
                              <span>{brand.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                            {brand.slug}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-700">
                            {brand.productCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBrand(brand)}
                              disabled={!canDelete || isDeleting}
                              className="text-xs font-semibold text-red-600 transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                canDelete
                                  ? "Eliminar marca"
                                  : "No se puede eliminar: tiene productos asociados"
                              }
                            >
                              {isDeleting ? "ELIMINANDO..." : "ELIMINAR"}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
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

