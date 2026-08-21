/**
 * Reescribe el `cacheControl` de los objetos que ya están en el bucket `images`.
 *
 * Contexto: los uploads se hicieron con `cacheControl: "3600"`, así que cada
 * imagen se cae del CDN de Cloudflare cada hora. Como el sitio corre con
 * `images.unoptimized: true` (para no quemar el límite de transformaciones de
 * Vercel Hobby), no hay ninguna capa de caché intermedia: al expirar, el
 * navegador pega directo al origen de Supabase, y ese origen necesita una
 * conexión a Postgres para resolver cada objeto público. Una página como
 * /academia carga ~108 imágenes; la primera visita de cada hora dispara esa
 * misma cantidad de golpes al origen. Con la base saturada, las que pierden la
 * carrera salen rotas — de ahí las imágenes que fallan distinto en cada recarga.
 *
 * Los nombres ya son inmutables (`<timestamp>-<random>.<ext>`, todos subidos
 * con `upsert: false`), así que cachearlos un año es seguro: una imagen nueva
 * siempre estrena ruta. El código de subida ya quedó en 31536000; esto es la
 * corrección de datos para lo que se subió antes.
 *
 * NO toca el bucket `invoice-docs`: esos sí se suben con `upsert: true`,
 * reescriben la misma ruta, y un año de caché serviría documentos viejos.
 *
 * La API de Storage no permite cambiar solo el metadata, así que por cada
 * objeto hay que bajarlo y volver a subirlo con `update()`. Es pesado, y por
 * eso va con concurrencia baja: la idea es arreglar el origen, no tumbarlo.
 * Se puede cortar y reanudar — salta lo que ya tiene el cache largo.
 *
 * Uso:
 *   node --env-file=.env.local scripts/recache-storage-objects.mjs --dry
 *   node --env-file=.env.local scripts/recache-storage-objects.mjs --apply
 *   node --env-file=.env.local scripts/recache-storage-objects.mjs --apply --folder products
 */

import { createClient } from "@supabase/supabase-js"

const BUCKET = "images"
const TARGET = "31536000"
/** Bajo a propósito: el origen de Supabase es justo lo que está sufriendo. */
const CONCURRENCY = 3
const PAGE_SIZE = 100

/** Carpetas del bucket `images` (misma lista blanca que el endpoint de subida). */
const FOLDERS = [
  "products",
  "courses",
  "courses-gallery",
  "instructors",
  "professionals",
  "hero",
  "landing",
  "home-spotlight",
  "events",
  "brands",
  "nail-art",
  "blog",
  "services",
]

/** Corta el proceso si el origen empieza a fallar en cadena. */
const MAX_FALLOS_SEGUIDOS = 15

const args = process.argv.slice(2)
const apply = args.includes("--apply")

let folders = FOLDERS
if (args.includes("--folder")) {
  const folderArg = args[args.indexOf("--folder") + 1]
  if (!folderArg || !FOLDERS.includes(folderArg)) {
    console.error(
      `--folder necesita una de estas carpetas: ${FOLDERS.join(", ")}`
    )
    process.exit(1)
  }
  folders = [folderArg]
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`

/** `metadata.cacheControl` viene como "max-age=3600". */
function needsUpdate(entry) {
  const raw = entry.metadata?.cacheControl ?? ""
  const match = raw.match(/max-age=(\d+)/)
  const current = match ? parseInt(match[1], 10) : 0
  return current < parseInt(TARGET, 10)
}

async function listFolder(folder) {
  const out = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db.storage
      .from(BUCKET)
      .list(folder, { limit: PAGE_SIZE, offset })
    if (error) throw new Error(`listando ${folder}: ${error.message}`)
    if (!data || data.length === 0) break
    // Las carpetas vienen sin `metadata`; aquí no hay anidamiento real.
    out.push(...data.filter((e) => e.metadata))
    if (data.length < PAGE_SIZE) break
  }
  return out.map((e) => ({ ...e, path: `${folder}/${e.name}` }))
}

const EXT_TO_MIME = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
}

/**
 * El Content-Type con el que se vuelve a subir. Se respeta el que ya tenía el
 * objeto; solo si falta se deduce de la extensión. Adivinar "webp" por defecto
 * reetiquetaría los JPEG de products/ y events/, que son la mayoría del bucket.
 */
function contentTypeOf(entry) {
  const declared = entry.metadata?.mimetype
  if (declared) return declared
  const ext = entry.path.split(".").pop()?.toLowerCase()
  return EXT_TO_MIME[ext] ?? "application/octet-stream"
}

async function recache(entry) {
  const { data: blob, error: dlError } = await db.storage
    .from(BUCKET)
    .download(entry.path)
  if (dlError) throw new Error(`bajando: ${dlError.message}`)

  const bytes = Buffer.from(await blob.arrayBuffer())

  const { error: upError } = await db.storage
    .from(BUCKET)
    .update(entry.path, bytes, {
      cacheControl: TARGET,
      upsert: true,
      contentType: contentTypeOf(entry),
    })
  if (upError) throw new Error(`subiendo: ${upError.message}`)

  return bytes.length
}

/** Corre `worker` sobre `items` con como mucho `CONCURRENCY` en vuelo. */
async function pool(items, worker) {
  let cursor = 0
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      await worker(items[i], i)
    }
  })
  await Promise.all(runners)
}

async function main() {
  let pending = []
  let alreadyOk = 0

  for (const folder of folders) {
    const entries = await listFolder(folder)
    const need = entries.filter(needsUpdate)
    alreadyOk += entries.length - need.length
    pending.push(...need)
    console.log(
      `${folder.padEnd(18)} ${String(entries.length).padStart(4)} objetos · ` +
        `${String(need.length).padStart(4)} por corregir`
    )
  }

  const totalBytes = pending.reduce((a, e) => a + (e.metadata?.size ?? 0), 0)
  console.log(
    `\nTotal: ${pending.length} por corregir, ${alreadyOk} ya en cache largo.`
  )
  console.log(`Hay que mover ${mb(totalBytes)} (bajar + volver a subir).`)

  if (!apply) {
    console.log("\n(dry run — no se tocó nada. Repite con --apply.)")
    return
  }

  let done = 0
  let failed = 0
  let seguidos = 0
  let abortado = false

  await pool(pending, async (entry) => {
    if (abortado) return
    try {
      await recache(entry)
      done += 1
      seguidos = 0
      if (done % 25 === 0) console.log(`  ${done}/${pending.length}…`)
    } catch (err) {
      failed += 1
      seguidos += 1
      console.error(`  FALLO ${entry.path}: ${err.message}`)
      // La instancia es nano y ya se cayó una vez. Si empieza a fallar en
      // cadena, insistir sobre los ~1,600 restantes solo la hunde más y
      // quema egress en descargas que no sirven. Mejor cortar y reanudar.
      if (seguidos >= MAX_FALLOS_SEGUIDOS) abortado = true
    }
  })

  if (abortado) {
    console.log(
      `\nCortado: ${MAX_FALLOS_SEGUIDOS} fallos seguidos. El origen no está respondiendo bien.`
    )
  }
  console.log(`\nCorregidos: ${done}. Fallidos: ${failed}.`)
  if (failed > 0 || abortado) {
    console.log("Vuelve a correrlo: salta lo que ya quedó bien.")
  }
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`)
  process.exit(1)
})
