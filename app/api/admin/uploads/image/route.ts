import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdminOrReceptionist } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

/**
 * Subida de imágenes del panel admin, server-side.
 *
 * Ventajas frente a subir directo desde el cliente:
 *  - Solo staff (admin/recepcionista) puede subir.
 *  - Valida el tipo real por magic bytes, no solo por la extensión/MIME.
 *  - Limita tamaño y carpeta destino a una lista blanca.
 *  - Rate limit por IP para evitar abuso de storage.
 */

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

const MAX_BYTES = 6 * 1024 * 1024

// Carpetas permitidas dentro del bucket `images`.
const ALLOWED_FOLDERS = new Set([
  "products",
  "courses",
  "courses-gallery",
  "instructors",
  "professionals",
  "hero",
  "landing",
  "events",
  "brands",
  "nail-art",
  "blog",
  "services",
])

const UPLOAD_RATE_LIMIT = 30
const UPLOAD_RATE_WINDOW_MS = 60_000

/** Verifica los primeros bytes del archivo contra su MIME declarado. */
function hasValidMagicBytes(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mime === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
  }
  if (mime === "image/webp") {
    // "RIFF"…"WEBP"
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
  }
  if (mime === "image/gif") {
    // "GIF8"
    return (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    )
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(
      `admin-upload:${getClientIp(request)}`,
      UPLOAD_RATE_LIMIT,
      UPLOAD_RATE_WINDOW_MS
    )
    if (!rate.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Demasiadas subidas. Espera un momento.", code: "RATE_LIMITED" },
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const auth = await requireAdminOrReceptionist(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folderRaw = (formData.get("folder") as string | null)?.trim() ?? "products"

    if (!file || file.size === 0) {
      return NextResponse.json(
        { data: null, error: { message: "Archivo requerido" } },
        { status: 400 }
      )
    }

    if (!ALLOWED_FOLDERS.has(folderRaw)) {
      return NextResponse.json(
        { data: null, error: { message: "Carpeta destino no permitida" } },
        { status: 400 }
      )
    }

    const ext = MIME_TO_EXT[file.type]
    if (!ext) {
      return NextResponse.json(
        { data: null, error: { message: "Solo se permiten imágenes JPG, PNG o WEBP" } },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { data: null, error: { message: "La imagen no puede superar los 6 MB" } },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    if (!hasValidMagicBytes(bytes, file.type)) {
      return NextResponse.json(
        { data: null, error: { message: "El archivo no es una imagen válida" } },
        { status: 400 }
      )
    }

    const path = `${folderRaw}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(path, arrayBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json(
        { data: null, error: { message: "Error al subir la imagen" } },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage.from("images").getPublicUrl(path)
    if (!data?.publicUrl) {
      return NextResponse.json(
        { data: null, error: { message: "No se pudo obtener la URL pública" } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { url: data.publicUrl }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
