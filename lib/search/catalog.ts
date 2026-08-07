import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import { getPublishedCourses } from "@/lib/supabase/courses"
import {
  getAllBrandsFullCached,
  getAllProductsCached,
  getCategoriesCached,
  getServicesCached,
} from "@/lib/supabase/cache"
import { prepareDocs, type PreparedDoc, type SearchDoc } from "./engine"
import { productToSearchDoc } from "./product-doc"

/**
 * Índice único del sitio: productos, cursos, servicios, categorías,
 * subcategorías, marcas y secciones. Se arma UNA vez y se cachea; el ranking
 * corre en memoria, así el autocompletado no pega a la base en cada tecla.
 */

const BODY_MAX_CHARS = 400

function db() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function plainText(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function clampBody(...parts: Array<string | null | undefined>): string {
  const joined = parts.map(plainText).filter(Boolean).join(" ")
  return joined.length > BODY_MAX_CHARS
    ? joined.slice(0, BODY_MAX_CHARS)
    : joined
}

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
]

/** "2026-09-12" → "12 sep 2026" sin depender de zona horaria. */
function formatCourseDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return `${day} ${MONTHS_SHORT[month - 1] ?? ""} ${year}`.trim()
}

const COURSE_LEVEL_LABEL: Record<string, string> = {
  beginner: "principiante básico",
  intermediate: "intermedio",
  advanced: "avanzado experto",
  open: "abierto",
}

/* ── Sinónimos por producto (columna opcional) ───────────────────────────── */

async function loadProductSynonyms(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const { data, error } = await db()
      .from("products")
      .select("id, search_synonyms")
      .not("search_synonyms", "is", null)
    // 42703: la columna aún no existe en este entorno → se ignora sin romper.
    if (error) return map
    for (const row of (data ?? []) as Array<{ id: string; search_synonyms: string | null }>) {
      if (row.search_synonyms?.trim()) map.set(row.id, row.search_synonyms)
    }
  } catch {
    return map
  }
  return map
}

/* ── Subcategorías ───────────────────────────────────────────────────────── */

type SubcategoryRow = {
  id: string
  name: string
  slug: string
  category: { slug: string; name: string } | { slug: string; name: string }[] | null
}

async function loadSubcategories(): Promise<SubcategoryRow[]> {
  try {
    const { data, error } = await db()
      .from("subcategories")
      .select("id, name, slug, category:categories(slug, name)")
    if (error) return []
    return (data ?? []) as unknown as SubcategoryRow[]
  } catch {
    return []
  }
}

/* ── Secciones fijas del sitio ───────────────────────────────────────────── */

const SITE_PAGES: Array<{
  id: string
  title: string
  href: string
  keywords: string
}> = [
  { id: "page-tienda", title: "Tienda", href: "/tienda", keywords: "catalogo productos comprar" },
  { id: "page-ofertas", title: "Ofertas", href: "/tienda/ofertas", keywords: "descuentos promociones rebajas sale barato" },
  { id: "page-mas-vendidos", title: "Más vendidos", href: "/tienda/mas-vendidos", keywords: "populares top favoritos best sellers" },
  { id: "page-nuevos", title: "Nuevos ingresos", href: "/tienda/nuevos", keywords: "novedades recien llegados lanzamientos" },
  { id: "page-academia", title: "Academia", href: "/academia", keywords: "cursos talleres capacitacion diplomados clases" },
  { id: "page-servicios", title: "Servicios del estudio", href: "/servicios", keywords: "manicura pedicura unas salon estudio" },
  { id: "page-agendar", title: "Agendar cita", href: "/servicios/agendar", keywords: "reservar apartar cita horario calendario" },
  { id: "page-marcas", title: "Marcas", href: "/marcas", keywords: "catalogo marcas proveedores" },
  { id: "page-nail-art", title: "Nail Art", href: "/nail-art", keywords: "disenos inspiracion galeria arte" },
  { id: "page-blog", title: "Blog", href: "/blog", keywords: "articulos tips consejos notas" },
  { id: "page-sobre-liz", title: "Conócenos", href: "/sobre-liz", keywords: "sobre liz cabriales historia quienes somos" },
  { id: "page-wishlist", title: "Favoritos", href: "/wishlist", keywords: "wishlist guardados lista deseos" },
  { id: "page-pedidos", title: "Mis pedidos", href: "/perfil/pedidos", keywords: "ordenes compras rastreo envio seguimiento" },
  { id: "page-citas", title: "Mis citas", href: "/perfil/servicios", keywords: "reservaciones agenda appointments" },
]

/* ── Construcción del índice ─────────────────────────────────────────────── */

