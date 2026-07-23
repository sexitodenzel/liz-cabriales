import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { uploadUgcImage } from "@/lib/supabase/nail-art-storage"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

const MAX_BYTES = 6 * 1024 * 1024
const UPLOAD_RATE_LIMIT = 15
const UPLOAD_RATE_WINDOW_MS = 60_000

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
  return false
}

/** Subida UGC → bucket privado `nail-art-ugc/{userId}/…`. Devuelve path relativo. */
export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(
      `nail-art-ugc-upload:${getClientIp(request)}`,
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
    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "Inicia sesión para subir", code: "UNAUTHENTICATED" } },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json(
        { data: null, error: { message: "Archivo requerido" } },
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

    const result = await uploadUgcImage({
      userId: user.id,
      bytes: arrayBuffer,
      contentType: file.type,
      ext,
    })

    if ("error" in result) {
      return NextResponse.json(
        { data: null, error: { message: "Error al subir la imagen" } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        path: result.path,
        /** Solo para preview en el formulario; no guardar en DB. */
        previewUrl: result.previewUrl,
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
