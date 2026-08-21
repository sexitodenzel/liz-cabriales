/**
 * Lógica compartida para importar catálogos de marcas (Drive → Supabase) como
 * borrador (is_active: false). Usado por scripts/import-<marca>.ts.
 */

import * as fs from "fs"
import * as path from "path"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

export function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, "utf-8")
  for (const raw of content.split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eqIdx = line.indexOf("=")
    if (eqIdx === -1) continue
    const key = line.slice(0, eqIdx).trim()
    const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}

export function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function toSku(brand: string, name: string): string {
  return toSlug(`${brand}-${name}`).toUpperCase() + "-001"
}

export type ItemVariant = {
  colorName?: string
  /** Si se omite, usa el price del Item. */
  price?: number
  /** Existencia real reportada por el catálogo. "Agotado" en la fuente = 0. */
  stock: number
}

export type Item = {
  name: string
  categorySlug: string
  price: number
  /**
   * Existencia real para el caso de UNA sola variante (sin color).
   * Si se omite y tampoco hay `variants`, se usa un placeholder de 10.
   */
  stock?: number
  /** Varias variantes (colores) bajo el mismo producto — mismo precio o precio por variante. */
  variants?: ItemVariant[]
  /**
   * Presentación tal como venía en el catálogo ("4 pz", "1 pz").
   *
   * OJO: hoy NO se persiste. Los catálogos ya lo traen capturado, pero no
   * existe columna `pack` en products y este importador no lo lee, así que el
   * dato se queda en el archivo fuente y no llega a la base. Está declarado
   * para que los catálogos compilen sin perder el dato de vista; cuando se
   * quiera mostrar, hace falta la migración y leerlo en buildProductRow().
   */
  pack?: string
  /** null/omitido cuando el catálogo original no traía texto de descripción. */
  description?: string | null
  longDescription?: string
  applicationText?: string
  imageDriveId?: string
  /** Varias fotos (ej. galería de colores) — se suman a `imageDriveId` si ambos están presentes. */
  imageDriveIds?: string[]
  isBestSeller?: boolean
  /**
   * Sobreescribe la marca por defecto — para carpetas de Drive que mezclan
   * varias marcas reales. Pasa `null` explícito para productos genéricos
   * sin marca (no usa el fallback del lote).
   */
  brand?: string | null
}

async function downloadDriveImage(fileId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const url = `https://lh3.googleusercontent.com/d/${fileId}=w1600`
  const res = await fetch(url)
  if (!res.ok) return null
  const contentType = res.headers.get("content-type") || "image/jpeg"
  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), contentType }
}

async function uploadProductImage(
  supabase: SupabaseClient,
  fileId: string,
  productSlug: string
): Promise<string | null> {
  const downloaded = await downloadDriveImage(fileId)
  if (!downloaded) return null

  const ext = downloaded.contentType.includes("png") ? "png" : "jpg"
  const uploadPath = `products/${productSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from("images").upload(uploadPath, downloaded.buffer, {
    cacheControl: "31536000",
    upsert: false,
    contentType: downloaded.contentType,
  })
  if (error) {
    console.warn(`   ⚠️  No se pudo subir imagen para ${productSlug}: ${error.message}`)
    return null
  }

  const { data } = supabase.storage.from("images").getPublicUrl(uploadPath)
  return data?.publicUrl ?? null
}

export async function importBrand(brand: string, slugPrefix: string, items: Item[]): Promise<void> {
  loadEnvLocal()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local")
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  console.log(`🚀  Import ${brand} (borrador, is_active=false)\n`)

  const { data: categories, error: catError } = await supabase.from("categories").select("id, slug")
  if (catError) throw new Error(`Error leyendo categorías: ${catError.message}`)

  const categoryMap = new Map<string, string>()
  for (const c of categories ?? []) categoryMap.set(c.slug as string, c.id as string)

  const missingCategories = [...new Set(items.map((i) => i.categorySlug))].filter((s) => !categoryMap.has(s))
  if (missingCategories.length > 0) {
    throw new Error(`Categorías inexistentes: ${missingCategories.join(", ")}. Aborta sin insertar nada.`)
  }

  let ok = 0
  let withImage = 0
  let failed = 0

  for (const item of items) {
    const effectiveBrand = item.brand === null ? null : item.brand ?? brand
    const slugBrandPart = item.brand === null ? "generico" : item.brand ?? slugPrefix
    const slug = toSlug(`${slugBrandPart}-${item.name}`)
    try {
      const driveIds = [item.imageDriveId, ...(item.imageDriveIds ?? [])].filter(
        (id): id is string => Boolean(id)
      )
      const imageUrls: string[] = []
      for (const driveId of driveIds) {
        const url = await uploadProductImage(supabase, driveId, slug)
        if (url) imageUrls.push(url)
      }
      if (imageUrls.length > 0) withImage++

      const { data: product, error: prodError } = await supabase
        .from("products")
        .upsert(
          {
            name: item.name,
            slug,
            brand: effectiveBrand,
            category_id: categoryMap.get(item.categorySlug),
            base_price: item.price,
            description: item.description ?? null,
            long_description: item.longDescription ?? null,
            application_text: item.applicationText ?? null,
            images: imageUrls.length > 0 ? imageUrls : null,
            is_active: false,
            is_featured: false,
            is_best_seller: Boolean(item.isBestSeller),
          },
          { onConflict: "slug" }
        )
        .select("id, slug")
        .single()

      if (prodError || !product) {
        console.error(`   ❌  ${item.name}: ${prodError?.message}`)
        failed++
        continue
      }

      const variantSpecs: ItemVariant[] =
        item.variants && item.variants.length > 0
          ? item.variants
          : [{ stock: item.stock ?? 10 }]

      let variantsFailed = false
      for (let i = 0; i < variantSpecs.length; i++) {
        const vSpec = variantSpecs[i]
        const skuBase = vSpec.colorName ? `${item.name}-${vSpec.colorName}` : item.name
        const sku = toSku(effectiveBrand ?? slugBrandPart, skuBase)

        const { error: varError } = await supabase.from("product_variants").upsert(
          {
            product_id: product.id,
            sku,
            variant_name: vSpec.colorName ?? "Estándar",
            color_name: vSpec.colorName ?? null,
            price: vSpec.price ?? item.price,
            stock: vSpec.stock,
            is_active: true,
          },
          { onConflict: "sku" }
        )

        if (varError) {
          console.error(`   ❌  Variante ${item.name} (${vSpec.colorName ?? "única"}): ${varError.message}`)
          variantsFailed = true
        }
      }

      if (variantsFailed) {
        failed++
        continue
      }

      const variantSummary = variantSpecs.length > 1 ? ` [${variantSpecs.length} variantes]` : ""
      const imageSummary = imageUrls.length > 0 ? ` (${imageUrls.length} foto${imageUrls.length > 1 ? "s" : ""})` : " (sin imagen)"
      console.log(`   ✅  ${item.name}${imageSummary}${variantSummary}`)
      ok++
    } catch (err) {
      console.error(`   ❌  ${item.name}: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\n📊  ${brand} — Total: ${items.length} | OK: ${ok} | con imagen: ${withImage} | fallidos: ${failed}`)
}
