/**
 * Normaliza cover_image de posts Nail Art UGC:
 * de URL pública completa → path relativo `{userId}/archivo` dentro del bucket.
 *
 * Uso:
 *   node scripts/migrate-nail-art-urls.mjs
 *   node scripts/migrate-nail-art-urls.mjs --dry-run
 *
 * Requiere en el entorno (o .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * NO mueve archivos entre buckets; solo reescribe el campo en la DB.
 * Si aún tienes objetos en `images/nail-art-ugc/…`, muévelos a bucket
 * `nail-art-ugc/{userId}/…` o deja el fallback del API (legacy) activo.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

function loadEnvLocal() {
  const candidates = [".env.local", ".env"]
  for (const name of candidates) {
    const file = resolve(process.cwd(), name)
    if (!existsSync(file)) continue
    const text = readFileSync(file, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
}

loadEnvLocal()

const dryRun = process.argv.includes("--dry-run")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const RELATIVE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9._-]+$/i

function extractRelativePath(input) {
  const value = String(input ?? "").trim()
  if (!value) return null
  if (RELATIVE_RE.test(value) && !value.includes("://")) return value

  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.origin !== supabaseUrl) return null

  const direct = url.pathname.match(
    /^\/storage\/v1\/object\/(?:public|sign)\/nail-art-ugc\/([0-9a-f-]{36}\/[A-Za-z0-9._-]+)$/i
  )
  if (direct?.[1]) return direct[1]

  const legacy = url.pathname.match(
    /^\/storage\/v1\/object\/(?:public|sign)\/images\/nail-art-ugc\/([0-9a-f-]{36}\/[A-Za-z0-9._-]+)$/i
  )
  if (legacy?.[1]) return legacy[1]

  return null
}

async function main() {
  console.log(dryRun ? "Modo dry-run (no escribe en DB)\n" : "Migrando cover_image…\n")

  const { data: posts, error } = await supabase
    .from("nail_art_posts")
    .select("id, cover_image, is_editorial, user_id, status")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error al listar posts:", error.message)
    process.exit(1)
  }

  let scanned = 0
  let alreadyOk = 0
  let updated = 0
  let skipped = 0

  for (const post of posts ?? []) {
    scanned++
    const cover = post.cover_image
    if (!cover || typeof cover !== "string") {
      skipped++
      continue
    }

    if (RELATIVE_RE.test(cover.trim()) && !cover.includes("://")) {
      alreadyOk++
      continue
    }

    const relative = extractRelativePath(cover)
    if (!relative) {
      // Editorial u otras URLs públicas (no UGC) — no tocar
      skipped++
      console.log(`  skip  ${post.id}  (no es URL UGC reconocible)`)
      continue
    }

    console.log(`  ${dryRun ? "would update" : "update"}  ${post.id}`)
    console.log(`    from: ${cover.slice(0, 100)}${cover.length > 100 ? "…" : ""}`)
    console.log(`    to:   ${relative}`)

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("nail_art_posts")
        .update({ cover_image: relative })
        .eq("id", post.id)
      if (upErr) {
        console.error(`    ERROR: ${upErr.message}`)
        continue
      }
    }
    updated++
  }

  console.log("\nResumen")
  console.log(`  escaneados:     ${scanned}`)
  console.log(`  ya relativos:   ${alreadyOk}`)
  console.log(`  ${dryRun ? "a actualizar" : "actualizados"}: ${updated}`)
  console.log(`  omitidos:       ${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
