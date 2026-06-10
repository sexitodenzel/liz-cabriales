"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams])
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAppUrl = () => {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      window.location.origin.replace(/\/$/, "")
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/auth/callback?type=recovery`,
      })

      if (resetError) {
        setError("No se pudo enviar el enlace. Intenta de nuevo.")
        return
      }

      setSent(true)
    } catch {
      setError("Error de red. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md px-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Recuperar contraseña</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {sent ? (
        <div className="space-y-5">
          <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu
            contraseña.
          </p>
          <Link
            href="/login"
            className="block w-full py-3 rounded-md bg-black text-white text-sm font-medium text-center hover:bg-gray-900 transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-700 underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