async function buildSearchDocs(): Promise<SearchDoc[]> {
  const [
    productsRes,
    categoriesRes,
    brandsRes,
    coursesRes,
    servicesRes,
    synonyms,
    subcategories,
  ] = await Promise.all([
    getAllProductsCached(),
    getCategoriesCached(),
    getAllBrandsFullCached(),
    getPublishedCourses(),
    getServicesCached(),
    loadProductSynonyms(),
    loadSubcategories(),
  ])

  const docs: SearchDoc[] = []

  /* Productos */
  for (const product of productsRes.data ?? []) {
    docs.push(
      productToSearchDoc(product, {
        id: `product:${product.id}`,
        synonyms: synonyms.get(product.id) ?? "",
        body: clampBody(
          product.description,
          product.long_description,
          product.application_text
        ),
      })
    )
  }

  /* Categorías */
  for (const category of categoriesRes.data ?? []) {
    docs.push({
      id: `category:${category.id}`,
      type: "category",
      title: category.name,
      subtitle: null,
      href: `/tienda?categoria=${category.slug}`,
      image: null,
      price: null,
      originalPrice: null,
      discountPercent: 0,
      meta: "Categoría",
      keywords: `categoria tienda ${category.slug.replace(/-/g, " ")}`,
      body: "",
      boost: 1,
    })
  }

  /* Subcategorías */
  for (const sub of subcategories) {
    const parent = Array.isArray(sub.category) ? sub.category[0] : sub.category
    if (!parent?.slug) continue
    docs.push({
      id: `subcategory:${sub.id}`,
      type: "category",
      title: sub.name,
      subtitle: parent.name ?? null,
      href: `/tienda?categoria=${parent.slug}&subcategoria=${sub.slug}`,
      image: null,
      price: null,
      originalPrice: null,
      discountPercent: 0,
      meta: parent.name ? `En ${parent.name}` : "Categoría",
      keywords: `categoria ${parent.name ?? ""} ${sub.slug.replace(/-/g, " ")}`,
      body: "",
      boost: 0.98,
    })
  }

  /* Marcas */
  for (const brand of brandsRes.data ?? []) {
    docs.push({
      id: `brand:${brand.id}`,
      type: "brand",
      title: brand.name,
      subtitle: null,
      href: `/tienda?marca=${encodeURIComponent(brand.name)}`,
      image: brand.logo_url ?? null,
      price: null,
      originalPrice: null,
      discountPercent: 0,
      meta: "Marca",
      keywords: `marca ${brand.slug?.replace(/-/g, " ") ?? ""}`,
      // Sin descripción a propósito: varias marcas mencionan "cursos" o
      // "manicura" en su texto y aparecían como sugerencia de cualquier cosa.
      body: "",
      boost: 1,
    })
  }

  /* Cursos */
  const today = new Date().toISOString().slice(0, 10)
  for (const course of coursesRes.data ?? []) {
    const upcoming = course.start_date >= today
    const teachers = [
      course.instructor?.name ?? "",
      ...course.co_instructors.map((i) => i.name),
      ...course.co_organizers.map((i) => i.name),
    ]
      .filter(Boolean)
      .join(" ")
    docs.push({
      id: `course:${course.id}`,
      type: "course",
      title: course.title,
      subtitle: course.instructor?.name ?? null,
      href: `/academia/${course.id}`,
      image: course.cover_image ?? course.images?.[0]?.image_url ?? null,
      price: course.show_price_public ? course.price : null,
      originalPrice: null,
      discountPercent: 0,
      meta: `${formatCourseDate(course.start_date)}${
        course.location ? ` · ${course.location}` : ""
      }`,
      keywords: [
        "curso taller capacitacion academia",
        teachers,
        COURSE_LEVEL_LABEL[course.level] ?? "",
        course.location ?? "",
        (course.highlights ?? []).join(" "),
        course.diploma_included ? "diploma certificado" : "",
      ]
        .filter(Boolean)
        .join(" "),
      body: clampBody(course.short_description, course.description),
      boost: upcoming ? 1.15 : 0.75,
    })
  }

  /* Servicios */
  for (const service of servicesRes.data ?? []) {
    const parts: string[] = []
    if (!service.hide_duration_public && service.duration_min) {
      parts.push(`${service.duration_min} min`)
    }
    if (service.filter_name) parts.push(service.filter_name)
    docs.push({
      id: `service:${service.id}`,
      type: "service",
      title: service.name,
      subtitle: service.filter_name ?? null,
      href: `/servicios/agendar?servicio=${encodeURIComponent(service.id)}`,
      image: service.image_url ?? null,
      price: service.hide_price_public ? null : service.price,
      originalPrice: null,
      discountPercent: 0,
      meta: parts.join(" · ") || "Servicio",
      keywords: [
        "servicio cita estudio agendar",
        service.filter_name ?? "",
        service.filter_slug?.replace(/-/g, " ") ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      body: clampBody(service.description),
      boost: 1.05,
    })
  }

  /* Secciones del sitio */
  for (const page of SITE_PAGES) {
    docs.push({
      id: page.id,
      type: "page",
      title: page.title,
      subtitle: null,
      href: page.href,
      image: null,
      price: null,
      originalPrice: null,
      discountPercent: 0,
      meta: "Sección",
      keywords: page.keywords,
      body: "",
      boost: 0.9,
    })
  }

  return docs
}

const getSearchDocsCached = unstable_cache(buildSearchDocs, ["search-index-v1"], {
  revalidate: 120,
  tags: ["products", "categories", "brands", "services", "courses"],
})

/**
 * Memo de proceso: evita re-normalizar el índice completo en cada request
 * dentro de la misma instancia caliente. La ventana es corta para que un
 * `revalidateTag` desde el panel se refleje enseguida.
 */
const MEMO_TTL_MS = 30_000
let memo: { at: number; prepared: PreparedDoc[] } | null = null

export async function getSearchIndex(): Promise<PreparedDoc[]> {
  const now = Date.now()
  if (memo && now - memo.at < MEMO_TTL_MS) return memo.prepared
  const docs = await getSearchDocsCached()
  const prepared = prepareDocs(docs)
  memo = { at: now, prepared }
  return prepared
}
