"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { authEmailSchema, loginCredentialsSchema } from "@/lib/validations/auth"
import FloatingInput from "@/app/components/auth/FloatingInput"

type Step = "email" | "password"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const [checking, setChecking] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const redirectParam = searchParams.get("redirect") ?? searchParams.get("next")
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null

  const navigateAndRefresh = (path: string) => {
    router.push(path)
    router.refresh()
  }

  function buildCreateAccountHref(prefillEmail: string) {
    const params = new URLSearchParams()
    params.set("email", prefillEmail)
    if (safeRedirect) params.set("next", safeRedirect)
    return `/registrar?${params.toString()}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (step === "email") {
      const parsed = authEmailSchema.safeParse(email)
      if (!parsed.success) {
        setEmailError("Información necesaria")
        return
      }
      setEmailError(null)
      setChecking(true)
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsed.data }),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          setServerError(json?.error?.message ?? "No se pudo verificar el correo.")
          return
        }
        if (json.data?.exists) {
          setEmail(parsed.data)
          setStep("password")
        } else {
          router.push(buildCreateAccountHref(parsed.data))
        }
      } catch {
        setServerError("Error de red. Intenta de nuevo.")
      } finally {
        setChecking(false)
      }
      return
    }

    // step === "password"
    const credResult = loginCredentialsSchema.safeParse({ email, password })
    if (!credResult.success) {
      const issue = credResult.error.issues[0]
      if (issue?.path[0] === "password") setPasswordError("Información necesaria")
      else setEmailError("Información necesaria")
      return
    }
    setPasswordError(null)
    setSigningIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credResult.data.email,
        password: credResult.data.password,
      })
      if (error || !data.user) {
        setServerError(
          error?.message ??
            "No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo."
        )
        return
      }
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()
      const role = profile?.role ?? "client"
      if (safeRedirect) {
        navigateAndRefresh(safeRedirect)
        return
      }
      if (role === "admin") navigateAndRefresh("/admin")
      else if (role === "receptionist") navigateAndRefresh("/admin/appointments")
      else navigateAndRefresh("/")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión."
      setServerError(message)
    } finally {
      setSigningIn(false)
    }
  }

  const loading = checking || signingIn

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-neutral-100 px-6 py-10 sm:px-14 sm:py-14">
        <h1 className="mb-8 font-[family-name:var(--font-cormorant-garamond)] text-xl tracking-[0.25em] text-neutral-900 sm:text-2xl">
          MI CUENTA
        </h1>

        <p className="mb-8 text-[15px] text-neutral-700">
          {step === "email"
            ? "Introduzca su correo electrónico a continuación para acceder a su cuenta o crear una."
            : "Introduzca su contraseña para acceder a su cuenta."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          <FloatingInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            readOnly={step === "password"}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null)
              setServerError(null)
            }}
            error={emailError}
            helper={
              !emailError ? "Formato esperado: nombreapellidos@dominio.com" : null
            }
          />

          {step === "password" ? (
            <>
              <FloatingInput
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                  setServerError(null)
                }}
                error={passwordError}
              />
              <div className="text-right">
                <Link
                  href={`/forgot-password${
                    email ? `?email=${encodeURIComponent(email)}` : ""
                  }`}
                  className="text-[13px] text-neutral-600 underline-offset-2 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
            </>
          ) : null}

          {serverError ? (
            <p className="text-[13px] text-red-600" role="alert">
              {serverError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            {step === "password" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setPassword("")
                  setPasswordError(null)
                  setServerError(null)
                }}
                className="order-2 text-[13px] text-neutral-600 underline-offset-2 hover:underline sm:order-1"
              >
                Cambiar correo
              </button>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="order-1 ml-auto inline-flex h-12 w-full items-center justify-center bg-neutral-900 px-12 text-[13px] tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2 sm:w-auto"
            >
              {loading
                ? step === "email"
                  ? "VERIFICANDO…"
                  : "ENTRANDO…"
                : "CONTINUAR"}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-neutral-700">
        ¿No tiene cuenta?{" "}
        <Link
          href={buildCreateAccountHref(email)}
          className="underline-offset-2 hover:underline"
        >
          Crear una cuenta
        </Link>
      </p>
    </div>
  )
}
