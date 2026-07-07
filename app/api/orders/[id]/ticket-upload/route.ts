import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ id: string }> }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_BYTES = 10 * 1024 * 1024
const PAID_STATUSES = ["paid", "awaiting_shipping_payment", "shipping_paid", "shipped", "delivered"]

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: orderId } = await context.params

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

    if (!ALLOWED_TYPES.includes(file.type)) {
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

    const rawExt = file.name.split(".").pop() ?? ""
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin"
    const storagePath = `ticket/${orderId}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

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
