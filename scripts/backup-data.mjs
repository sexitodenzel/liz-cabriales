/**
 * Respaldo de los datos a archivos JSON locales.
 *
 * Por qué existe: el proyecto está en el plan **free** de Supabase, que **no
 * incluye backups**. Es una tienda en vivo con órdenes, clientes y citas; si la
 * base se corrompe o alguien borra de más, hoy no hay de dónde volver. Esto
 * tapa ese hueco sin pagar nada, hasta que se contrate un plan con backups.
 *
 * Qué respalda y qué NO:
 *  - SÍ: los datos de todas las tablas expuestas por PostgREST (52 al escribir
 *    esto), que es la parte irremplazable.
 *  - NO: esquema, políticas RLS, funciones, triggers ni los archivos del bucket
 *    de Storage. El esquema ya vive versionado en docs/delivery/sql/*.sql.
 *
 * Para un respaldo completo de verdad (esquema + datos) hace falta pg_dump, que
 * en esta máquina no está instalado. Con el CLI, y la contraseña de la base que
 * se saca del dashboard (Settings → Database), sería:
 *
 *   npx supabase db dump --project-ref qlvslouwkiemsjkggdqq -p "<password>" -f respaldo.sql
 *
 * Uso:
 *   node --env-file=.env.local scripts/backup-data.mjs
 *   node --env-file=.env.local scripts/backup-data.mjs --out D:/respaldos
 *
 * Escribe en backups/<fecha-hora>/ un JSON por tabla más un _resumen.json.
 * La carpeta backups/ está en .gitignore: son datos de clientes, no van al repo.
 */

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const PAGE = 1000
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Corre con: node --env-file=.env.local scripts/backup-data.mjs"
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const outArg = args.includes("--out") ? args[args.indexOf("--out") + 1] : null
if (args.includes("--out") && !outArg) {
  console.error("--out necesita una ruta de carpeta.")
  process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }

/** Sella la carpeta con la fecha local, para poder ordenar respaldos a ojo. */
function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `_${p(d.getHours())}${p(d.getMinutes())}`
  )
}

/** Las tablas no se hardcodean: se leen del spec de PostgREST. */
async function listTables() {
  const res = await fetch(`${url}/rest/v1/`, { headers })
  if (!res.ok) throw new Error(`No se pudo leer el catálogo (${res.status})`)
  const spec = await res.json()
  const defs = spec.definitions ?? spec.components?.schemas ?? {}
  return Object.keys(defs).sort()
}

/** PostgREST tope 1000 filas por respuesta, así que se pagina con Range. */
async function fetchAll(table) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${url}/rest/v1/${encodeURIComponent(table)}?select=*`,
      { headers: { ...headers, Range: `${from}-${from + PAGE - 1}` } }
    )
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`.slice(0, 120))
    const chunk = await res.json()
    rows.push(...chunk)
    if (chunk.length < PAGE) break
  }
  return rows
}

async function main() {
  const dir = join(outArg ?? "backups", stamp())
  mkdirSync(dir, { recursive: true })

  const tables = await listTables()
  console.log(`${tables.length} tablas · destino: ${dir}\n`)

  const resumen = {}
  let totalFilas = 0
  const fallidas = []

  for (const table of tables) {
    try {
      const rows = await fetchAll(table)
      writeFileSync(
        join(dir, `${table}.json`),
        JSON.stringify(rows, null, 2),
        "utf8"
      )
      resumen[table] = rows.length
      totalFilas += rows.length
      console.log(`  ${table.padEnd(32)} ${String(rows.length).padStart(6)} filas`)
    } catch (err) {
      fallidas.push({ tabla: table, error: err.message })
      console.error(`  ${table.padEnd(32)} FALLÓ: ${err.message}`)
    }
  }

  writeFileSync(
    join(dir, "_resumen.json"),
    JSON.stringify(
      { fecha: new Date().toISOString(), proyecto: url, tablas: resumen, fallidas },
      null,
      2
    ),
    "utf8"
  )

  console.log(`\n${totalFilas} filas en ${tables.length - fallidas.length} tablas.`)
  if (fallidas.length > 0) {
    // No se sale con error: un respaldo parcial vale más que ninguno, pero
    // tiene que quedar claro que está incompleto.
    console.log(`ATENCIÓN: ${fallidas.length} tabla(s) fallaron, el respaldo está incompleto.`)
    for (const f of fallidas) console.log(`  - ${f.tabla}: ${f.error}`)
  }
  console.log(`\nGuardado en: ${dir}`)
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`)
  process.exit(1)
})
