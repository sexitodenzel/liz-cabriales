import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPasswordResetSuccessEmail } from "@/lib/email/templates/password-reset-success"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("first_name")
      .eq("id", user.id)
      .single()

    try {
      await sendPasswordResetSuccessEmail({
        email: user.email,
        firstName: profile?.first_name ?? null,
      })
    } catch (emailError) {
      console.error(
        `[api/auth/password-reset-success] Error enviando correo a ${user.email}:`,
        emailError
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/auth/password-reset-success] Error inesperado:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
