"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { authEmailSchema, loginCredentialsSchema } from "@/lib/validations/auth"
import FloatingInput from "@/app/components/auth/FloatingInput"
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/components/shared/TurnstileWidget"

type Step = "email" | "password"

type LoginApiResponse =
  | {
      data: {
        user: { id: string; email: string | null }
        role: string
        session: {
          expires_at: number | null
          expires_in: number | null
          token_type: string | null
        }
      }
      error: null
    }
  | { data: null; error: { message: string; code?: string } }
  | { error: string; retryAfterSeconds?: number }

function rateLimitMessage(retryAfterSeconds?: number | null): string {
  const base = "Demasiados intentos. Espera un momento antes de volver a intentar."
  if (
    typeof retryAfterSeconds === "number" &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return `${base} (≈ ${Math.ceil(retryAfterSeconds)} s)`
  }
  return base
}

/**
 * `fetch` con plazo máximo. Sin esto, un endpoint que tarda (Supabase frío ha
 * llegado a 30 s) deja el botón girando indefinidamente y sin salida: el
 * usuario no sabe si sigue vivo ni puede reintentar.
 */
const REQUEST_TIMEOUT_MS = 20_000

async function fetchWithTimeout(
  input: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(() =>
    searchParams.get("reason") === "inactivity"
      ? "Tu sesión expiró por inactividad"
      : null
  )

  const [checking, setChecking] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  /** Clic dado mientras Turnstile todavía resolvía: se reenvía al llegar el token. */
  const [awaitingCaptcha, setAwaitingCaptcha] = useState(false)
  /** Cloudflare pidió interacción humana: el token ya no tiene tiempo límite. */
  const [captchaInteractive, setCaptchaInteractive] = useState(false)

  const redirectParam = searchParams.get("redirect") ?? searchParams.get("next")
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null

  const navigateAfterLogin = (path: string) => {
    // Full navigation: cookies HttpOnly ya están en la respuesta del login.
    // Evita router.push + refresh (RSC completo), que se sentía como “colgado”.
    window.location.assign(path)
  }

  function buildCreateAccountHref(prefillEmail: string) {
    const params = new URLSearchParams()
    params.set("email", prefillEmail)
    if (safeRedirect) params.set("next", safeRedirect)
    return `/registrar?${params.toString()}`
  }

  function resetTurnstile() {
    setTurnstileToken(null)
    setAwaitingCaptcha(false)
    turnstileRef.current?.reset()
  }

  /** Token fresco: el ref evita el “primer clic” con state aún null. */
  function readTurnstileToken(): string | null {
    return turnstileRef.current?.getToken() ?? turnstileToken
  }

  async function runSubmit() {
    setServerError(null)

    if (step === "email") {
      if (!email.trim()) {
        setAwaitingCaptcha(false)
        setEmailError("Información necesaria")
        return
      }
      const parsed = authEmailSchema.safeParse(email)
      if (!parsed.success) {
        setAwaitingCaptcha(false)
        setEmailError(
          "Indique un correo electrónico válido. Ejemplo: nombreapellidos@dominio.com"
        )
        return
      }
      const emailCaptcha = readTurnstileToken()
      if (!emailCaptcha) {
        // Turnstile sigue resolviendo: deja el envío en cola en vez de perder
        // el clic. El efecto de abajo lo reenvía al llegar el token.
        setAwaitingCaptcha(true)
        return
      }
      setAwaitingCaptcha(false)
      setEmailError(null)
      setChecking(true)
      try {
        const res = await fetchWithTimeout("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: parsed.data,
            turnstileToken: emailCaptcha,
          }),
        })
        const json = await res.json()
        // Token de un solo uso: pedir uno nuevo para el paso de contraseña.
        resetTurnstile()
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
      } catch (err) {
        resetTurnstile()
        setServerError(
          err instanceof DOMException && err.name === "AbortError"
            ? "El servidor está tardando demasiado. Intenta de nuevo."
            : "Error de red. Intenta de nuevo."
        )
      } finally {
        setChecking(false)
      }
      return
    }

    // step === "password" → endpoint propio (Turnstile + rate limit + Auth)
    const credResult = loginCredentialsSchema.safeParse({ email, password })
    if (!credResult.success) {
      const issue = credResult.error.issues[0]
      setAwaitingCaptcha(false)
      if (issue?.path[0] === "password") setPasswordError("Información necesaria")
      else setEmailError("Información necesaria")
      return
    }
    const loginCaptcha = readTurnstileToken()
    if (!loginCaptcha) {
      setAwaitingCaptcha(true)
      return
    }
    setAwaitingCaptcha(false)
    setPasswordError(null)
    setSigningIn(true)
    try {
      const res = await fetchWithTimeout("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credResult.data.email,
          password: credResult.data.password,
          turnstileToken: loginCaptcha,
        }),
      })
      const json = (await res.json()) as LoginApiResponse
      resetTurnstile()

      if (res.status === 429) {
        const fromBody =
          "retryAfterSeconds" in json && typeof json.retryAfterSeconds === "number"
            ? json.retryAfterSeconds
            : null
        const fromHeader = Number(res.headers.get("Retry-After"))
        const retryAfterSeconds =
          fromBody ??
          (Number.isFinite(fromHeader) && fromHeader > 0 ? fromHeader : null)
        setServerError(rateLimitMessage(retryAfterSeconds))
        return
      }

      if (!res.ok || !("data" in json) || !json.data) {
        const message =
          "error" in json && json.error && typeof json.error === "object"
            ? json.error.message
            : null
        setServerError(
          message ??
            "No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo."
        )
        return
      }

      const role = json.data.role ?? "client"
      if (safeRedirect) {
        navigateAfterLogin(safeRedirect)
        return
      }
      if (role === "admin") navigateAfterLogin("/admin")
      else if (role === "receptionist") navigateAfterLogin("/admin/appointments")
      else navigateAfterLogin("/")
    } catch (err) {
      resetTurnstile()
      // El abort trae un mensaje interno del navegador; no se le enseña al
      // usuario.
      if (err instanceof DOMException && err.name === "AbortError") {
        setServerError("El servidor está tardando demasiado. Intenta de nuevo.")
      } else {
        setServerError(
          err instanceof Error ? err.message : "Error al iniciar sesión."
        )
      }
    } finally {
      setSigningIn(false)
    }
  }

  // El efecto de abajo necesita la versión más reciente de runSubmit (lee step,
  // email y password del render actual), no la que existía al montar.
  const submitRef = useRef(runSubmit)
  submitRef.current = runSubmit

  useEffect(() => {
    if (!awaitingCaptcha) return

    if (turnstileToken) {
      void submitRef.current()
      return
    }

    // Siempre hay red de seguridad. Antes el reto interactivo salía de aquí sin
    // armar timeout: si después el token expiraba o fallaba, el widget llama a
    // `onToken(null)` sin tocar `captchaInteractive`, así que nos quedábamos con
    // "esperando" + sin token + sin plazo — el botón giraba en VERIFICANDO… para
    // siempre, sin mensaje y sin salida salvo recargar. Resolver el reto puede
    // tardar, así que ahí el plazo es largo; el corto es para cuando Turnstile
    // ni siquiera llegó a pedir interacción (bloqueado por extensión o red).
    const timeout = window.setTimeout(
      () => {
        setAwaitingCaptcha(false)
        setCaptchaInteractive(false)
        turnstileRef.current?.reset()
        setServerError(
          "No se pudo completar la verificación de seguridad. Intenta de nuevo."
        )
      },
      captchaInteractive ? 90_000 : 15_000
    )
    return () => window.clearTimeout(timeout)
  }, [awaitingCaptcha, turnstileToken, captchaInteractive])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void runSubmit()
  }

  const loading = checking || signingIn
  // El botón ya no se bloquea por el captcha: si el token todavía no llega, el
  // clic se encola y sale solo. Antes quedaba deshabilitado y había que darle
  // CONTINUAR una segunda vez.
  const busy = loading || awaitingCaptcha
  const canSubmit = !busy

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-neutral-100 px-6 py-10 sm:px-14 sm:py-14">
        <h1 className="mb-8 text-xl font-semibold tracking-[0.25em] text-neutral-900 sm:text-2xl">
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

          <TurnstileWidget
            ref={turnstileRef}
            onToken={(token) => {
              setTurnstileToken(token)
              if (token) {
                setCaptchaInteractive(false)
                setServerError(null)
                return
              }
              // Token nulo = expiró o falló (el widget avisa por el mismo
              // callback). Si había un envío en cola, ese token ya no va a
              // llegar: se corta aquí en vez de dejar el botón girando hasta
              // que venza el plazo. Nuestro propio `resetTurnstile()` también
              // pasa por aquí, pero siempre con la cola ya vacía.
              if (awaitingCaptcha) {
                setAwaitingCaptcha(false)
                setCaptchaInteractive(false)
                setServerError(
                  "La verificación de seguridad expiró. Intenta de nuevo."
                )
              }
            }}
            onInteractive={() => setCaptchaInteractive(true)}
            className="pt-1"
          />

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
                  resetTurnstile()
                }}
                className="order-2 text-[13px] text-neutral-600 underline-offset-2 hover:underline sm:order-1"
              >
                Cambiar correo
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="order-1 ml-auto inline-flex h-12 w-full items-center justify-center gap-2.5 bg-neutral-900 px-12 text-[13px] tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2 sm:w-auto"
            >
              {busy ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : null}
              <span>
                {awaitingCaptcha
                  ? "VERIFICANDO…"
                  : loading
                    ? step === "email"
                      ? "VERIFICANDO…"
                      : "ENTRANDO…"
                    : "CONTINUAR"}
              </span>
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
