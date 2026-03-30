/**
 * Seed script: categorías + productos + variantes para Liz Cabriales
 *
 * PREREQUISITO — ejecutar este SQL en Supabase antes de correr el script
 * si la columna brand todavía no existe en products:
 *
 *   ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
 *
 * USO:
 *   npx ts-node --project tsconfig.scripts.json scripts/seed-products.ts
 */

import * as fs from "fs"
import * as path from "path"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Cargar variables de entorno desde .env.local sin dependencia de dotenv
// ---------------------------------------------------------------------------
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env.local no encontrado — se usarán las variables de entorno del sistema.")
    return
  }
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

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

/** Convierte texto a slug kebab-case sin acentos. */
function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Genera un SKU en formato MARCA-NOMBRE-001 (mayúsculas, sin acentos).
 * Ejemplo: ("Exotic", "Vitral Color Azul") → "EXOTIC-VITRAL-COLOR-AZUL-001"
 */
function toSku(brand: string, name: string): string {
  return toSlug(`${brand}-${name}`).toUpperCase() + "-001"
}

// ---------------------------------------------------------------------------
// Tipos internos del seed
// ---------------------------------------------------------------------------

interface CategorySeed {
  name: string
  slug: string
}

interface ProductSeed {
  name: string
  brand: string
  category_slug: string
  base_price: number
}

// ---------------------------------------------------------------------------
// Datos: categorías
// ---------------------------------------------------------------------------

const CATEGORIES: CategorySeed[] = [
  { name: "Esmaltes y Colores",      slug: "esmaltes-colores" },
  { name: "Geles y Acrílicos",       slug: "geles-acrilicos" },
  { name: "Herramientas y Equipos",  slug: "herramientas-equipos" },
  { name: "Podología",               slug: "podologia" },
  { name: "Pestañas",                slug: "pestanas" },
  { name: "Insumos y Accesorios",    slug: "insumos-accesorios" },
]

// ---------------------------------------------------------------------------
// Datos: productos
// ---------------------------------------------------------------------------

const PRODUCTS: ProductSeed[] = [
  // Esmaltes y Colores
  { name: "Vitral Color Azul",                   brand: "Exotic",                category_slug: "esmaltes-colores", base_price: 90 },
  { name: "Vitral Color Rojo",                   brand: "Exotic",                category_slug: "esmaltes-colores", base_price: 90 },
  { name: "Vitral Color Naranja",                brand: "Exotic",                category_slug: "esmaltes-colores", base_price: 90 },
  { name: "Vitral Color Verde",                  brand: "Exotic",                category_slug: "esmaltes-colores", base_price: 90 },
  { name: "Vitral Color Rosa",                   brand: "Exotic",                category_slug: "esmaltes-colores", base_price: 90 },
  { name: "Esmalte Semipermanente French",       brand: "Golden Nails",          category_slug: "esmaltes-colores", base_price: 120 },
  { name: "Esmalte en Gel Top Coat",             brand: "Miss Nails",            category_slug: "esmaltes-colores", base_price: 110 },

  // Geles y Acrílicos
  { name: "Gel Constructor Transparente",        brand: "Antartico Nail System", category_slug: "geles-acrilicos", base_price: 280 },
  { name: "Acrílico Natural",                    brand: "Manikure Pro",          category_slug: "geles-acrilicos", base_price: 250 },
  { name: "Soft Gel Extension Kit",              brand: "Liunails",              category_slug: "geles-acrilicos", base_price: 450 },
  { name: "Gel Moldeador Rosa",                  brand: "DNS",                   category_slug: "geles-acrilicos", base_price: 220 },
  { name: "Dual System Base Coat",               brand: "Cardone",               category_slug: "geles-acrilicos", base_price: 190 },

  // Herramientas y Equipos
  { name: "Removedor de callos inalámbrico Lovely Baby Pink", brand: "Lovely",  category_slug: "herramientas-equipos", base_price: 890 },
  { name: "Lima eléctrica profesional",          brand: "Manikure Pro",          category_slug: "herramientas-equipos", base_price: 650 },
  { name: "Lámpara UV/LED 48W",                  brand: "Golden Nails",          category_slug: "herramientas-equipos", base_price: 380 },
  { name: "Set brochas nail art 5 piezas",       brand: "Nghia",                 category_slug: "herramientas-equipos", base_price: 290 },
  { name: "Alicates para cutícula",              brand: "Nghia",                 category_slug: "herramientas-equipos", base_price: 180 },

  // Podología
  { name: "Fixonic 5.0 tratamiento Onicomicosis", brand: "Clear ZaI",           category_slug: "podologia", base_price: 320 },
  { name: "Kit Quiropodia básico",               brand: "Podocare",              category_slug: "podologia", base_price: 550 },
  { name: "Plantillas pedicure profesional",     brand: "Podocare",              category_slug: "podologia", base_price: 95 },
  { name: "Crema podológica reparadora",         brand: "Podocare",              category_slug: "podologia", base_price: 140 },

  // Insumos y Accesorios
  { name: "Removedor acetona premium",           brand: "Mia Secret",            category_slug: "insumos-accesorios", base_price: 85 },
  { name: "Papel transfer nail art",             brand: "Lúa",                   category_slug: "insumos-accesorios", base_price: 75 },
  { name: "Primer ácido profesional",            brand: "Manikure Pro",          category_slug: "insumos-accesorios", base_price: 160 },
  { name: "Polvo acrílico blanco French",        brand: "Mia Secret",            category_slug: "insumos-accesorios", base_price: 210 },
]

