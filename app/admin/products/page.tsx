"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type {
  AdminBrand,
  AdminCategory,
  AdminProductVariant,
  AdminProductWithCategory,
  AdminSubcategoryWithProductCount,
} from "@/lib/supabase/admin"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { createClient } from "@/lib/supabase/client"
import ImageUploader from "@/app/admin/components/ImageUploader"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import {
  ABRASIVITY_LEVELS,
  isAbrasivityValue,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"
import {
  validateProductCritical,
  collectSanityWarnings,
  summarizeErrors,
  variantNameKey,
  variantPriceKey,
  variantStockKey,
  type FieldErrors,
} from "@/lib/validations/productForm"
import { exportProductsToXls } from "@/lib/admin/export-products-xls"
import { toast } from "@/app/components/ui/motion/toast-provider"

type CreateFormState = {
  name: string
  slug: string
  sku: string
  description: string
  longDescription: string
  applicationText: string
  searchSynonyms: string
  basePrice: string
  costPrice: string
  wholesalePrice: string
  categoryId: string
  subcategory: string
  brand: string
  department: string
  abrasivity: "" | AbrasivityValue
  imagesInput: string
  desktopImageMode: "carousel" | "hover"
  initialStock: string
  minStock: string
  stock: string
  isActive: boolean
  isFeatured: boolean
  isBestSeller: boolean
}

type VariantFormRow = {
  id?: string
  variantName: string
  sku: string
  price: string
  stock: string
  isActive: boolean
  colorHex: string
  sizeLabel: string
  isLimitedEdition: boolean
  _toDelete?: boolean
}

type ManagedCategory = AdminCategory & {
  productCount: number
}

type ManagedBrand = AdminBrand & {
  productCount: number
}

type ManagedSubcategory = AdminSubcategoryWithProductCount

const BRAND_GOLD = "#C9A84C"
const BRAND_BLACK = "#000000"

const PRODUCTS_TABLE_HEAD_CELL =
  "px-4 py-3 font-semibold text-neutral-500"
const PRODUCTS_TABLE_BODY_CELL =
  "border-r-2 border-neutral-300 px-4 py-4 align-top"

function formatProductUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

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
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function isPuntasCategory(
  categoryId: string,
  categories: AdminCategory[]
): boolean {
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return false
  const name = cat.name.trim().toLowerCase()
  return name.startsWith("punta") || cat.slug.startsWith("punta")
}

const ERROR_BORDER =
  "border-red-400 focus:border-red-400 focus:ring-red-300"
const OK_BORDER =
  "border-neutral-200 focus:border-[color:var(--brand-gold)] focus:ring-[color:var(--brand-gold)]"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-[11px] font-medium text-red-500">{message}</p>
  )
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [brands, setBrands] = useState<ManagedBrand[]>([])
  const [products, setProducts] = useState<AdminProductWithCategory[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState("")
  const [brandLogoUrl, setBrandLogoUrl] = useState("")
  const [brandShowOnHome, setBrandShowOnHome] = useState(false)
  const [brandShowOnHomeTouched, setBrandShowOnHomeTouched] = useState(false)
  const [brandSubmitting, setBrandSubmitting] = useState(false)
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<ManagedCategory | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)
  const [editingBrand, setEditingBrand] = useState<ManagedBrand | null>(null)
  const [editBrandName, setEditBrandName] = useState("")
  const [editBrandLogoUrl, setEditBrandLogoUrl] = useState("")
  const [editBrandShowOnHome, setEditBrandShowOnHome] = useState(false)
  const [editBrandShowOnHomeTouched, setEditBrandShowOnHomeTouched] = useState(false)
  const [savingBrand, setSavingBrand] = useState(false)
  const [form, setForm] = useState<CreateFormState>({
    name: "",
    slug: "",
    sku: "",
    description: "",
    longDescription: "",
    applicationText: "",
    searchSynonyms: "",
    basePrice: "",
    costPrice: "",
    wholesalePrice: "",
    categoryId: "",
    subcategory: "",
    brand: "",
    department: "",
    abrasivity: "",
    imagesInput: "",
    desktopImageMode: "carousel",
    initialStock: "",
    minStock: "",
    stock: "",
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
  })
  const [slugTouched, setSlugTouched] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreateFormState | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [createVariants, setCreateVariants] = useState<VariantFormRow[]>([])
  const [editVariants, setEditVariants] = useState<VariantFormRow[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  const [createErrors, setCreateErrors] = useState<FieldErrors>({})
  const [editErrors, setEditErrors] = useState<FieldErrors>({})
  const [confirmState, setConfirmState] = useState<{
    title: string
    warnings: string[]
    onConfirm: () => void
  } | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [filterBrands, setFilterBrands] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [filterOnSale, setFilterOnSale] = useState(false)

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [discountPercentInput, setDiscountPercentInput] = useState<string>("")
  const [applyingDiscount, setApplyingDiscount] = useState(false)

  const [productsFullscreen, setProductsFullscreen] = useState(false)
  const [categoriesFullscreen, setCategoriesFullscreen] = useState(false)
  const [subcategoriesFullscreen, setSubcategoriesFullscreen] = useState(false)
  const [brandsFullscreen, setBrandsFullscreen] = useState(false)

  const [subcategories, setSubcategories] = useState<ManagedSubcategory[]>([])
  const [subcategoryName, setSubcategoryName] = useState("")
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState("")
  const [subcategorySubmitting, setSubcategorySubmitting] = useState(false)
  const [editingSubcategory, setEditingSubcategory] =
    useState<ManagedSubcategory | null>(null)
  const [editSubcategoryName, setEditSubcategoryName] = useState("")
  const [savingSubcategory, setSavingSubcategory] = useState(false)
  const [deletingSubcategoryId, setDeletingSubcategoryId] = useState<
    string | null
  >(null)

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
        toast.error(json?.error?.message ??
            "No se pudieron cargar los productos. Intenta de nuevo.")
        return
      }

      setProducts(json.data.products ?? [])
    } catch {
      toast.error("Error de red al cargar los productos.")
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
        toast.error(json?.error?.message ??
            "No se pudieron cargar las categorías. Intenta de nuevo.")
        return
      }

      syncCategories((json.data ?? []) as ManagedCategory[])
    } catch {
      toast.error("Error de red al cargar las categorías.")
    }
  }

  async function fetchSubcategories() {
    try {
      const res = await fetch("/api/admin/products/subcategories", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }

      const json = await res.json()
      if (!res.ok || json.error) {
        // No interrumpimos el flujo si la tabla no existe; solo avisamos.
        if (json?.error?.code !== "SUBCATEGORIES_TABLE_MISSING") {
          toast.error(json?.error?.message ??
              "No se pudieron cargar las subcategorías.")
        }
        setSubcategories([])
        return
      }

      setSubcategories((json.data ?? []) as ManagedSubcategory[])
    } catch {
      setSubcategories([])
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
        toast.error(json?.error?.message ??
            "No se pudieron cargar las marcas. Intenta de nuevo.")
        return
      }

      syncBrands((json.data ?? []) as ManagedBrand[])
    } catch {
      toast.error("Error de red al cargar las marcas.")
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands(), fetchSubcategories()])
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
    if (filterCategories.length > 0) {
      result = result.filter((p) => filterCategories.includes(p.category_id))
    }
    if (filterBrands.length > 0) {
      result = result.filter((p) => p.brand !== null && filterBrands.includes(p.brand))
    }
    if (filterStatus === "active") {
      result = result.filter((p) => p.is_active)
    } else if (filterStatus === "inactive") {
      result = result.filter((p) => !p.is_active)
    }
    if (filterLowStock) {
      result = result.filter((p) => p.stock <= p.min_stock)
    }
    if (filterOnSale) {
      result = result.filter((p) => (p.discount_percent ?? 0) > 0)
    }
    return result
  }, [activeProducts, searchQuery, filterCategories, filterBrands, filterStatus, filterLowStock, filterOnSale])

  const hasActiveFilters = searchQuery.trim() !== "" || filterCategories.length > 0 || filterBrands.length > 0 || filterStatus !== "all" || filterLowStock || filterOnSale

  function clearFilters() {
    setSearchQuery("")
    setFilterCategories([])
    setFilterBrands([])
    setFilterStatus("all")
    setFilterLowStock(false)
    setFilterOnSale(false)
  }

  const filteredProductIds = useMemo(
    () => filteredProducts.map((p) => p.id),
    [filteredProducts]
  )

  const filteredSelectedCount = useMemo(
    () =>
      filteredProductIds.reduce(
        (acc, id) => acc + (selectedProductIds.has(id) ? 1 : 0),
        0
      ),
    [filteredProductIds, selectedProductIds]
  )

  const allFilteredSelected =
    filteredProductIds.length > 0 &&
    filteredSelectedCount === filteredProductIds.length

  const someFilteredSelected =
    filteredSelectedCount > 0 && !allFilteredSelected

  function toggleProductSelected(productId: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const id of filteredProductIds) next.delete(id)
      } else {
        for (const id of filteredProductIds) next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedProductIds(new Set())
  }

  async function submitBulkDiscount(percent: number) {
    if (selectedProductIds.size === 0) {
      toast.error("Selecciona al menos un producto.")
      return
    }
    if (!Number.isFinite(percent) || percent < 0 || percent > 95) {
      toast.error("El descuento debe estar entre 0 y 95%.")
      return
    }

    setApplyingDiscount(true)
    try {
      const res = await fetch("/api/admin/products/bulk-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          discountPercent: percent,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo aplicar el descuento.")
        return
      }
      const updated = (json?.data?.updated as number | undefined) ?? 0
      toast.success(percent === 0
            ? `Descuento removido de ${updated} producto${updated === 1 ? "" : "s"}.`
            : `Descuento ${percent}% aplicado a ${updated} producto${updated === 1 ? "" : "s"}.`)
      setDiscountPercentInput("")
      clearSelection()
      await fetchProducts()
    } catch {
      toast.error("Error de red al aplicar el descuento.")
    } finally {
      setApplyingDiscount(false)
    }
  }

  async function handleApplyDiscount() {
    const value = Number(discountPercentInput)
    await submitBulkDiscount(value)
  }

  async function handleClearDiscount() {
    await submitBulkDiscount(0)
  }

  const handleFormChange = (
    field: keyof CreateFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCreateErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field as string]
      return next
    })
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
    setEditErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field as string]
      return next
    })
  }

  function clearCreateError(key: string) {
    setCreateErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function clearEditError(key: string) {
    setEditErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleStartEditCategory(category: ManagedCategory) {
    setEditingCategory(category)
    setEditCategoryName(category.name)
  }

  function handleCancelEditCategory() {
    setEditingCategory(null)
    setEditCategoryName("")
  }

  async function handleSaveCategory() {
    if (!editingCategory) return
    const name = editCategoryName.trim()
    if (!name) {
      toast.error("El nombre de la categoría es obligatorio.")
      return
    }

    setSavingCategory(true)
    try {
      const res = await fetch(`/api/admin/products/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar la categoría.")
        return
      }

      setEditingCategory(null)
      setEditCategoryName("")
      await fetchCategories()
      toast.success("Categoría actualizada correctamente.")
    } catch {
      toast.error("Error de red al actualizar la categoría.")
    } finally {
      setSavingCategory(false)
    }
  }

  function handleStartEditSubcategory(sub: ManagedSubcategory) {
    setEditingSubcategory(sub)
    setEditSubcategoryName(sub.name)
  }

  function handleCancelEditSubcategory() {
    setEditingSubcategory(null)
    setEditSubcategoryName("")
  }

  async function handleCreateSubcategory(event: React.FormEvent) {
    event.preventDefault()
    const name = subcategoryName.trim()
    if (!name) {
      toast.error("El nombre de la subcategoría es obligatorio.")
      return
    }
    if (!subcategoryCategoryId) {
      toast.error("Selecciona una categoría padre.")
      return
    }

    setSubcategorySubmitting(true)
    try {
      const res = await fetch("/api/admin/products/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId: subcategoryCategoryId }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo crear la subcategoría.")
        return
      }

      setSubcategoryName("")
      await fetchSubcategories()
      toast.success("Subcategoría creada correctamente.")
    } catch {
      toast.error("Error de red al crear la subcategoría.")
    } finally {
      setSubcategorySubmitting(false)
    }
  }

  async function handleSaveSubcategory() {
    if (!editingSubcategory) return
    const name = editSubcategoryName.trim()
    if (!name) {
      toast.error("El nombre de la subcategoría es obligatorio.")
      return
    }

    setSavingSubcategory(true)
    try {
      const res = await fetch(
        `/api/admin/products/subcategories/${editingSubcategory.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      )

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar la subcategoría.")
        return
      }

      setEditingSubcategory(null)
      setEditSubcategoryName("")
      // El backend renombra la subcategoría también en products → refrescamos
      await Promise.all([fetchSubcategories(), fetchProducts()])
      toast.success("Subcategoría actualizada correctamente.")
    } catch {
      toast.error("Error de red al actualizar la subcategoría.")
    } finally {
      setSavingSubcategory(false)
    }
  }

  async function handleDeleteSubcategory(sub: ManagedSubcategory) {
    if (sub.productCount > 0) {
      toast.error("No puedes eliminar subcategorías con productos asociados.")
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar la subcategoría "${sub.name}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setDeletingSubcategoryId(sub.id)
    try {
      const res = await fetch(`/api/admin/products/subcategories/${sub.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo eliminar la subcategoría.")
        return
      }

      await fetchSubcategories()
      toast.success("Subcategoría eliminada correctamente.")
    } catch {
      toast.error("Error de red al eliminar la subcategoría.")
    } finally {
      setDeletingSubcategoryId(null)
    }
  }

  function handleStartEditBrand(brand: ManagedBrand) {
    setEditingBrand(brand)
    setEditBrandName(brand.name)
    setEditBrandLogoUrl(brand.logo_url ?? "")
    setEditBrandShowOnHome(Boolean(brand.show_on_home))
    setEditBrandShowOnHomeTouched(false)
  }

  function handleCancelEditBrand() {
    setEditingBrand(null)
    setEditBrandName("")
    setEditBrandLogoUrl("")
    setEditBrandShowOnHome(false)
    setEditBrandShowOnHomeTouched(false)
  }

  async function handleSaveBrand() {
    if (!editingBrand) return
    const name = editBrandName.trim()
    if (!name) {
      toast.error("El nombre de la marca es obligatorio.")
      return
    }

    setSavingBrand(true)
    try {
      const res = await fetch(`/api/admin/products/brands/${editingBrand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: editBrandLogoUrl.trim() || null,
          showOnHome: editBrandShowOnHome,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar la marca.")
        return
      }

      setEditingBrand(null)
      setEditBrandName("")
      setEditBrandLogoUrl("")
      setEditBrandShowOnHome(false)
      setEditBrandShowOnHomeTouched(false)
      await fetchBrands()
      toast.success("Marca actualizada correctamente.")
    } catch {
      toast.error("Error de red al actualizar la marca.")
    } finally {
      setSavingBrand(false)
    }
  }

  async function handleCreateCategory(event: React.FormEvent) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) {
      toast.error("El nombre de la categoría es obligatorio.")
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
        toast.error(json?.error?.message ?? "No se pudo crear la categoría. Intenta de nuevo.")
        return
      }

      setCategoryName("")
      await fetchCategories()
      toast.success("Categoría creada correctamente.")
    } catch {
      toast.error("Error de red al crear la categoría.")
    } finally {
      setCategorySubmitting(false)
    }
  }

  async function handleDeleteCategory(category: ManagedCategory) {
    if (category.productCount > 0) {
      toast.error("No puedes eliminar categorías con productos asociados.")
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
        toast.error(json?.error?.message ??
            "No se pudo eliminar la categoría. Intenta de nuevo.")
        return
      }

      await fetchCategories()
      toast.success("Categoría eliminada correctamente.")
    } catch {
      toast.error("Error de red al eliminar la categoría.")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function handleCreateBrand() {
    const name = brandName.trim()
    if (!name) {
      toast.error("El nombre de la marca es obligatorio.")
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
          showOnHome: brandShowOnHome,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo crear la marca. Intenta de nuevo.")
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
      setBrandShowOnHome(false)
      setBrandShowOnHomeTouched(false)
      void fetchBrands()
      toast.success("Marca creada correctamente.")
    } catch {
      toast.error("Error de red al crear la marca.")
    } finally {
      setBrandSubmitting(false)
    }
  }

  async function handleDeleteBrand(brand: ManagedBrand) {
    if (brand.productCount > 0) {
      toast.error("No puedes eliminar marcas con productos asociados.")
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
        toast.error(json?.error?.message ?? "No se pudo eliminar la marca. Intenta de nuevo.")
        return
      }

      await fetchBrands()
      toast.success("Marca eliminada correctamente.")
    } catch {
      toast.error("Error de red al eliminar la marca.")
    } finally {
      setDeletingBrandId(null)
    }
  }

  async function toggleBrandShowOnHome(brand: ManagedBrand) {
    try {
      const res = await fetch(`/api/admin/products/brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand.name,
          logoUrl: brand.logo_url ?? null,
          showOnHome: !brand.show_on_home,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ??
            "No se pudo actualizar la visibilidad de la marca.")
        return
      }

      await fetchBrands()
      toast.success(!brand.show_on_home
          ? "Marca habilitada en home."
          : "Marca ocultada de home.")
    } catch {
      toast.error("Error de red al actualizar la visibilidad de la marca.")
    }
  }

  function handleCreateProduct(event: React.FormEvent) {
    event.preventDefault()

    const errors = validateProductCritical(
      {
        name: form.name,
        slug: form.slug,
        categoryId: form.categoryId,
        basePrice: form.basePrice,
        costPrice: form.costPrice,
        wholesalePrice: form.wholesalePrice,
        initialStock: form.initialStock,
      },
      createVariants,
      {
        categoryValid: categories.some((c) => c.id === form.categoryId),
        brandValid: form.brand
          ? brands.some((b) => b.name === form.brand)
          : true,
      }
    )

    setCreateErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error(`Revisa los campos en rojo: ${summarizeErrors(errors).join(", ")}.`)
      return
    }

    const warnings = collectSanityWarnings(
      {
        name: form.name,
        slug: form.slug,
        categoryId: form.categoryId,
        basePrice: form.basePrice,
        costPrice: form.costPrice,
        wholesalePrice: form.wholesalePrice,
        initialStock: form.initialStock,
      },
      createVariants
    )

    if (warnings.length > 0) {
      setConfirmState({
        title: "Valores poco comunes detectados",
        warnings,
        onConfirm: () => {
          setConfirmState(null)
          void submitCreateProduct()
        },
      })
      return
    }

    void submitCreateProduct()
  }

  async function submitCreateProduct() {
    const basePriceNumber = Number(form.basePrice)

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
          applicationText: form.applicationText || null,
          searchSynonyms: form.searchSynonyms || null,
          basePrice: basePriceNumber,
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
          categoryId: form.categoryId,
          subcategory: form.subcategory || null,
          brand: form.brand || null,
          department: form.department || null,
          abrasivity: isPuntasCategory(form.categoryId, categories)
            ? form.abrasivity || null
            : null,
          images,
          desktopImageMode: form.desktopImageMode,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          isBestSeller: form.isBestSeller,
          initialStock: form.initialStock ? Number(form.initialStock) : 0,
          minStock: form.minStock ? Number(form.minStock) : 0,
          variants: createVariants.length > 0
            ? createVariants.map((v) => ({
                variantName: v.variantName,
                sku: v.sku || null,
                price: Number(v.price) || 0,
                stock: Number(v.stock) || 0,
                isActive: v.isActive,
                colorHex: v.colorHex || null,
                colorName: v.colorHex ? v.variantName : null,
                sizeLabel: v.sizeLabel || null,
                isLimitedEdition: v.isLimitedEdition,
              }))
            : undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(json?.error?.message ??
            "No se pudo crear el producto. Intenta de nuevo.")
        return
      }

      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands(), fetchSubcategories()])

      setForm({
        name: "",
        slug: "",
        sku: "",
        description: "",
        longDescription: "",
        applicationText: "",
        searchSynonyms: "",
        basePrice: "",
        costPrice: "",
        wholesalePrice: "",
        categoryId: "",
        subcategory: "",
        brand: "",
        department: "",
        abrasivity: "",
        imagesInput: "",
        desktopImageMode: "carousel",
        initialStock: "",
        minStock: "",
        stock: "",
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
      })
      setCreateVariants([])
      setCreateErrors({})
      setSlugTouched(false)

      toast.success("Producto creado correctamente.")
    } catch {
      toast.error("Error de red al crear el producto.")
    } finally {
      setSubmitting(false)
    }
  }

  async function startEditing(product: AdminProductWithCategory) {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? "",
      description: product.description ?? "",
      longDescription: product.long_description ?? "",
      applicationText: product.application_text ?? "",
      searchSynonyms: product.search_synonyms ?? "",
      basePrice: String(product.base_price),
      costPrice: product.cost_price !== null ? String(product.cost_price) : "",
      wholesalePrice: product.wholesale_price !== null ? String(product.wholesale_price) : "",
      categoryId: product.category_id,
      subcategory: product.subcategory ?? "",
      brand: product.brand ?? "",
      department: product.department ?? "",
      abrasivity: product.abrasivity ?? "",
      imagesInput: (product.images ?? []).join(", "),
      desktopImageMode: product.desktop_image_mode ?? "carousel",
      initialStock: "",
      minStock: String(product.min_stock ?? 0),
      stock: String(product.stock ?? 0),
      isActive: product.is_active,
      isFeatured: product.is_featured,
      isBestSeller: product.is_best_seller,
    })
    setLoadingVariants(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants`)
      const json = await res.json()
      if (!res.ok || json.error) {
        setEditVariants([])
      } else {
        setEditVariants(
          (json.data ?? []).map((v: AdminProductVariant) => ({
            id: v.id,
            variantName: v.variant_name,
            sku: v.sku,
            price: String(v.price),
            stock: String(v.stock),
            isActive: v.is_active,
            colorHex: v.color_hex ?? "",
            sizeLabel: v.size_label ?? "",
            isLimitedEdition: v.is_limited_edition,
          }))
        )
      }
    } catch {
      setEditVariants([])
    } finally {
      setLoadingVariants(false)
    }
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(null)
    setEditVariants([])
    setEditErrors({})
  }

  function saveEditing() {
    if (!editingId || !editForm) return

    const errors = validateProductCritical(
      {
        name: editForm.name,
        slug: editForm.slug,
        categoryId: editForm.categoryId,
        basePrice: editForm.basePrice,
        costPrice: editForm.costPrice,
        wholesalePrice: editForm.wholesalePrice,
        initialStock: editForm.initialStock,
        stock: editForm.stock,
      },
      editVariants,
      {
        categoryValid: categories.some((c) => c.id === editForm.categoryId),
        brandValid: editForm.brand
          ? brands.some((b) => b.name === editForm.brand)
          : true,
      }
    )

    setEditErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error(`Revisa los campos en rojo: ${summarizeErrors(errors).join(", ")}.`)
      return
    }

    const warnings = collectSanityWarnings(
      {
        name: editForm.name,
        slug: editForm.slug,
        categoryId: editForm.categoryId,
        basePrice: editForm.basePrice,
        costPrice: editForm.costPrice,
        wholesalePrice: editForm.wholesalePrice,
        initialStock: editForm.initialStock,
        stock: editForm.stock,
      },
      editVariants
    )

    if (warnings.length > 0) {
      setConfirmState({
        title: "Valores poco comunes detectados",
        warnings,
        onConfirm: () => {
          setConfirmState(null)
          void submitEditing()
        },
      })
      return
    }

    void submitEditing()
  }

  async function submitEditing() {
    if (!editingId || !editForm) return

    const basePriceNumber = Number(editForm.basePrice)

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
          applicationText: editForm.applicationText || null,
          searchSynonyms: editForm.searchSynonyms || null,
          basePrice: basePriceNumber,
          costPrice: editForm.costPrice ? Number(editForm.costPrice) : null,
          wholesalePrice: editForm.wholesalePrice ? Number(editForm.wholesalePrice) : null,
          categoryId: editForm.categoryId,
          subcategory: editForm.subcategory || null,
          brand: editForm.brand || null,
          department: editForm.department || null,
          abrasivity: isPuntasCategory(editForm.categoryId, categories)
            ? editForm.abrasivity || null
            : null,
          images: images.length > 0 ? images : undefined,
          desktopImageMode: editForm.desktopImageMode,
          isActive: editForm.isActive,
          isFeatured: editForm.isFeatured,
          isBestSeller: editForm.isBestSeller,
          stock: editForm.stock !== "" ? Number(editForm.stock) : null,
          minStock: editForm.minStock ? Number(editForm.minStock) : 0,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(json?.error?.message ??
            "No se pudo actualizar el producto. Intenta de nuevo.")
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? json.data : p))
      )
      await Promise.all([fetchCategories(), fetchBrands()])

      const toDelete = editVariants.filter((v) => v._toDelete && v.id)
      const toUpdate = editVariants.filter((v) => !v._toDelete && v.id)
      const toCreate = editVariants.filter((v) => !v._toDelete && !v.id)
      const variantOps: Promise<Response>[] = [
        ...toDelete.map((v) =>
          fetch(`/api/admin/products/${editingId}/variants/${v.id}`, { method: "DELETE" })
        ),
        ...toUpdate.map((v) =>
          fetch(`/api/admin/products/${editingId}/variants/${v.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantName: v.variantName,
              sku: v.sku || null,
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
              isActive: v.isActive,
              colorHex: v.colorHex || null,
              colorName: v.colorHex ? v.variantName : null,
              sizeLabel: v.sizeLabel || null,
              isLimitedEdition: v.isLimitedEdition,
            }),
          })
        ),
        ...toCreate.map((v) =>
          fetch(`/api/admin/products/${editingId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantName: v.variantName,
              sku: v.sku || null,
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
              isActive: v.isActive,
              colorHex: v.colorHex || null,
              colorName: v.colorHex ? v.variantName : null,
              sizeLabel: v.sizeLabel || null,
              isLimitedEdition: v.isLimitedEdition,
            }),
          })
        ),
      ]
      if (variantOps.length > 0) {
        await Promise.all(variantOps)
      }

      toast.success("Producto actualizado correctamente.")
      cancelEditing()
    } catch {
      toast.error("Error de red al actualizar el producto.")
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
        toast.error(json?.error?.message ??
            "No se pudo actualizar el estado del producto.")
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? json.data : p))
      )

      toast.success("Estado del producto actualizado.")
    } catch {
      toast.error("Error de red al actualizar el estado del producto.")
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
        toast.error(json?.error?.message ??
            "No se pudo eliminar el producto. Intenta de nuevo.")
        return
      }

      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteId))
      await Promise.all([fetchCategories(), fetchBrands()])

      toast.success("Producto eliminado correctamente.")
      setConfirmDeleteId(null)
    } catch {
      toast.error("Error de red al eliminar el producto.")
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
      <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-10">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Mi Perfil", href: "/perfil" },
            { label: "Panel de administrador", href: "/admin" },
            { label: "Productos" },
          ]}
        />
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-center sm:text-left text-[#c9a84c]">
            PANEL ADMINISTRADOR
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-[#1a1a1a]">
            Catálogo de productos
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
              {Object.keys(createErrors).length > 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold text-red-600">
                    Faltan o son inválidos estos campos:
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-[11px] text-red-600">
                    {summarizeErrors(createErrors).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

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
                    className={`w-full rounded-lg border bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-1 ${createErrors.name ? ERROR_BORDER : OK_BORDER}`}
                    style={
                      {
                        // CSS variable para reutilizar el dorado
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="Nombre del producto"
                  />
                  <FieldError message={createErrors.name} />
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
                    className={`w-full rounded-lg border bg-neutral-50 px-3 py-2 text-sm font-mono text-[13px] outline-none focus:ring-1 ${createErrors.slug ? ERROR_BORDER : OK_BORDER}`}
                    style={
                      {
                        "--brand-gold": BRAND_GOLD,
                      } as React.CSSProperties
                    }
                    placeholder="slug-del-producto"
                  />
                  {createErrors.slug ? (
                    <FieldError message={createErrors.slug} />
                  ) : (
                    <p className="text-[11px] text-neutral-500">
                      Se genera automáticamente, pero puedes editarlo.
                    </p>
                  )}
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

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  APLICACIÓN / TAMAÑO
                </label>
                <textarea
                  value={form.applicationText}
                  onChange={(event) =>
                    handleFormChange("applicationText", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder={"Cómo aplicar / pasos / detalles de presentación…\nDivide en párrafos con un renglón en blanco."}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  SINÓNIMOS DE BÚSQUEDA
                </label>
                <textarea
                  value={form.searchSynonyms}
                  onChange={(event) =>
                    handleFormChange("searchSynonyms", event.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="barniz, pintauñas, polish — separa con comas"
                />
                <p className="text-[11px] text-neutral-500">
                  Palabras alternativas que las clientas podrían usar al buscar este producto. Aparece como match en el buscador pero no se muestra en la tienda.
                </p>
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
                    className={`flex items-center rounded-lg border bg-neutral-50 px-3 py-2 ${createErrors.basePrice ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-300" : "border-neutral-200 focus-within:border-[color:var(--brand-gold)] focus-within:ring-[color:var(--brand-gold)]"} focus-within:ring-1`}
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
                  <FieldError message={createErrors.basePrice} />
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
                    onChange={(event) => {
                      const nextCategoryId = event.target.value
                      handleFormChange("categoryId", nextCategoryId)
                      if (form.subcategory) handleFormChange("subcategory", "")
                      if (
                        form.abrasivity &&
                        !isPuntasCategory(nextCategoryId, categories)
                      ) {
                        handleFormChange("abrasivity", "")
                      }
                    }}
                    className={`w-full rounded-lg border bg-neutral-50 px-3 py-2 text-sm outline-none focus:ring-1 ${createErrors.categoryId ? ERROR_BORDER : OK_BORDER}`}
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={createErrors.categoryId} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    SUBCATEGORÍA
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(event) => handleFormChange("subcategory", event.target.value)}
                    disabled={!form.categoryId}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <option value="">
                      {form.categoryId ? "Sin subcategoría" : "Selecciona primero una categoría"}
                    </option>
                    {subcategories
                      .filter((sub) => sub.category_id === form.categoryId)
                      .map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                  {form.categoryId &&
                    subcategories.filter((sub) => sub.category_id === form.categoryId).length === 0 && (
                      <p className="text-[11px] text-neutral-500">
                        Esta categoría no tiene subcategorías. Crea una desde el panel &quot;Gestionar subcategorías&quot;.
                      </p>
                    )}
                </div>
              </div>

              {isPuntasCategory(form.categoryId, categories) && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    ABRASIVIDAD <span className="text-neutral-400">(cinta de color)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFormChange("abrasivity", "")}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        form.abrasivity === ""
                          ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)]/10 font-medium text-neutral-800"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }`}
                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    >
                      Sin clasificar
                    </button>
                    {ABRASIVITY_LEVELS.map((level) => {
                      const active = form.abrasivity === level.value
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() =>
                            handleFormChange(
                              "abrasivity",
                              isAbrasivityValue(level.value) ? level.value : ""
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            active
                              ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)]/10 font-medium text-neutral-800"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                          }`}
                          style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-3 w-3 rounded-full border border-black/10"
                            style={{ backgroundColor: level.color }}
                          />
                          {level.label}
                          <span className="text-[10px] text-neutral-400">({level.tape})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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

              <div className="space-y-2 border-t border-neutral-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    PRESENTACIONES
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateVariants((prev) => [
                        ...prev,
                        { variantName: "", sku: "", price: form.basePrice, stock: "0", isActive: true, colorHex: "", sizeLabel: "", isLimitedEdition: false },
                      ])
                    }
                    className="text-[11px] font-medium text-[#c9a84c] hover:underline"
                  >
                    + Agregar presentación
                  </button>
                </div>
                {createVariants.length === 0 ? (
                  <p className="text-[11px] text-neutral-400">
                    Sin presentaciones — el producto usa el inventario inicial indicado arriba.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Nombre</th>
                          <th className="px-3 py-2 text-left font-medium">SKU</th>
                          <th className="px-3 py-2 text-left font-medium">Precio</th>
                          <th className="px-3 py-2 text-left font-medium">Stock</th>
                          <th className="px-3 py-2 text-left font-medium">Color</th>
                          <th className="px-3 py-2 text-left font-medium">Tamaño</th>
                          <th className="px-3 py-2 text-center font-medium">Ed. Lim.</th>
                          <th className="px-3 py-2 text-center font-medium">Activo</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {createVariants.map((v, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.variantName}
                                onChange={(e) => {
                                  clearCreateError(variantNameKey(idx))
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, variantName: e.target.value } : r)
                                  )
                                }}
                                className={`w-full min-w-[120px] rounded border bg-white px-2 py-1 text-xs outline-none ${createErrors[variantNameKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                placeholder="Ej. 5 ml jar"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) =>
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, sku: e.target.value } : r)
                                  )
                                }
                                className="w-full min-w-[80px] rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-mono outline-none focus:border-[#c9a84c]"
                                placeholder="Opcional"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={v.price}
                                onChange={(e) => {
                                  clearCreateError(variantPriceKey(idx))
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, price: e.target.value } : r)
                                  )
                                }}
                                className={`w-full min-w-[80px] rounded border bg-white px-2 py-1 text-xs outline-none ${createErrors[variantPriceKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={v.stock}
                                onChange={(e) => {
                                  clearCreateError(variantStockKey(idx))
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, stock: e.target.value } : r)
                                  )
                                }}
                                className={`w-full min-w-[60px] rounded border bg-white px-2 py-1 text-xs outline-none ${createErrors[variantStockKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={v.colorHex || "#000000"}
                                  onChange={(e) =>
                                    setCreateVariants((prev) =>
                                      prev.map((r, i) => i === idx ? { ...r, colorHex: e.target.value } : r)
                                    )
                                  }
                                  className="h-6 w-8 cursor-pointer rounded border border-neutral-200"
                                  title="Color de la bolita"
                                />
                                {v.colorHex ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCreateVariants((prev) =>
                                        prev.map((r, i) => i === idx ? { ...r, colorHex: "" } : r)
                                      )
                                    }
                                    className="text-[10px] text-neutral-400 hover:text-red-500"
                                    title="Quitar color"
                                  >
                                    ✕
                                  </button>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={v.sizeLabel}
                                onChange={(e) =>
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, sizeLabel: e.target.value } : r)
                                  )
                                }
                                className="w-full min-w-[70px] rounded border border-neutral-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#c9a84c]"
                                placeholder="13 ml"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={v.isLimitedEdition}
                                onChange={(e) =>
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, isLimitedEdition: e.target.checked } : r)
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={v.isActive}
                                onChange={(e) =>
                                  setCreateVariants((prev) =>
                                    prev.map((r, i) => i === idx ? { ...r, isActive: e.target.checked } : r)
                                  )
                                }
                                className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCreateVariants((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-red-400 hover:text-red-600 leading-none font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                    toast.error(msg)
                  }
                />
                {(() => {
                  const urls = form.imagesInput.split(",").map((u) => u.trim()).filter(Boolean)
                  if (urls.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {urls.map((url, idx) => (
                        <div key={idx} className="relative group shrink-0">
                          <button
                            type="button"
                            onClick={() => setLightbox({ images: urls, index: idx })}
                            aria-label="Ampliar imagen"
                            className="block cursor-zoom-in"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`imagen ${idx + 1}`}
                              className="h-14 w-14 rounded-lg border border-neutral-200 bg-neutral-100 object-contain"
                            />
                          </button>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  MODO DE IMAGEN EN PC
                </label>
                <select
                  value={form.desktopImageMode}
                  onChange={(event) =>
                    handleFormChange(
                      "desktopImageMode",
                      event.target.value as "carousel" | "hover"
                    )
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                >
                  <option value="carousel">Flechas + dots</option>
                  <option value="hover">Cambiar imagen al pasar mouse</option>
                </select>
                <p className="text-[11px] text-neutral-500">
                  El modo hover solo aplica cuando el producto tiene exactamente 2 imágenes.
                </p>
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
                      checked={form.isBestSeller}
                      onChange={(event) =>
                        handleFormChange("isBestSeller", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-neutral-300 focus:ring-[color:var(--brand-gold)]"
                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium text-[#c9a84c]">
                      ♥ BEST SELLER
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

          <section className={productsFullscreen
            ? "fixed inset-0 z-50 bg-white flex flex-col shadow-2xl"
            : "rounded-2xl bg-white shadow-sm border border-neutral-200/80 overflow-hidden flex flex-col"
          }>
            <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
                PRODUCTOS
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">
                  {hasActiveFilters
                    ? `${filteredProducts.length} de ${activeProducts.length} productos`
                    : `${activeProducts.length} productos activos`}
                </span>
                <button
                  type="button"
                  onClick={() => exportProductsToXls(activeProducts)}
                  disabled={activeProducts.length === 0}
                  title="Descargar inventario completo en Excel"
                  className="inline-flex items-center rounded-full bg-[#c9a84c] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Exportar a Excel
                </button>
                <button
                  type="button"
                  onClick={() => setProductsFullscreen((v) => !v)}
                  title={productsFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {productsFullscreen ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v2a1 1 0 01-2 0V5a3 3 0 013-3h2a1 1 0 010 2H5zm10 0h-2a1 1 0 010-2h2a3 3 0 013 3v2a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-2a1 1 0 012 0v2a3 3 0 01-3 3H3a1 1 0 010-2h2zm10 0h2a1 1 0 000-2h-2a1 1 0 01-1-1v-2a1 1 0 00-2 0v2a3 3 0 003 3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13 2a1 1 0 01-2 0v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 15H12a1 1 0 010-2h4a1 1 0 011 1v4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </header>

            <div className="border-b border-neutral-100 px-4 py-3 space-y-2 bg-neutral-50/60 shrink-0">
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

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnSale}
                    onChange={(e) => setFilterOnSale(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                  />
                  <span className="text-[11px] text-neutral-600">En oferta</span>
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

            {selectedProductIds.size > 0 && (
              <div className="border-b border-neutral-200 bg-[#fff8e7] px-4 py-3 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-800">
                    {selectedProductIds.size} seleccionado
                    {selectedProductIds.size === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
                  >
                    Limpiar selección
                  </button>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <label
                        htmlFor="bulk-discount-input"
                        className="text-[11px] font-medium uppercase tracking-wide text-neutral-600"
                      >
                        Descuento
                      </label>
                      <div className="relative">
                        <input
                          id="bulk-discount-input"
                          type="number"
                          min={1}
                          max={95}
                          step={1}
                          value={discountPercentInput}
                          onChange={(e) => setDiscountPercentInput(e.target.value)}
                          placeholder="0"
                          className="w-20 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 pr-7 text-xs outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">
                          %
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[10, 20, 30, 50].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDiscountPercentInput(String(preset))}
                            className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount || !discountPercentInput}
                      className="inline-flex items-center rounded-full bg-[#c9a84c] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {applyingDiscount ? "APLICANDO…" : "APLICAR DESCUENTO"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDiscount}
                      disabled={applyingDiscount}
                      className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 transition-colors hover:border-neutral-500 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      QUITAR DESCUENTO
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={productsFullscreen ? "overflow-x-auto overflow-y-auto flex-1" : "overflow-x-auto overflow-y-auto max-h-[760px]"}>
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-100 text-xs uppercase tracking-[0.16em]">
                  <tr className="border-b border-neutral-200">
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} px-4 w-10`}>
                      <input
                        type="checkbox"
                        aria-label={
                          allFilteredSelected
                            ? "Deseleccionar todos los productos visibles"
                            : "Seleccionar todos los productos visibles"
                        }
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected
                        }}
                        onChange={toggleSelectAllFiltered}
                        disabled={filteredProductIds.length === 0}
                        className="h-4 w-4 rounded border-neutral-300 accent-[#c9a84c]"
                      />
                    </th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} px-6`}>PRODUCTO</th>
                    <th className={PRODUCTS_TABLE_HEAD_CELL}>CÓDIGO</th>
                    <th className={PRODUCTS_TABLE_HEAD_CELL}>MARCA</th>
                    <th className={PRODUCTS_TABLE_HEAD_CELL}>CATEGORÍA</th>
                    <th className={PRODUCTS_TABLE_HEAD_CELL}>SUBCATEGORÍA</th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} text-right`}>P.COSTO</th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} text-right`}>P.VENTA</th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} text-right`}>P.MAYOREO</th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} text-center`}>STOCK</th>
                    <th className={PRODUCTS_TABLE_HEAD_CELL}>ESTADO</th>
                    <th className={`${PRODUCTS_TABLE_HEAD_CELL} text-right`}>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-8 text-center text-sm text-neutral-500"
                      >
                        {hasActiveFilters ? "Sin resultados para esta búsqueda." : "Aún no hay productos creados."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isEditing = editingId === product.id
                      const isSelected = selectedProductIds.has(product.id)
                      return (
                        <tr key={product.id} className={isSelected ? "bg-[#fff8e7]" : undefined}>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} px-4`}>
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar ${product.name}`}
                              checked={isSelected}
                              onChange={() => toggleProductSelected(product.id)}
                              className="h-4 w-4 rounded border-neutral-300 accent-[#c9a84c]"
                            />
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} px-6`}>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-neutral-900">
                                {product.name}
                              </p>
                              <p className="text-[11px] font-mono text-neutral-500">
                                /{product.slug}
                              </p>
                            </div>
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-xs font-mono text-neutral-600`}>
                            {product.sku ?? "—"}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-neutral-700`}>
                            {product.brand ?? "—"}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-neutral-700`}>
                            <div>{product.category.name}</div>
                            {product.abrasivity && (() => {
                              const level = ABRASIVITY_LEVELS.find(
                                (lvl) => lvl.value === product.abrasivity
                              )
                              if (!level) return null
                              return (
                                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-neutral-500">
                                  <span
                                    aria-hidden
                                    className="inline-block h-2 w-2 rounded-full border border-black/10"
                                    style={{ backgroundColor: level.color }}
                                  />
                                  {level.label}
                                </div>
                              )
                            })()}
                            <div className="mt-0.5 text-[10px] text-neutral-400">
                              Act. {formatProductUpdatedAt(product.updated_at)}
                            </div>
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-neutral-700`}>
                            {product.subcategory ? (
                              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                                {product.subcategory}
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-right text-neutral-600`}>
                            {product.cost_price !== null ? `$${product.cost_price.toFixed(2)}` : "—"}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-right font-medium text-neutral-900`}>
                            {(product.discount_percent ?? 0) > 0 ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[11px] text-neutral-400 line-through">
                                  ${product.base_price.toFixed(2)}
                                </span>
                                <span className="font-semibold text-[#c9a84c]">
                                  ${(
                                    product.base_price *
                                    (1 - product.discount_percent / 100)
                                  ).toFixed(2)}
                                </span>
                                <span className="rounded-full bg-[#c9a84c]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#7a6320]">
                                  -{product.discount_percent}%
                                </span>
                              </div>
                            ) : (
                              <>${product.base_price.toFixed(2)}</>
                            )}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-sm text-right text-neutral-600`}>
                            {product.wholesale_price !== null ? `$${product.wholesale_price.toFixed(2)}` : "—"}
                          </td>
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} text-center`}>
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
                          <td className={PRODUCTS_TABLE_BODY_CELL}>
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
                          <td className={`${PRODUCTS_TABLE_BODY_CELL} border-r-0`}>
                            <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    cancelEditing()
                                  } else {
                                    void startEditing(product)
                                  }
                                }}
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
                                {Object.keys(editErrors).length > 0 ? (
                                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold text-red-600">
                                      Faltan o son inválidos estos campos:
                                    </p>
                                    <ul className="mt-1 list-disc pl-5 text-[11px] text-red-600">
                                      {summarizeErrors(editErrors).map((label) => (
                                        <li key={label}>{label}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">NOMBRE</label>
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => handleEditFormChange("name", e.target.value)}
                                      className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 ${editErrors.name ? ERROR_BORDER : OK_BORDER}`}
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                    <FieldError message={editErrors.name} />
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
                                    <select
                                      value={editForm.subcategory}
                                      onChange={(e) => handleEditFormChange("subcategory", e.target.value)}
                                      disabled={!editForm.categoryId}
                                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-60"
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    >
                                      <option value="">
                                        {editForm.categoryId ? "Sin subcategoría" : "Selecciona primero una categoría"}
                                      </option>
                                      {subcategories
                                        .filter((sub) => sub.category_id === editForm.categoryId)
                                        .map((sub) => (
                                          <option key={sub.id} value={sub.name}>
                                            {sub.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                </div>

                                {isPuntasCategory(editForm.categoryId, categories) && (
                                  <div className="space-y-1">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                      ABRASIVIDAD <span className="text-neutral-400">(cinta de color)</span>
                                    </label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleEditFormChange("abrasivity", "")}
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                          editForm.abrasivity === ""
                                            ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)]/10 font-medium text-neutral-800"
                                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                        }`}
                                        style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      >
                                        Sin clasificar
                                      </button>
                                      {ABRASIVITY_LEVELS.map((level) => {
                                        const active = editForm.abrasivity === level.value
                                        return (
                                          <button
                                            key={level.value}
                                            type="button"
                                            onClick={() =>
                                              handleEditFormChange(
                                                "abrasivity",
                                                isAbrasivityValue(level.value) ? level.value : ""
                                              )
                                            }
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                              active
                                                ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)]/10 font-medium text-neutral-800"
                                                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                            }`}
                                            style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                          >
                                            <span
                                              aria-hidden
                                              className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                                              style={{ backgroundColor: level.color }}
                                            />
                                            {level.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

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
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">APLICACIÓN / TAMAÑO</label>
                                  <textarea
                                    value={editForm.applicationText}
                                    onChange={(e) => handleEditFormChange("applicationText", e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    placeholder="Cómo aplicar, pasos, presentación…"
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

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">SINÓNIMOS DE BÚSQUEDA</label>
                                  <textarea
                                    value={editForm.searchSynonyms}
                                    onChange={(e) => handleEditFormChange("searchSynonyms", e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    placeholder="barniz, pintauñas, polish — separa con comas"
                                  />
                                  <p className="text-[10px] text-neutral-500">
                                    Palabras alternativas para el buscador. No se muestra en la tienda.
                                  </p>
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
                                      className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 ${editErrors.basePrice ? ERROR_BORDER : OK_BORDER}`}
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    />
                                    <FieldError message={editErrors.basePrice} />
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
                                      onChange={(e) => {
                                        const nextCategoryId = e.target.value
                                        handleEditFormChange("categoryId", nextCategoryId)
                                        if (editForm.subcategory) handleEditFormChange("subcategory", "")
                                        if (
                                          editForm.abrasivity &&
                                          !isPuntasCategory(nextCategoryId, categories)
                                        ) {
                                          handleEditFormChange("abrasivity", "")
                                        }
                                      }}
                                      className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 ${editErrors.categoryId ? ERROR_BORDER : OK_BORDER}`}
                                      style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                    >
                                      <option value="">Selecciona</option>
                                      {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                      ))}
                                    </select>
                                    <FieldError message={editErrors.categoryId} />
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

                                <div className="space-y-2 border-t border-neutral-100 pt-3">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-medium tracking-wide text-neutral-600">PRESENTACIONES</label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditVariants((prev) => [
                                          ...prev,
                                          { variantName: "", sku: "", price: editForm.basePrice, stock: "0", isActive: true, colorHex: "", sizeLabel: "", isLimitedEdition: false },
                                        ])
                                      }
                                      className="text-[11px] font-medium text-[#c9a84c] hover:underline"
                                    >
                                      + Agregar
                                    </button>
                                  </div>
                                  {loadingVariants ? (
                                    <p className="text-[11px] text-neutral-400">Cargando presentaciones…</p>
                                  ) : editVariants.filter((v) => !v._toDelete).length === 0 ? (
                                    <p className="text-[11px] text-neutral-400">Sin presentaciones definidas.</p>
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-neutral-200">
                                      <table className="min-w-full text-xs">
                                        <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                                          <tr>
                                            <th className="px-2 py-1.5 text-left font-medium">Nombre</th>
                                            <th className="px-2 py-1.5 text-left font-medium">SKU</th>
                                            <th className="px-2 py-1.5 text-left font-medium">Precio</th>
                                            <th className="px-2 py-1.5 text-left font-medium">Stock</th>
                                            <th className="px-2 py-1.5 text-left font-medium">Color</th>
                                            <th className="px-2 py-1.5 text-left font-medium">Tamaño</th>
                                            <th className="px-2 py-1.5 text-center font-medium">Ed.Lim.</th>
                                            <th className="px-2 py-1.5 text-center font-medium">Activo</th>
                                            <th className="px-2 py-1.5" />
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                          {editVariants.map((v, idx) => {
                                            if (v._toDelete) return null
                                            return (
                                              <tr key={idx}>
                                                <td className="px-2 py-1.5">
                                                  <input
                                                    type="text"
                                                    value={v.variantName}
                                                    onChange={(e) => {
                                                      clearEditError(variantNameKey(idx))
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, variantName: e.target.value } : r)
                                                      )
                                                    }}
                                                    className={`w-full min-w-[100px] rounded border bg-white px-2 py-1 text-xs outline-none ${editErrors[variantNameKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                                    placeholder="Ej. 5 ml jar"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <input
                                                    type="text"
                                                    value={v.sku}
                                                    onChange={(e) =>
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, sku: e.target.value } : r)
                                                      )
                                                    }
                                                    className="w-full min-w-[70px] rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-mono outline-none focus:border-[#c9a84c]"
                                                    placeholder="Opcional"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={v.price}
                                                    onChange={(e) => {
                                                      clearEditError(variantPriceKey(idx))
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, price: e.target.value } : r)
                                                      )
                                                    }}
                                                    className={`w-full min-w-[70px] rounded border bg-white px-2 py-1 text-xs outline-none ${editErrors[variantPriceKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                                    placeholder="0.00"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={v.stock}
                                                    onChange={(e) => {
                                                      clearEditError(variantStockKey(idx))
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, stock: e.target.value } : r)
                                                      )
                                                    }}
                                                    className={`w-full min-w-[55px] rounded border bg-white px-2 py-1 text-xs outline-none ${editErrors[variantStockKey(idx)] ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-[#c9a84c]"}`}
                                                    placeholder="0"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <input
                                                      type="color"
                                                      value={v.colorHex || "#000000"}
                                                      onChange={(e) =>
                                                        setEditVariants((prev) =>
                                                          prev.map((r, i) => i === idx ? { ...r, colorHex: e.target.value } : r)
                                                        )
                                                      }
                                                      className="h-6 w-8 cursor-pointer rounded border border-neutral-200"
                                                      title="Color de la bolita"
                                                    />
                                                    {v.colorHex ? (
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          setEditVariants((prev) =>
                                                            prev.map((r, i) => i === idx ? { ...r, colorHex: "" } : r)
                                                          )
                                                        }
                                                        className="text-[10px] text-neutral-400 hover:text-red-500"
                                                        title="Quitar color"
                                                      >
                                                        ✕
                                                      </button>
                                                    ) : null}
                                                  </div>
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <input
                                                    type="text"
                                                    value={v.sizeLabel}
                                                    onChange={(e) =>
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, sizeLabel: e.target.value } : r)
                                                      )
                                                    }
                                                    className="w-full min-w-[60px] rounded border border-neutral-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#c9a84c]"
                                                    placeholder="13 ml"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5 text-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={v.isLimitedEdition}
                                                    onChange={(e) =>
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, isLimitedEdition: e.target.checked } : r)
                                                      )
                                                    }
                                                    className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5 text-center">
                                                  <input
                                                    type="checkbox"
                                                    checked={v.isActive}
                                                    onChange={(e) =>
                                                      setEditVariants((prev) =>
                                                        prev.map((r, i) => i === idx ? { ...r, isActive: e.target.checked } : r)
                                                      )
                                                    }
                                                    className="h-3.5 w-3.5 rounded border-neutral-300 accent-[#c9a84c]"
                                                  />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (v.id) {
                                                        setEditVariants((prev) =>
                                                          prev.map((r, i) => i === idx ? { ...r, _toDelete: true } : r)
                                                        )
                                                      } else {
                                                        setEditVariants((prev) => prev.filter((_, i) => i !== idx))
                                                      }
                                                    }}
                                                    className="text-red-400 hover:text-red-600 leading-none font-bold"
                                                  >
                                                    ✕
                                                  </button>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">IMÁGENES</label>
                                  <ImageUploader
                                    compact
                                    onUpload={(url) => {
                                      const current = editForm.imagesInput.trim()
                                      handleEditFormChange("imagesInput", current ? `${current}, ${url}` : url)
                                    }}
                                    onError={(msg) => toast.error(msg)}
                                  />
                                  {(() => {
                                    const urls = editForm.imagesInput.split(",").map((u) => u.trim()).filter(Boolean)
                                    if (urls.length === 0) return null
                                    return (
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {urls.map((url, idx) => (
                                          <div key={idx} className="relative group shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setLightbox({ images: urls, index: idx })}
                                              aria-label="Ampliar imagen"
                                              className="block cursor-zoom-in"
                                            >
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={url}
                                                alt={`imagen ${idx + 1}`}
                                                className="h-12 w-12 rounded-lg border border-neutral-200 bg-neutral-100 object-contain"
                                              />
                                            </button>
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

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium tracking-wide text-neutral-600">
                                    MODO DE IMAGEN EN PC
                                  </label>
                                  <select
                                    value={editForm.desktopImageMode}
                                    onChange={(e) =>
                                      handleEditFormChange(
                                        "desktopImageMode",
                                        e.target.value as "carousel" | "hover"
                                      )
                                    }
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                  >
                                    <option value="carousel">Flechas + dots</option>
                                    <option value="hover">Cambiar imagen al pasar mouse</option>
                                  </select>
                                  <p className="text-[10px] text-neutral-500">
                                    El modo hover solo se usa en desktop y con exactamente 2 imágenes.
                                  </p>
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
                                        checked={editForm.isBestSeller}
                                        onChange={(e) => handleEditFormChange("isBestSeller", e.target.checked)}
                                        className="h-4 w-4 rounded border-neutral-300 focus:ring-[color:var(--brand-gold)]"
                                        style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                                      />
                                      <span className="text-[11px] font-medium text-[#c9a84c]">♥ BEST SELLER</span>
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

        <section className={categoriesFullscreen
          ? "fixed inset-0 z-50 bg-white flex flex-col shadow-2xl mt-0"
          : "mt-8 rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
        }>
          <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              GESTIONAR CATEGORÍAS
            </h2>
            <button
              type="button"
              onClick={() => setCategoriesFullscreen((v) => !v)}
              title={categoriesFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              {categoriesFullscreen ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v2a1 1 0 01-2 0V5a3 3 0 013-3h2a1 1 0 010 2H5zm10 0h-2a1 1 0 010-2h2a3 3 0 013 3v2a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-2a1 1 0 012 0v2a3 3 0 01-3 3H3a1 1 0 010-2h2zm10 0h2a1 1 0 000-2h-2a1 1 0 01-1-1v-2a1 1 0 00-2 0v2a3 3 0 003 3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13 2a1 1 0 01-2 0v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 15H12a1 1 0 010-2h4a1 1 0 011 1v4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </header>

          <div className={categoriesFullscreen
            ? "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch flex-1 overflow-auto"
            : "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch"
          }>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (editingCategory) {
                  void handleSaveCategory()
                } else {
                  void handleCreateCategory(event)
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  {editingCategory ? "EDITAR CATEGORÍA" : "NUEVA CATEGORÍA"}
                </label>
                <input
                  type="text"
                  value={editingCategory ? editCategoryName : categoryName}
                  onChange={(event) =>
                    editingCategory
                      ? setEditCategoryName(event.target.value)
                      : setCategoryName(event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Ej. Acrílico"
                />
                <p className="text-[11px] text-neutral-500">
                  El slug se genera automáticamente a partir del nombre.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={editingCategory ? savingCategory : categorySubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingCategory
                    ? savingCategory ? "GUARDANDO..." : "GUARDAR CAMBIOS"
                    : categorySubmitting ? "CREANDO..." : "CREAR CATEGORÍA"}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelEditCategory}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-neutral-600 uppercase transition-colors hover:bg-neutral-50"
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>

            <div className={categoriesFullscreen
              ? "overflow-auto rounded-xl border border-neutral-200 h-full"
              : "overflow-auto rounded-xl border border-neutral-200 max-h-[280px]"
            }>
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
                      const isEditing = editingCategory?.id === category.id
                      const canDelete = category.productCount === 0
                      return (
                        <tr
                          key={category.id}
                          className={isEditing ? "bg-amber-50/60" : undefined}
                        >
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
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(category)}
                                disabled={isDeleting}
                                className="text-xs font-semibold text-[#c9a84c] transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                EDITAR
                              </button>
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
                            </div>
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

        <section className={subcategoriesFullscreen
          ? "fixed inset-0 z-50 bg-white flex flex-col shadow-2xl mt-0"
          : "mt-8 rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
        }>
          <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              GESTIONAR SUBCATEGORÍAS
            </h2>
            <button
              type="button"
              onClick={() => setSubcategoriesFullscreen((v) => !v)}
              title={subcategoriesFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              {subcategoriesFullscreen ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v2a1 1 0 01-2 0V5a3 3 0 013-3h2a1 1 0 010 2H5zm10 0h-2a1 1 0 010-2h2a3 3 0 013 3v2a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-2a1 1 0 012 0v2a3 3 0 01-3 3H3a1 1 0 010-2h2zm10 0h2a1 1 0 000-2h-2a1 1 0 01-1-1v-2a1 1 0 00-2 0v2a3 3 0 003 3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13 2a1 1 0 01-2 0v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 15H12a1 1 0 010-2h4a1 1 0 011 1v4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </header>

          <div className={subcategoriesFullscreen
            ? "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch flex-1 overflow-auto"
            : "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch"
          }>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (editingSubcategory) {
                  void handleSaveSubcategory()
                } else {
                  void handleCreateSubcategory(event)
                }
              }}
              className="space-y-3"
            >
              {!editingSubcategory && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium tracking-wide text-neutral-600">
                    CATEGORÍA PADRE
                  </label>
                  <select
                    value={subcategoryCategoryId}
                    onChange={(event) => setSubcategoryCategoryId(event.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                    style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  {editingSubcategory ? "EDITAR SUBCATEGORÍA" : "NUEVA SUBCATEGORÍA"}
                </label>
                <input
                  type="text"
                  value={editingSubcategory ? editSubcategoryName : subcategoryName}
                  onChange={(event) =>
                    editingSubcategory
                      ? setEditSubcategoryName(event.target.value)
                      : setSubcategoryName(event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="Ej. Puntas Diamante"
                />
                <p className="text-[11px] text-neutral-500">
                  El slug se genera automáticamente. Renombrar también actualiza los productos asociados.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={editingSubcategory ? savingSubcategory : subcategorySubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingSubcategory
                    ? savingSubcategory ? "GUARDANDO..." : "GUARDAR CAMBIOS"
                    : subcategorySubmitting ? "CREANDO..." : "CREAR SUBCATEGORÍA"}
                </button>
                {editingSubcategory && (
                  <button
                    type="button"
                    onClick={handleCancelEditSubcategory}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-neutral-600 uppercase transition-colors hover:bg-neutral-50"
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>

            <div className={subcategoriesFullscreen
              ? "overflow-auto rounded-xl border border-neutral-200 h-full"
              : "overflow-auto rounded-xl border border-neutral-200 max-h-[280px]"
            }>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">NOMBRE</th>
                    <th className="px-4 py-3 font-semibold">CATEGORÍA</th>
                    <th className="px-4 py-3 font-semibold text-center">PRODUCTOS</th>
                    <th className="px-4 py-3 font-semibold text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {subcategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500">
                        No hay subcategorías registradas.
                      </td>
                    </tr>
                  ) : (
                    subcategories.map((sub) => {
                      const isDeleting = deletingSubcategoryId === sub.id
                      const isEditing = editingSubcategory?.id === sub.id
                      const canDelete = sub.productCount === 0
                      return (
                        <tr key={sub.id} className={isEditing ? "bg-amber-50/60" : undefined}>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            {sub.name}
                            <div className="text-[11px] font-mono text-neutral-400">
                              {sub.slug}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {sub.category_name}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-700">
                            {sub.productCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditSubcategory(sub)}
                                disabled={isDeleting}
                                className="text-xs font-semibold text-[#c9a84c] transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                EDITAR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubcategory(sub)}
                                disabled={!canDelete || isDeleting}
                                className="text-xs font-semibold text-red-600 transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                title={
                                  canDelete
                                    ? "Eliminar subcategoría"
                                    : "No se puede eliminar: tiene productos asociados"
                                }
                              >
                                {isDeleting ? "ELIMINANDO..." : "ELIMINAR"}
                              </button>
                            </div>
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

        <section className={brandsFullscreen
          ? "fixed inset-0 z-50 bg-white flex flex-col shadow-2xl mt-0"
          : "mt-8 rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
        }>
          <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-neutral-500">
              GESTIONAR MARCAS
            </h2>
            <button
              type="button"
              onClick={() => setBrandsFullscreen((v) => !v)}
              title={brandsFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              {brandsFullscreen ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v2a1 1 0 01-2 0V5a3 3 0 013-3h2a1 1 0 010 2H5zm10 0h-2a1 1 0 010-2h2a3 3 0 013 3v2a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 16a1 1 0 001-1v-2a1 1 0 012 0v2a3 3 0 01-3 3H3a1 1 0 010-2h2zm10 0h2a1 1 0 000-2h-2a1 1 0 01-1-1v-2a1 1 0 00-2 0v2a3 3 0 003 3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13 2a1 1 0 01-2 0v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 15H12a1 1 0 010-2h4a1 1 0 011 1v4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </header>

          <div className={brandsFullscreen
            ? "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch flex-1 overflow-auto"
            : "grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch"
          }>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (editingBrand) {
                  void handleSaveBrand()
                } else {
                  void handleCreateBrand()
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-medium tracking-wide text-neutral-600">
                  {editingBrand ? "EDITAR MARCA" : "NUEVA MARCA"}
                </label>
                <input
                  type="text"
                  value={editingBrand ? editBrandName : brandName}
                  onChange={(event) =>
                    editingBrand
                      ? setEditBrandName(event.target.value)
                      : setBrandName(event.target.value)
                  }
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
                  onUpload={(url) => {
                    if (editingBrand) {
                      setEditBrandLogoUrl(url)
                      if (!editBrandShowOnHomeTouched) {
                        setEditBrandShowOnHome(url.trim().length > 0)
                      }
                      return
                    }

                    setBrandLogoUrl(url)
                    if (!brandShowOnHomeTouched) {
                      setBrandShowOnHome(url.trim().length > 0)
                    }
                  }}
                  onError={(msg) =>
                    toast.error(msg)
                  }
                />
                <input
                  type="text"
                  value={editingBrand ? editBrandLogoUrl : brandLogoUrl}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    if (editingBrand) {
                      setEditBrandLogoUrl(nextValue)
                      if (!editBrandShowOnHomeTouched) {
                        setEditBrandShowOnHome(nextValue.trim().length > 0)
                      }
                      return
                    }

                    setBrandLogoUrl(nextValue)
                    if (!brandShowOnHomeTouched) {
                      setBrandShowOnHome(nextValue.trim().length > 0)
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs outline-none focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold)]"
                  style={{ "--brand-gold": BRAND_GOLD } as React.CSSProperties}
                  placeholder="O pega URL del logo"
                />
              </div>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingBrand ? editBrandShowOnHome : brandShowOnHome}
                  onChange={(event) => {
                    if (editingBrand) {
                      setEditBrandShowOnHomeTouched(true)
                      setEditBrandShowOnHome(event.target.checked)
                      return
                    }
                    setBrandShowOnHomeTouched(true)
                    setBrandShowOnHome(event.target.checked)
                  }}
                  className="h-4 w-4 rounded border-neutral-300 accent-[#c9a84c]"
                />
                <span className="text-xs font-medium text-neutral-700">
                  Mostrar en sección de marcas de home
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={editingBrand ? savingBrand : brandSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#c9a84c] px-5 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#a8893a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingBrand
                    ? savingBrand ? "GUARDANDO..." : "GUARDAR CAMBIOS"
                    : brandSubmitting ? "CREANDO..." : "CREAR MARCA"}
                </button>
                {editingBrand && (
                  <button
                    type="button"
                    onClick={handleCancelEditBrand}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-neutral-600 uppercase transition-colors hover:bg-neutral-50"
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>

            <div className={brandsFullscreen
              ? "overflow-auto rounded-xl border border-neutral-200 h-full"
              : "overflow-auto rounded-xl border border-neutral-200 max-h-[280px]"
            }>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">MARCA</th>
                    <th className="px-4 py-3 font-semibold">SLUG</th>
                    <th className="px-4 py-3 font-semibold text-center">HOME</th>
                    <th className="px-4 py-3 font-semibold text-center">PRODUCTOS</th>
                    <th className="px-4 py-3 font-semibold text-right">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {brands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-500">
                        No hay marcas registradas.
                      </td>
                    </tr>
                  ) : (
                    brands.map((brand) => {
                      const isDeleting = deletingBrandId === brand.id
                      const isEditing = editingBrand?.id === brand.id
                      const canDelete = brand.productCount === 0
                      return (
                        <tr
                          key={brand.id}
                          className={isEditing ? "bg-amber-50/60" : undefined}
                        >
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
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => void toggleBrandShowOnHome(brand)}
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                                brand.show_on_home
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                              }`}
                            >
                              {brand.show_on_home ? "VISIBLE" : "OCULTA"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-700">
                            {brand.productCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditBrand(brand)}
                                disabled={isDeleting}
                                className="text-xs font-semibold text-[#c9a84c] transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                EDITAR
                              </button>
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
                            </div>
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

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">
              {confirmState.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Detectamos valores poco comunes. Revísalos antes de continuar:
            </p>
            <ul className="mt-3 max-h-52 list-disc overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-[13px] text-amber-800">
              {confirmState.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Revisar de nuevo
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className="rounded-full bg-[#0a0a0a] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
              >
                Sí, guardar de todas formas
              </button>
            </div>
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

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

