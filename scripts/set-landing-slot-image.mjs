/**
 * Reemplaza la imagen de un slot de `landing_slots` desde un archivo local.
 *
 * Hace lo mismo que el panel (`/admin/media`), pero desde la terminal: el panel
 * comprime en el navegador con `browser-image-compression` y sube por
 * `/api/admin/uploads/image`; aquí se comprime con sharp (mismos parámetros:
 * 2400 px de lado mayor, WebP q82) y se sube con service role. El resultado en
 * el bucket es equivalente.
 *
 * NO sobrescribe: sube un objeto nuevo y reapunta la fila. El objeto viejo se
 * queda en el bucket, así que revertir es volver a poner la URL anterior — que
 * este script imprime siempre antes de escribir.
 *
 * Uso:
 *   node --env-file=.env.local scripts/set-landing-slot-image.mjs <slot> <archivo> --dry
 *   node --env-file=.env.local scripts/set-landing-slot-image.mjs <slot> <archivo> --apply
 *
 * Ejemplo:
 *   node --env-file=.env.local scripts/set-landing-slot-image.mjs \
 *     home_tri_academia "C:/Users/migue/Downloads/area tecnica6.jpg" --dry
 */

import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { readFileSync, statSync } from "node:fs"

const BUCKET = "images"
const FOLDER = "landing"
/** Igual que el panel: `compressImage(file, { maxWidthOrHeight: 2400 })`. */
const MAX_EDGE = 2400
const WEBP_QUALITY = 82
/** Tope del endpoint de subida del panel, respetado aquí por consistencia. */
const MAX_BYTES = 6 * 1024 * 1024

const args = process.argv.slice(2)
const apply = args.includes("--apply")
const [slotKey, filePath] = args.filter((a) => !a.startsWith("--"))

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

if (!slotKey || !filePath) {
  console.error(
    "Uso: node --env-file=.env.local scripts/set-landing-slot-image.mjs <slot> <archivo> [--apply]"
  )
  process.exit(1)
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data: slot, error: slotError } = await db
    .from("landing_slots")
    .select("key, label, section, url")
    .eq("key", slotKey)
    .maybeSingle()

  if (slotError) throw new Error(slotError.message)
  if (!slot) throw new Error(`No existe el slot "${slotKey}" en landing_slots.`)

  const before = statSync(filePath).size
  const input = readFileSync(filePath)

  const meta = await sharp(input).metadata()
  const output = await sharp(input)
    .rotate() // respeta el EXIF de orientación (fotos de celular)
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()

  const outMeta = await sharp(output).metadata()

  console.log(`Slot     : ${slot.key} — ${slot.label} (sección: ${slot.section})`)
  console.log(`URL actual: ${slot.url}`)
  console.log(`Archivo  : ${filePath}`)
  console.log(
    `Origen   : ${meta.width}x${meta.height} ${meta.format} — ${kb(before)}`
  )
  console.log(
    `Resultado: ${outMeta.width}x${outMeta.height} webp — ${kb(output.length)} ` +
      `(${(100 - (output.length / before) * 100).toFixed(0)}% menos)`
  )

  if (output.length > MAX_BYTES) {
    throw new Error(`La imagen comprimida supera los 6 MB (${kb(output.length)}).`)
  }

  if (!apply) {
    console.log("\n(dry run — no se subió nada. Repite con --apply para aplicar.)")
    return
  }

  const path = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, output, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/webp",
    })
  if (uploadError) throw new Error(`Al subir: ${uploadError.message}`)

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path)
  if (!pub?.publicUrl) throw new Error("No se pudo obtener la URL pública.")

  const { error: updateError } = await db
    .from("landing_slots")
    .update({ url: pub.publicUrl })
    .eq("key", slot.key)
  if (updateError) throw new Error(`Al guardar: ${updateError.message}`)

  console.log(`\nListo. URL nueva: ${pub.publicUrl}`)
  console.log(`Para revertir, deja el slot en: ${slot.url}`)
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`)
  process.exit(1)
})
