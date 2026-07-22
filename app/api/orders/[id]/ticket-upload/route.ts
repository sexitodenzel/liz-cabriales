import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

type RouteContext = { params: Promise<{ id: string }> }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}
const MAX_BYTES = 10 * 1024 * 1024
const PAID_STATUSES = ["paid", "awaiting_shipping_payment", "shipping_paid", "shipped", "delivered"]

/** Valida los primeros bytes contra el MIME declarado. */
function hasValidMagicBytes(bytes: Uint8Array, mime: string): boolean {
  if (mime === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  }
  if (mime === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mime === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (mime === "image/webp") {
    return (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    )
  }
  return false
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: orderId } = await context.params

    const rate = checkRateLimit(
      `ticket-upload:${getClientIp(request)}`,
      6,
      10 * 60_000
    )
    if (!rate.allowed) {
      return NextResponse.json(
        { data: null, error: { message: "Demasiadas subidas. Espera un momento." } },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { data: null, error: { message: "No autorizado" } },
        { status: 401 }
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, requires_invoice, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { data: null, error: { message: "Orden no encontrada" } },
        { status: 404 }
      )
    }

    if (!order.requires_invoice) {
      return NextResponse.json(
        { data: null, error: { message: "Esta orden no requiere factura" } },
        { status: 400 }
      )
    }

    if (!PAID_STATUSES.includes(order.status as string)) {
      return NextResponse.json(
        { data: null, error: { message: "La orden aún no ha sido pagada" } },
        { status: 400 }
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
        { data: null, error: { message: "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF" } },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { data: null, error: { message: "El archivo no puede superar los 10 MB" } },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    if (!hasValidMagicBytes(new Uint8Array(arrayBuffer), file.type)) {
      return NextResponse.json(
        { data: null, error: { message: "El archivo no es válido" } },
        { status: 400 }
      )
    }

    const storagePath = `ticket/${orderId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("invoice-docs")
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      return NextResponse.json(
        { data: null, error: { message: "Error al subir archivo: " + uploadError.message } },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from("orders")
      .update({ ticket_photo_url: storagePath, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    return NextResponse.json({ data: { path: storagePath }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
