import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { sendInvoiceIssuedClientEmail } from "@/lib/email/templates/invoice-issued-client"

type RouteContext = { params: Promise<{ id: string }> }

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id: orderId } = await context.params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const authResult = await requireAdmin(user?.id)
    if (authResult.error) {
      const status = authResult.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: authResult.error }, { status })
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        invoice_status: "issued",
        invoice_issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: updateError.message } },
        { status: 500 }
      )
    }

    sendInvoiceIssuedClientEmail(orderId).catch((err) =>
      console.error("[invoice-issue] client email error:", err)
    )

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: "Error interno del servidor" } },
      { status: 500 }
    )
  }
}
