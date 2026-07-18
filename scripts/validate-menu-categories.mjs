/**
 * Valida que el menú de la tienda (app/components/navbar/menuData.ts) siga
 * cuadrando con los datos reales de Supabase:
 *
 *   1. Todo slug de categoría que el menú usa (categorySlugs) existe en BD.
 *   2. Toda categoría de BD con productos activos está cubierta por el menú
 *      (si no, se "pierde": nadie la puede navegar).
 *   3. Todo link `?subcategoria=X` del menú matchea la subcategoría real de
 *      al menos un producto activo (slugify(products.subcategory) === X) y
 *      además ese producto vive en alguna de las categorías del link.
 *
 * Uso:  node scripts/validate-menu-categories.mjs
 * Sale con código 1 si encuentra problemas (útil para CI).
 */
import { readFileSync } from "fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` }

// Misma lógica que lib/slug.ts (duplicada aquí para no depender de TS).
function slugifyText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// --- 1. Slugs de categoría que usa el menú (arrays categorySlugs) ---
const menuSrc = readFileSync("app/components/navbar/menuData.ts", "utf8")
const menuSlugs = new Set()
for (const m of menuSrc.matchAll(/categorySlugs:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/"([^"]+)"/g)) menuSlugs.add(s[1])
}

// --- 1b. Links de subcategoría: pares (categorias, subcategoria) ---
const menuSubLinks = []
for (const m of menuSrc.matchAll(
  /categoria=([a-z0-9,-]+)&(?:amp;)?subcategoria=([a-z0-9-]+)/g
)) {
  menuSubLinks.push({ cats: m[1].split(","), sub: m[2] })
}

// --- 2. Datos reales ---
const cats = await fetch(`${URL}/rest/v1/categories?select=id,name,slug`, {
  headers: h,
}).then((r) => r.json())
const dbSlugs = new Map(cats.map((c) => [c.slug, c.name]))
const idToSlug = Object.fromEntries(cats.map((c) => [c.id, c.slug]))

const prods = await fetch(
  `${URL}/rest/v1/products?select=category_id,subcategory&is_active=eq.true&deleted_at=is.null`,
  { headers: h }
).then((r) => r.json())

const activeCount = {}
// catSlug -> Set(subSlug) de productos reales
const subsByCat = new Map()
for (const p of prods) {
  const s = idToSlug[p.category_id]
  if (!s) continue
  activeCount[s] = (activeCount[s] || 0) + 1
  if (p.subcategory?.trim()) {
    if (!subsByCat.has(s)) subsByCat.set(s, new Set())
    subsByCat.get(s).add(slugifyText(p.subcategory))
  }
}

// --- Reporte ---
const brokenCats = [...menuSlugs].filter((s) => !dbSlugs.has(s))
const orphanCats = [...dbSlugs.keys()].filter(
  (s) => (activeCount[s] || 0) > 0 && !menuSlugs.has(s)
)
const brokenSubs = menuSubLinks.filter(
  ({ cats: linkCats, sub }) =>
    !linkCats.some((c) => subsByCat.get(c)?.has(sub))
)

console.log(
  `Menú: ${menuSlugs.size} categorías + ${menuSubLinks.length} links de subcategoría · BD: ${dbSlugs.size} categorías\n`
)

let bad = false
if (brokenCats.length) {
  bad = true
  console.log("❌ SLUGS DE CATEGORÍA DEL MENÚ QUE NO EXISTEN EN BD:")
  for (const s of brokenCats) console.log("   - " + s)
  console.log("")
}
if (orphanCats.length) {
  bad = true
  console.log("⚠️  CATEGORÍAS DE BD CON PRODUCTOS QUE EL MENÚ NO INCLUYE (se pierden):")
  for (const s of orphanCats.sort((a, b) => (activeCount[b] || 0) - (activeCount[a] || 0)))
    console.log(`   - ${s} ("${dbSlugs.get(s)}") · ${activeCount[s]} productos`)
  console.log("")
}
if (brokenSubs.length) {
  bad = true
  console.log("❌ SUBCATEGORÍAS DEL MENÚ SIN PRODUCTOS QUE LAS MATCHEEN (filtro daría vacío):")
  for (const { cats: linkCats, sub } of brokenSubs)
    console.log(`   - subcategoria=${sub} (en categoria=${linkCats.join(",")})`)
  console.log("")
}

if (!bad) {
  console.log(
    "✅ Todo cuadra: categorías cubiertas, sin links rotos y toda subcategoría del menú filtra productos reales."
  )
  process.exit(0)
}
process.exit(1)