// ---------------------------------------------------------------------------
// Funciones de seed
// ---------------------------------------------------------------------------

async function seedCategories(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  console.log("\n📂  Sembrando categorías...")

  const { data, error } = await supabase
    .from("categories")
    .upsert(CATEGORIES, { onConflict: "slug" })
    .select("id, slug")

  if (error) {
    throw new Error(`Error al insertar categorías: ${error.message}`)
  }

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.slug as string, row.id as string)
  }

  console.log(`   ✅  ${map.size} categorías listas.`)
  return map
}

async function seedProducts(
  supabase: SupabaseClient,
  categoryMap: Map<string, string>
): Promise<void> {
  console.log("\n🛍️   Sembrando productos y variantes...")

  const productsPayload = PRODUCTS.map((p) => {
    const categoryId = categoryMap.get(p.category_slug)
    if (!categoryId) {
      throw new Error(
        `Categoría no encontrada para slug: "${p.category_slug}" (producto: "${p.name}")`
      )
    }
    return {
      name:        p.name,
      slug:        toSlug(p.name),
      brand:       p.brand,
      category_id: categoryId,
      base_price:  p.base_price,
      is_active:   true,
      is_featured: false,
    }
  })

  const { data: insertedProducts, error: prodError } = await supabase
    .from("products")
    .upsert(productsPayload, { onConflict: "slug" })
    .select("id, slug, name, base_price, brand")

  if (prodError) {
    // Mensaje de ayuda si falta la columna brand
    if (prodError.message.includes("brand")) {
      console.error("\n❌  Error relacionado con la columna 'brand'.")
      console.error("   Ejecuta primero este SQL en Supabase:")
      console.error("   ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;\n")
    }
    throw new Error(`Error al insertar productos: ${prodError.message}`)
  }

  console.log(`   ✅  ${insertedProducts?.length ?? 0} productos listos.`)

  // Construir variantes
  const originalMap = new Map<string, ProductSeed>()
  for (const p of PRODUCTS) {
    originalMap.set(toSlug(p.name), p)
  }

  const variantsPayload = (insertedProducts ?? []).map((row) => {
    const original = originalMap.get(row.slug as string)!
    return {
      product_id:   row.id as string,
      sku:          toSku(original.brand, original.name),
      variant_name: "Estándar",
      price:        row.base_price as number,
      stock:        10,
      is_active:    true,
    }
  })

  const { data: insertedVariants, error: varError } = await supabase
    .from("product_variants")
    .upsert(variantsPayload, { onConflict: "sku" })
    .select("id, sku")

  if (varError) {
    throw new Error(`Error al insertar variantes: ${varError.message}`)
  }

  console.log(`   ✅  ${insertedVariants?.length ?? 0} variantes listas.`)

  // Resumen por categoría
  console.log("\n📊  Resumen por categoría:")
  const byCategory = new Map<string, number>()
  for (const p of PRODUCTS) {
    byCategory.set(p.category_slug, (byCategory.get(p.category_slug) ?? 0) + 1)
  }
  for (const [slug, count] of byCategory.entries()) {
    console.log(`   ${slug}: ${count} producto(s)`)
  }
}

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvLocal()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y " +
        "SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "⚠️  Usando ANON KEY — si RLS está activo el seed puede fallar.\n" +
        "   Agrega SUPABASE_SERVICE_ROLE_KEY en .env.local para evitarlo."
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  console.log("🚀  Iniciando seed de Liz Cabriales...\n")

  const categoryMap = await seedCategories(supabase)
  await seedProducts(supabase, categoryMap)

  console.log("\n🎉  Seed completado correctamente.\n")
}

main().catch((err) => {
  console.error("\n❌  El seed falló:", (err as Error).message)
  process.exit(1)
})
