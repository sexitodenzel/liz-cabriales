"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-compress"
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"
import { BLOG_CATEGORIES, DEFAULT_BLOG_CATEGORY } from "@/lib/blog-categories"

type ProductOption = {
  id: string
  name: string
  slug: string
  images: string[] | null
}

type LinkedProductRow = {
  _key: string
  product: ProductOption
  usage_description: string
}

export type BlogFormData = {
  title: string
  slug: string
  category: string
  excerpt: string
  cover_image: string
  body: string
  is_active: boolean
  sort_order: number
  products: Array<{
    product_id: string
    usage_description: string
    sort_order: number
  }>
}

type Props = {
  initialData?: Partial<BlogFormData> & { id?: string }
  onSave: (data: BlogFormData) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  )
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function BlogForm({ initialData, onSave, onCancel, saving }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [category, setCategory] = useState(initialData?.category ?? DEFAULT_BLOG_CATEGORY)
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "")
  const [body, setBody] = useState(initialData?.body ?? "")
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0)
  const [linkedProducts, setLinkedProducts] = useState<LinkedProductRow[]>(() =>
    (initialData?.products ?? []).map((p, i) => ({
      _key: `init-${i}`,
      product: { id: p.product_id, name: "", slug: "", images: null },
      usage_description: p.usage_description,
    }))
  )

  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<ProductOption[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = Boolean(initialData?.id)

  useEffect(() => {
    if (!isEdit) {
      setSlug(slugify(title))
    }
  }, [title, isEdit])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSearchChange(val: string) {
    setSearchQ(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!val.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/blog/products?q=${encodeURIComponent(val)}`)
        const resBody = await res.json()
        setSearchResults(resBody.data ?? [])
        setSearchOpen(true)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function handleSelectProduct(product: ProductOption) {
    const alreadyAdded = linkedProducts.some((lp) => lp.product.id === product.id)
    if (alreadyAdded) {
      setSearchOpen(false)
      setSearchQ("")
      return
    }
    setLinkedProducts((prev) => [
      ...prev,
      { _key: `${product.id}-${Date.now()}`, product, usage_description: "" },
    ])
    setSearchOpen(false)
    setSearchQ("")
    setSearchResults([])
  }

  function handleRemoveProduct(key: string) {
    setLinkedProducts((prev) => prev.filter((lp) => lp._key !== key))
  }

  function handleUsageChange(key: string, val: string) {
    setLinkedProducts((prev) =>
      prev.map((lp) => (lp._key === key ? { ...lp, usage_description: val } : lp))
    )
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setCoverError(null)
    setUploadingCover(true)
    try {
      const compressed = await compressImage(file)
      const supabase = createClient()
      const ext = (compressed.name.split(".").pop() ?? "jpg").toLowerCase()
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, compressed, { cacheControl: "3600", upsert: false, contentType: compressed.type || undefined })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("images").getPublicUrl(path)
      if (!data?.publicUrl) throw new Error("No se pudo obtener la URL.")
      setCoverImage(data.publicUrl)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Error al subir la imagen.")
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "El título es requerido"
    if (!slug.trim()) errs.slug = "El slug es requerido"
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    await onSave({
      title: title.trim(),
      slug: slug.trim(),
      category,
      excerpt,
      cover_image: coverImage,
      body,
      is_active: isActive,
      sort_order: sortOrder,
      products: linkedProducts.map((lp, i) => ({
        product_id: lp.product.id,
        usage_description: lp.usage_description,
        sort_order: i,
      })),
    })
  }

  const inputClass = "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-[#c9a84c] focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-neutral-600">Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. 5 tips para que tu esmaltado dure más"
          className={inputClass}
        />
        {errors.title && <p className="text-[11px] text-red-500">{errors.title}</p>}
      </div>

      {/* Slug + Categoría */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-neutral-600">Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tips-esmaltado-duradero"
            className={inputClass}
          />
          {errors.slug && <p className="text-[11px] text-red-500">{errors.slug}</p>}
          <p className="text-[11px] text-neutral-400">URL: /blog/<strong>{slug || "…"}</strong></p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-neutral-600">Categoría *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {BLOG_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Extracto */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-neutral-600">Extracto</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Resumen corto que sale en la tarjeta y al inicio del artículo…"
          className={`${inputClass} resize-none`}
        />
        <p className="text-[11px] text-neutral-400">{excerpt.length}/300</p>
      </div>

      {/* Imagen de portada */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-semibold text-neutral-600">Imagen de portada</label>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        <div className="flex items-start gap-4">
          <div
            className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-neutral-100 cursor-pointer"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="Portada" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-neutral-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Spinner />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[12px] font-medium text-neutral-700 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-50"
            >
              {uploadingCover ? <><Spinner /> Subiendo…</> : (coverImage ? "Cambiar imagen" : "Subir imagen")}
            </button>
            <p className="text-[11px] text-neutral-400">Recomendado: 1200×800 px (3:2)</p>
          </div>
        </div>
        {coverError && <p className="text-[11px] text-red-500">{coverError}</p>}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-neutral-600">Cuerpo del artículo</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder={`Escribe aquí el contenido del post.

## Un subtítulo
- Un punto importante
- Otro punto

Un párrafo normal con **palabras en negrita**.`}
          className={`${inputClass} resize-y`}
        />
        <p className="text-[11px] text-neutral-400">
          Usa <code className="rounded bg-neutral-100 px-1">## Título</code> para
          secciones, <code className="rounded bg-neutral-100 px-1">- </code> al
          inicio de un renglón para viñetas y{" "}
          <code className="rounded bg-neutral-100 px-1">**texto**</code> para
          negritas.
        </p>
      </div>

      {/* Productos */}
      <div className="flex flex-col gap-3">
        <label className="text-[12px] font-semibold text-neutral-600">Productos relacionados (opcional)</label>

        {/* Buscador */}
        <div ref={searchRef} className="relative">
          <div className="relative flex items-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 h-4 w-4 text-neutral-400" aria-hidden>
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar producto de la tienda…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-[#c9a84c] focus:outline-none"
            />
            {searching && (
              <div className="absolute right-3"><Spinner /></div>
            )}
          </div>

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-neutral-300" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-neutral-700">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          {searchOpen && searchResults.length === 0 && !searching && searchQ.trim() && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-[12px] text-neutral-400">Sin resultados para «{searchQ}»</p>
            </div>
          )}
        </div>

        {/* Lista de productos seleccionados */}
        {linkedProducts.length > 0 && (
          <div className="flex flex-col gap-3">
            {linkedProducts.map((lp) => (
              <div key={lp._key} className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                  {lp.product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lp.product.images[0]} alt={lp.product.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-neutral-300" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <span className="text-[12px] font-semibold text-neutral-700 truncate">{lp.product.name}</span>
                  <input
                    type="text"
                    value={lp.usage_description}
                    onChange={(e) => handleUsageChange(lp._key, e.target.value)}
                    placeholder="¿Por qué lo recomiendas? (opcional)"
                    className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-700 placeholder:text-neutral-400 focus:border-[#c9a84c] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(lp._key)}
                  className="mt-0.5 shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`Quitar ${lp.product.name}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-neutral-600">Orden</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
            className={inputClass}
          />
          <p className="text-[11px] text-neutral-400">Menor número aparece primero</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-neutral-600">Estado</label>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
              isActive
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-500"
            }`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-neutral-300"}`} />
            {isActive ? "Publicado" : "Borrador"}
          </button>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEdit ? "Guardar cambios" : "Crear publicación"}
        </button>
        {saving && (
          <AnimatedBadge status="loading" size="md">
            Guardando
          </AnimatedBadge>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-200 px-5 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-800"
        >
          Cancelar
        </button>
      </div>

    </form>
  )
}
