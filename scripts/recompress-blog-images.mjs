/**
 * Recomprime las imágenes del Blog que entraron sin pasar por el compresor.
 *
 * Los 5 posts se cargaron en bloque desde el Word, así que sus imágenes se
 * subieron crudas: son los únicos JPEG del sitio (todo lo demás es WebP) y
 * sumaban ~1 MB solo en el collage "Tips y tendencias" del home. El panel
 * (`app/admin/blog/BlogForm.tsx`) sí comprime al subir, así que esto es una
 * corrección de datos de una sola vez, no un arreglo de código.
 *
 * NO sobrescribe: sube la versión comprimida como objeto nuevo y reapunta la
 * columna. El original se queda en el bucket, así que revertir es volver a
 * poner la URL vieja (el mapeo queda en docs/perf/blog-images-<fecha>.json).
 *
 * Uso:
 *   node --env-file=.env.local scripts/recompress-blog-images.mjs --dry
 *   node --env-file=.env.local scripts/recompress-blog-images.mjs --apply
 */

import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { mkdirSync, writeFileSync } from "node:fs"

const BUCKET = "images"
const MAX_EDGE = 1400
const WEBP_QUALITY = 82
/** Por debajo de esto no vale la pena crear un objeto nuevo. */
const MIN_SAVING_RATIO = 0.2

const STORAGE_RE =
  /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/images\/[^"'\\ )<>]+/g

const apply = process.argv.includes("--apply")

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} al bajar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function storagePathOf(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : url.slice(i + marker.length)
}

async function main() {
  const { data: posts, error } = await db
    .from("blog_posts")
    .select("id, title, cover_image, body")
  if (error) throw new Error(error.message)

  // URL original -> URL nueva. Se comparte entre posts por si repiten imagen.
  const remap = new Map()
  const skipped = []
  let totalBefore = 0
  let totalAfter = 0

  const urls = new Set()
  for (const post of posts) {
    if (post.cover_image?.startsWith("http")) urls.add(post.cover_image)
    for (const found of post.body?.match(STORAGE_RE) ?? []) urls.add(found)
  }

  for (const url of urls) {
    const path = storagePathOf(url)
    if (!path) {
      skipped.push(`${url} — no es del bucket ${BUCKET}`)
      continue
    }

    const original = await download(url)
    const compressed = await sharp(original)
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    const saving = 1 - compressed.length / original.length
    if (saving < MIN_SAVING_RATIO) {
      skipped.push(`${path} — solo ahorraría ${Math.round(saving * 100)}%`)
      continue
    }

    totalBefore += original.length
    totalAfter += compressed.length

    const newPath = `blog/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}.webp`

    console.log(
      `${path.padEnd(42)} ${kb(original.length).padStart(7)} -> ${kb(
        compressed.length
      ).padStart(7)}  (${Math.round(saving * 100)}%)`
    )

    if (!apply) continue

    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(newPath, compressed, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      })
    if (upErr) throw new Error(`subiendo ${newPath}: ${upErr.message}`)

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(newPath)
    remap.set(url, pub.publicUrl)
  }

  console.log("─".repeat(72))
  console.log(
    `TOTAL: ${kb(totalBefore)} -> ${kb(totalAfter)} (${Math.round(
      100 - (100 * totalAfter) / totalBefore
    )}% menos)`
  )
  if (skipped.length > 0) {
    console.log("\nOmitidas:")
    for (const s of skipped) console.log("  · " + s)
  }

  if (!apply) {
    console.log("\n[dry run] Nada se subió ni se modificó. Usa --apply.")
    return
  }

  let updated = 0
  for (const post of posts) {
    const patch = {}

    if (post.cover_image && remap.has(post.cover_image)) {
      patch.cover_image = remap.get(post.cover_image)
    }
    if (post.body) {
      let body = post.body
      for (const [from, to] of remap) body = body.split(from).join(to)
      if (body !== post.body) patch.body = body
    }
    if (Object.keys(patch).length === 0) continue

    const { error: updErr } = await db
      .from("blog_posts")
      .update(patch)
      .eq("id", post.id)
    if (updErr) throw new Error(`actualizando ${post.id}: ${updErr.message}`)
    updated++
    console.log(`✓ ${post.title.slice(0, 50)}`)
  }

  // Mapeo para revertir: volver a poner la clave donde quedó el valor.
  const stamp = new Date().toISOString().slice(0, 10)
  mkdirSync("docs/perf", { recursive: true })
  const logPath = `docs/perf/blog-images-${stamp}.json`
  writeFileSync(
    logPath,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        note: "Los originales siguen en el bucket. Para revertir, reponer la clave (URL vieja) donde quedó el valor (URL nueva).",
        bytesBefore: totalBefore,
        bytesAfter: totalAfter,
        remap: Object.fromEntries(remap),
      },
      null,
      2
    )
  )
  console.log(`\n${updated} posts actualizados. Mapeo en ${logPath}`)
}

main().catch((e) => {
  console.error("FALLÓ:", e.message)
  process.exitCode = 1
})
