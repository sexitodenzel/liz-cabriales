import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js"

import { nailArtImageApiPath } from "@/lib/nail-art-image"

const UGC_BUCKET = "nail-art-ugc"
const LEGACY_IMAGES_BUCKET = "images"
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hora

let _admin: SupabaseClient | null = null

function getAdmin(): SupabaseClient {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor"
    )
  }
  _admin = createServiceClient(url, key)
  return _admin
}

export { UGC_BUCKET, SIGNED_URL_TTL_SECONDS, nailArtImageApiPath }

/** Origen del proyecto Supabase (sin slash final). */
export function getSupabaseOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurada")
  return raw.replace(/\/$/, "")
}

const RELATIVE_PATH_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[A-Za-z0-9._-]+$/i

/**
 * Extrae path relativo `{userId}/archivo` desde URL de Storage o path ya relativo.
 * Soporta bucket `nail-art-ugc` y legacy `images/nail-art-ugc/...`.
 */
export function extractUgcRelativePath(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  if (RELATIVE_PATH_RE.test(value) && !value.includes("://")) {
    return value
  }

  try {
    const origin = getSupabaseOrigin()
    const url = new URL(value)
    if (url.origin !== origin) return null

    const direct = url.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign)\/nail-art-ugc\/([0-9a-f-]{36}\/[A-Za-z0-9._-]+)$/i
    )
    if (direct?.[1]) return direct[1]

    const legacy = url.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign)\/images\/nail-art-ugc\/([0-9a-f-]{36}\/[A-Za-z0-9._-]+)$/i
    )
    if (legacy?.[1]) return legacy[1]

    return null
  } catch {
    return null
  }
}

/**
 * Valida cover en submit: URL estricta de Storage o path relativo del dueño.
 * Devuelve el path relativo a guardar en DB.
 */
export function validateAndNormalizeUgcCover(
  input: string,
  userId: string
): { path: string } | { error: string } {
  const value = input.trim()
  if (!value) {
    return { error: "La imagen es requerida" }
  }

  if (!value.includes("://")) {
    if (!RELATIVE_PATH_RE.test(value)) {
      return {
        error:
          "Imagen no válida. El path debe ser {tuUsuario}/archivo dentro del bucket nail-art-ugc.",
      }
    }
    const owner = value.split("/")[0]
    if (owner !== userId) {
      return { error: "Imagen no válida. Solo puedes usar archivos de tu carpeta." }
    }
    return { path: value }
  }

  let origin: string
  try {
    origin = getSupabaseOrigin()
  } catch {
    return { error: "Configuración de almacenamiento no disponible" }
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { error: "URL de imagen inválida" }
  }

  if (url.origin !== origin) {
    return {
      error:
        "Imagen no válida. Debe provenir del almacenamiento de este proyecto (Supabase Storage).",
    }
  }

  const strict = url.pathname.match(
    /^\/storage\/v1\/object\/(public|sign)\/nail-art-ugc\/([0-9a-f-]{36})\/([A-Za-z0-9._-]+)$/i
  )

  const legacy = url.pathname.match(
    /^\/storage\/v1\/object\/(public|sign)\/images\/nail-art-ugc\/([0-9a-f-]{36})\/([A-Za-z0-9._-]+)$/i
  )

  const match = strict ?? legacy
  if (!match) {
    return {
      error:
        "Imagen no válida. La URL debe ser de Storage en /nail-art-ugc/{tuUsuario}/…",
    }
  }

  const ownerId = match[2]
  const fileName = match[3]
  if (ownerId !== userId) {
    return { error: "Imagen no válida. Solo puedes publicar archivos de tu carpeta." }
  }

  return { path: `${ownerId}/${fileName}` }
}

/** True si el cover es UGC (path relativo o URL de bucket UGC / legacy). */
export function isUgcCover(cover: string | null | undefined): boolean {
  if (!cover?.trim()) return false
  return extractUgcRelativePath(cover) !== null
}

/**
 * Genera signed URL para un path relativo `{userId}/file`.
 * Intenta bucket `nail-art-ugc`; fallback legacy `images` + prefijo.
 */
export async function createUgcSignedUrl(
  relativePath: string
): Promise<{ signedUrl: string } | { error: string }> {
  const path = relativePath.replace(/^\/+/, "")
  if (!RELATIVE_PATH_RE.test(path)) {
    return { error: "Path de imagen inválido" }
  }

  const admin = getAdmin()

  const primary = await admin.storage
    .from(UGC_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (!primary.error && primary.data?.signedUrl) {
    return { signedUrl: primary.data.signedUrl }
  }

  const legacy = await admin.storage
    .from(LEGACY_IMAGES_BUCKET)
    .createSignedUrl(`nail-art-ugc/${path}`, SIGNED_URL_TTL_SECONDS)

  if (!legacy.error && legacy.data?.signedUrl) {
    return { signedUrl: legacy.data.signedUrl }
  }

  return {
    error: primary.error?.message || legacy.error?.message || "No se pudo firmar la imagen",
  }
}

/** Sube bytes al bucket privado nail-art-ugc/{userId}/… */
export async function uploadUgcImage(params: {
  userId: string
  bytes: ArrayBuffer
  contentType: string
  ext: string
}): Promise<{ path: string; previewUrl: string } | { error: string }> {
  const path = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${params.ext}`
  const admin = getAdmin()

  const { error: uploadError } = await admin.storage.from(UGC_BUCKET).upload(path, params.bytes, {
    cacheControl: "3600",
    upsert: false,
    contentType: params.contentType,
  })

  if (uploadError) {
    return { error: uploadError.message || "Error al subir la imagen" }
  }

  const signed = await createUgcSignedUrl(path)
  if ("error" in signed) {
    return { path, previewUrl: "" }
  }

  return { path, previewUrl: signed.signedUrl }
}
