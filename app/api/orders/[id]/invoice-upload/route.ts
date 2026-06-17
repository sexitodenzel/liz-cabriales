import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { sendInvoiceReceivedAdminEmail } from "@/lib/email/templates/invoice-received-admin"

type RouteContext = { params: Promise<{ id: string }> }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024

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
      .select("id, requires_invoice")
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
        { data: null, error: { message: "Solo se permiten PDF, JPG, PNG o WEBP" } },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { data: null, error: { message: "El archivo no puede superar los 10 MB" } },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop() ?? "bin"
    const storagePath = `constancia/${orderId}/${Date.now()}.${ext}`
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
      .update({ constancia_fiscal_url: storagePath, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    sendInvoiceReceivedAdminEmail(orderId).catch((err) =>
      console.error("[invoice-upload] admin email error:", err)
    )

    return NextResponse.json({ data: { path: storagePath }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
