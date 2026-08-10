"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { prepareSupabaseCaptcha } from "@/lib/turnstile-client"
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/components/shared/TurnstileWidget"

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams])
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  /** Clic dado mientras Turnstile resolvía: se reenvía al llegar el token. */
  const [awaitingCaptcha, setAwaitingCaptcha] = useState(false)
  /** Cloudflare pidió interacción humana: el token ya no tiene tiempo límite. */
  const [captchaInteractive, setCaptchaInteractive] = useState(false)

  function resetTurnstile() {
    setTurnstileToken(null)
    setAwaitingCaptcha(false)
    turnstileRef.current?.reset()
  }

  const getAppUrl = () => {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      window.location.origin.replace(/\/$/, "")
    )
  }

  const runSubmit = async () => {
    setError(null)

    // El ref evita el "primer clic" con el state todavía en null.
    const token = turnstileRef.current?.getToken() ?? turnstileToken
    if (!token) {
      // Turnstile sigue resolviendo: deja el envío en cola en vez de perder el
      // clic. El efecto de abajo lo reenvía al llegar el token.
      setAwaitingCaptcha(true)
      return
    }
    setAwaitingCaptcha(false)
    setLoading(true)

    try {
      const captcha = await prepareSupabaseCaptcha(token)
      resetTurnstile()
      if (!captcha.ok) {
        setError(captcha.message)
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/auth/callback?type=recovery`,
        captchaToken: captcha.captchaToken,
      })

      if (resetError) {
        setError(
          /captcha/i.test(resetError.message)
            ? "La verificación de seguridad falló. Recarga la página e intenta de nuevo."
            : "No se pudo enviar el enlace. Intenta de nuevo."
        )
        return
      }

      setSent(true)
    } catch {
      resetTurnstile()
      setError("Error de red. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // El efecto necesita la versión más reciente de runSubmit (lee el email del
  // render actual), no la que existía al montar.
  const submitRef = useRef(runSubmit)
  submitRef.current = runSubmit

  useEffect(() => {
    if (!awaitingCaptcha) return

    if (turnstileToken) {
      void submitRef.current()
      return
    }

    // Reto interactivo: espera el clic del usuario, puede tardar lo que sea.
    if (captchaInteractive) return

    // Turnstile caído o bloqueado (extensión, red corporativa): el token no va
    // a llegar nunca. Cortar en vez de dejar el botón girando en silencio.
    const timeout = window.setTimeout(() => {
      setAwaitingCaptcha(false)
      setError(
        "No se pudo completar la verificación de seguridad. Recarga la página e intenta de nuevo."
      )
    }, 15_000)
    return () => window.clearTimeout(timeout)
  }, [awaitingCaptcha, turnstileToken, captchaInteractive])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void runSubmit()
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Recuperar contraseña</h1>
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

          <TurnstileWidget
            ref={turnstileRef}
            onToken={setTurnstileToken}
            onInteractive={() => setCaptchaInteractive(true)}
            className="flex justify-center"
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || awaitingCaptcha}
            className="w-full py-3 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || awaitingCaptcha ? "Enviando…" : "Enviar enlace"}
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
