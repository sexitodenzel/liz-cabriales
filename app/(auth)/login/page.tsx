"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { loginCredentialsSchema, registerAccountSchema } from "@/lib/validations/auth"
import { normalizePhoneInput } from "@/lib/validations/phone"

type Tab = "login" | "register"
type RegisterStep = "form" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>("login")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({})

  // Login form
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Register form
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regAddress, setRegAddress] = useState("")
  const [regState, setRegState] = useState("")
  const [regCity, setRegCity] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regWhatsappOptIn, setRegWhatsappOptIn] = useState(false)

  // OTP step
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form")
  const [otpCode, setOtpCode] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)

  const redirectParam = searchParams.get("redirect") ?? searchParams.get("next")

  const safeInternalRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null

  const buildPostAuthRedirect = () => {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      window.location.origin.replace(/\/$/, "")

    const callbackUrl = new URL("/auth/callback", appUrl)
    if (safeInternalRedirect) {
      callbackUrl.searchParams.set("next", safeInternalRedirect)
    }
    return callbackUrl.toString()
  }

  const navigateAndRefresh = (path: string) => {
    router.push(path)
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const credentialsResult = loginCredentialsSchema.safeParse({ email, password })
    if (!credentialsResult.success) {
      setError(credentialsResult.error.issues[0]?.message ?? "Datos de acceso inválidos.")
      return
    }

    const credentials = credentialsResult.data

    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      if (!data.user) {
        setError("No se pudo obtener el usuario.")
        setLoading(false)
        return
      }
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
      if (profileError) {
        console.log("[handleLogin] Error al obtener perfil:", profileError)
      }
      const role = profile?.role ?? "client"
      if (safeInternalRedirect) {
        navigateAndRefresh(safeInternalRedirect)
        return
      }
      if (role === "admin") {
        navigateAndRefresh("/admin")
      } else if (role === "receptionist") {
        navigateAndRefresh("/admin/appointments")
      } else {
        navigateAndRefresh("/perfil")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión."
      setError(message)
      setLoading(false)
    }
  }

  function clearRegError(field: string) {
    if (regFieldErrors[field]) {
      setRegFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setRegFieldErrors({})

    const registerResult = registerAccountSchema.safeParse({
      firstName: regFirstName,
      lastName: regLastName,
      address: regAddress,
      state: regState,
      city: regCity,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
    })
    if (!registerResult.success) {
      const errs: Record<string, string> = {}
      for (const issue of registerResult.error.issues) {
        const path = String(issue.path[0] ?? "")
        if (path && !errs[path]) errs[path] = issue.message
      }
      setRegFieldErrors(errs)
      return
    }

    const registerInput = registerResult.data

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerInput.email,
        password: registerInput.password,
        options: {
          data: {
            first_name: registerInput.firstName,
            last_name: registerInput.lastName,
            address: registerInput.address,
            state: registerInput.state,
            city: registerInput.city,
          },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const userId = data.user?.id
      const hasSession = Boolean(data.session)

      // Si el usuario ingresó teléfono y aceptó WhatsApp, guardar y enviar OTP
      if (userId && registerInput.phone && regWhatsappOptIn) {
        // Actualizar whatsapp_opt_in en el perfil
        await supabase
          .from("users")
          .update({ whatsapp_opt_in: true })
          .eq("id", userId)

        // Enviar OTP
        const otpRes = await fetch("/api/phone/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: registerInput.phone }),
        })

        if (otpRes.ok) {
          setRegisterStep("otp")
          setLoading(false)
          return
        }
      }

      if (hasSession) {
        navigateAndRefresh("/perfil")
      } else {
        setError(
          "Revisa tu correo para confirmar la cuenta antes de iniciar sesión."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^\d{6}$/.test(otpCode)) {
      setError("Ingresa el código de 6 dígitos.")
      return
    }

    setOtpLoading(true)
    try {
      const res = await fetch("/api/phone/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "Código incorrecto. Intenta de nuevo.")
        return
      }

      navigateAndRefresh("/perfil")
    } catch {
      setError("Error de red. Intenta de nuevo.")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSkipOtp = () => {
    navigateAndRefresh("/perfil")
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setOauthLoading(true)
    try {
      const redirectTo = buildPostAuthRedirect()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar Google Login."
      setError(message)
    } finally {
      setOauthLoading(false)
    }
  }

  const forgotPasswordHref = email
    ? `/forgot-password?email=${encodeURIComponent(email)}`
    : "/forgot-password"

  return (
    <div className="w-full max-w-md">
      <div className="flex border-b border-gray-200 mb-8">
        <button
          type="button"
          onClick={() => {
            setActiveTab("login")
            setError(null)
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "login"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("register")
            setError(null)
            setRegFieldErrors({})
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "register"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {activeTab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || oauthLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {oauthLoading ? "Conectando con Google…" : "Continuar con Google"}
          </button>
          <p className="text-center text-xs uppercase tracking-wider text-gray-400">
            o entra con correo
          </p>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <Link href={forgotPasswordHref} className="text-sm text-gray-500 hover:text-gray-700 underline">
              ¿Olvidaste tu contraseña?
            </Link>
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
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : registerStep === "otp" ? (
        /* ── Paso 2: Verificar OTP ── */
        <div className="space-y-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Verifica tu número de WhatsApp</p>
            <p className="mt-1">
              Enviamos un código de 6 dígitos al número {regPhone}. Ingrésalo para confirmar.
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label
                htmlFor="otpCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Código de verificación
              </label>
              <input
                id="otpCode"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="123456"
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={otpLoading || otpCode.length !== 6}
              className="w-full py-3 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? "Verificando…" : "Verificar código"}
            </button>
          </form>
          <button
            type="button"
            onClick={handleSkipOtp}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Omitir por ahora (puedes verificar desde tu perfil)
          </button>
        </div>
      ) : (
        /* ── Paso 1: Formulario de registro ── */
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                id="firstName" type="text" value={regFirstName}
                onChange={(e) => { setRegFirstName(e.target.value); clearRegError("firstName") }}
                className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.firstName ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
              {regFieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{regFieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                id="lastName" type="text" value={regLastName}
                onChange={(e) => { setRegLastName(e.target.value); clearRegError("lastName") }}
                className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.lastName ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
              {regFieldErrors.lastName && <p className="mt-1 text-xs text-red-600">{regFieldErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              id="regEmail" type="email" value={regEmail}
              onChange={(e) => { setRegEmail(e.target.value); clearRegError("email") }}
              className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.email ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {regFieldErrors.email && <p className="mt-1 text-xs text-red-600">{regFieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              id="address" type="text" value={regAddress}
              onChange={(e) => { setRegAddress(e.target.value); clearRegError("address") }}
              required
              className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.address ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {regFieldErrors.address && <p className="mt-1 text-xs text-red-600">{regFieldErrors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                id="state" type="text" value={regState}
                onChange={(e) => { setRegState(e.target.value); clearRegError("state") }}
                required
                className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.state ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
              {regFieldErrors.state && <p className="mt-1 text-xs text-red-600">{regFieldErrors.state}</p>}
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                id="city" type="text" value={regCity}
                onChange={(e) => { setRegCity(e.target.value); clearRegError("city") }}
                required
                className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.city ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
              {regFieldErrors.city && <p className="mt-1 text-xs text-red-600">{regFieldErrors.city}</p>}
            </div>
          </div>

          {/* ── Teléfono + opt-in WhatsApp ── */}
          <div>
            <label htmlFor="regPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
            <input
              id="regPhone" type="tel" value={regPhone}
              onChange={(e) => { setRegPhone(normalizePhoneInput(e.target.value)); clearRegError("phone") }}
              placeholder="5218331234567"
              className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.phone ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {regFieldErrors.phone
              ? <p className="mt-1 text-xs text-red-600">{regFieldErrors.phone}</p>
              : <p className="mt-1 text-xs text-gray-500">Formato sin espacios ni guiones: código de país + número (ej. 5218331234567)</p>
            }
          </div>

          {regPhone && (
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 transition-colors has-[:checked]:border-black has-[:checked]:bg-gray-100">
              <input
                type="checkbox"
                checked={regWhatsappOptIn}
                onChange={(e) => setRegWhatsappOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm text-gray-700">
                Acepto recibir actualizaciones de mis pedidos y citas por WhatsApp.
              </span>
            </label>
          )}

          <div>
            <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              id="regPassword" type="password" value={regPassword}
              onChange={(e) => { setRegPassword(e.target.value); clearRegError("password") }}
              minLength={6}
              className={`w-full border rounded-md px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${regFieldErrors.password ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
            {regFieldErrors.password && <p className="mt-1 text-xs text-red-600">{regFieldErrors.password}</p>}
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
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700 underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  )
}
