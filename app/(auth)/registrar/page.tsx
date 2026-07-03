"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { authEmailSchema } from "@/lib/validations/auth"
import { normalizePhoneInput } from "@/lib/validations/phone"
import FloatingInput from "@/app/components/auth/FloatingInput"
import FloatingSelect from "@/app/components/auth/FloatingSelect"

type FieldErrors = Record<string, string>

const TREATMENTS = [
  { value: "sra", label: "Sra." },
  { value: "sr", label: "Sr." },
  { value: "srta", label: "Srta." },
]

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const PASSWORD_RULES: Array<{ label: string; test: (v: string) => boolean }> = [
  { label: "Debe incluir como mínimo 10 caracteres", test: (v) => v.length >= 10 },
  { label: "Debe incluir como mínimo 1 cifra", test: (v) => /\d/.test(v) },
  {
    label: "Debe incluir como mínimo 1 letra mayúscula",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    label: "Debe incluir como mínimo 1 letra minúscula",
    test: (v) => /[a-z]/.test(v),
  },
  {
    label: "Debe incluir como mínimo 1 carácter especial",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
]

export default function RegistrarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const initialEmail = searchParams.get("email") ?? ""
  const nextParam = searchParams.get("next")
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [password, setPassword] = useState("")
  const [showPasswordRules, setShowPasswordRules] = useState(false)

  const [treatment, setTreatment] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSentCount, setCodeSentCount] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    const arr: number[] = []
    for (let y = current - 18; y >= current - 100; y--) arr.push(y)
    return arr
  }, [])

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const n = { ...prev }
      delete n[field]
      return n
    })
  }

  async function handleSendCode() {
    setServerError(null)
    const parsed = authEmailSchema.safeParse(email)
    if (!parsed.success) {
      setErrors((prev) => ({ ...prev, email: "Información necesaria" }))
      return
    }
    clearError("email")
    setSendingCode(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { shouldCreateUser: true },
      })
      if (error) {
        const rateMatch = /after (\d+) seconds?/i.exec(error.message)
        if (rateMatch) {
          const waitSec = Number(rateMatch[1])
          setResendCooldown(waitSec)
          setServerError(
            `Espera ${waitSec} segundos antes de pedir otro código.`
          )
        } else {
          setServerError(error.message)
        }
        return
      }
      setEmail(parsed.data)
      setCodeSentCount((n) => n + 1)
      setResendCooldown(120)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar el código."
      setServerError(message)
    } finally {
      setSendingCode(false)
    }
  }

  function validateBirthDate(
    d: string,
    m: string,
    y: string
  ): { ok: true } | { ok: false; reason: "incomplete" | "invalid" | "underage" } {
    if (!d || !m || !y) return { ok: false, reason: "incomplete" }
    const dayNum = Number(d)
    const monthNum = Number(m)
    const yearNum = Number(y)
    if (
      !Number.isFinite(dayNum) ||
      !Number.isFinite(monthNum) ||
      !Number.isFinite(yearNum)
    ) {
      return { ok: false, reason: "invalid" }
    }
    const dt = new Date(yearNum, monthNum - 1, dayNum)
    if (
      dt.getFullYear() !== yearNum ||
      dt.getMonth() !== monthNum - 1 ||
      dt.getDate() !== dayNum
    ) {
      return { ok: false, reason: "invalid" }
    }
    const now = new Date()
    const eighteenthBirthday = new Date(
      yearNum + 18,
      monthNum - 1,
      dayNum
    )
    if (now < eighteenthBirthday) return { ok: false, reason: "underage" }
    return { ok: true }
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {}

    if (!email.trim()) {
      errs.email = "Información necesaria"
    } else if (!authEmailSchema.safeParse(email).success) {
      errs.email =
        "Indique un correo electrónico válido. Ejemplo: nombreapellidos@dominio.com"
    }

    if (!code) {
      errs.code = "Información necesaria"
    } else if (!/^\d{6,10}$/.test(code)) {
      errs.code = "El código debe tener 6 dígitos. Ejemplo: 123456"
    }

    if (!password) {
      errs.password = "Información necesaria"
    } else if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
      errs.password = "La contraseña no cumple los criterios indicados arriba."
    }

    if (!treatment) errs.treatment = "Información necesaria"
    if (!firstName.trim()) errs.firstName = "Información necesaria"
    if (!lastName.trim()) errs.lastName = "Información necesaria"

    if (!phone) {
      errs.phone = "Información necesaria"
    } else if (phone.replace(/\D/g, "").length < 8) {
      errs.phone = "Indique un número con al menos 8 dígitos. Ejemplo: 5512345678"
    }

    const birth = validateBirthDate(birthDay, birthMonth, birthYear)
    if (!birth.ok) {
      errs.birthDate =
        birth.reason === "underage"
          ? "Debe ser mayor de 18 años para crear una cuenta."
          : "¡Vaya! Indique un día (DD), un mes y un año (AAAA) válidos. Ejemplo: 22 de marzo de 1999"
    }

    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })
      if (verifyError || !verifyData.user) {
        const raw = verifyError?.message ?? ""
        const friendly = /expired|invalid|token/i.test(raw)
          ? "Código incorrecto o expirado. Intenta de nuevo."
          : raw || "Código incorrecto o expirado. Intenta de nuevo."
        setServerError(friendly)
        setErrors((prev) => ({ ...prev, code: "Código incorrecto o expirado" }))
        return
      }

      const phoneE164 = phone.startsWith("+") ? phone : `+52${phone.replace(/\D/g, "")}`
      const birthDate =
        birthDay && birthMonth && birthYear
          ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
          : null

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          treatment,
          birth_date: birthDate,
          marketing_opt_in: marketingOptIn,
        },
      })
      if (passwordError) {
        setServerError(passwordError.message)
        return
      }

      const userId = verifyData.user.id
      const { error: profileError } = await supabase
        .from("users")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phoneE164,
        })
        .eq("id", userId)

      if (profileError) {
        console.warn("[registrar] No se pudo guardar el perfil completo:", profileError)
      }

      router.push(safeNext ?? "/")
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear la cuenta."
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-neutral-100 px-6 py-10 sm:px-14 sm:py-14">
        <h1 className="mb-3 font-[family-name:var(--font-cormorant-garamond)] text-xl tracking-[0.25em] text-neutral-900 sm:text-2xl">
          CREAR UNA CUENTA
        </h1>
        <p className="mb-8 text-[13px] text-neutral-700">
          Al crear una cuenta, acepta los{" "}
          <Link href="/terminos" className="underline">
            Términos y Condiciones Generales de Uso
          </Link>{" "}
          y da su consentimiento al tratamiento de sus datos, de conformidad con
          la{" "}
          <Link href="/privacidad" className="underline">
            Política de Confidencialidad
          </Link>{" "}
          de Liz Cabriales.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10" noValidate>
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
            <section className="space-y-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-medium text-neutral-900">
                  Datos de conexión
                </h2>
                <span className="text-[11px] text-neutral-500">
                  * Información necesaria
                </span>
              </div>

              <div className="flex items-end gap-3">
                <FloatingInput
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError("email")
                  }}
                  error={errors.email}
                  containerClassName="flex-1"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || resendCooldown > 0}
                  className="mb-3 inline-flex h-11 items-center justify-center whitespace-nowrap bg-neutral-900 px-4 text-[11px] tracking-[0.15em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingCode
                    ? "ENVIANDO…"
                    : resendCooldown > 0
                    ? `VOLVER A ENVIAR (${resendCooldown})`
                    : codeSentCount > 0
                    ? "VOLVER A ENVIAR"
                    : "ENVIAR EL CÓDIGO"}
                </button>
              </div>

              {codeSentCount > 0 ? (
                <p
                  role="status"
                  className="text-[13px] text-neutral-700"
                >
                  Código de verificación enviado
                </p>
              ) : null}

              <div>
                <FloatingInput
                  label="Código de verificación"
                  type={showCode ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 10))
                    clearError("code")
                  }}
                  error={errors.code}
                  helper={
                    !errors.code
                      ? "Ingresa el código que recibiste por correo"
                      : null
                  }
                />
                <div className="mt-2 flex items-center justify-end text-[12px]">
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    className="underline-offset-2 hover:underline"
                  >
                    {showCode ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <FloatingInput
                  label="Contraseña"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError("password")
                  }}
                  onFocus={() => setShowPasswordRules(true)}
                  error={errors.password}
                />
                {showPasswordRules ? (
                  <div className="mt-3 bg-[#f4f1ec] p-4">
                    <p className="mb-2 text-[12px] text-neutral-700">
                      Por su seguridad, le invitamos a que introduzca su
                      contraseña respetando los siguientes criterios:
                    </p>
                    <ul className="grid grid-cols-1 gap-1 text-[12px] text-neutral-600 sm:grid-cols-2">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(password)
                        return (
                          <li
                            key={rule.label}
                            className={ok ? "text-neutral-900" : ""}
                          >
                            {ok ? "✓" : "•"} {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-7">
              <h2 className="text-[15px] font-medium text-neutral-900">
                Datos personales
              </h2>

              <FloatingSelect
                label="Tratamiento"
                required
                value={treatment}
                onChange={(e) => {
                  setTreatment(e.target.value)
                  clearError("treatment")
                }}
                error={errors.treatment}
              >
                <option value="" disabled hidden />
                {TREATMENTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </FloatingSelect>

              <FloatingInput
                label="Nombre"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  clearError("firstName")
                }}
                error={errors.firstName}
              />

              <FloatingInput
                label="Apellidos"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  clearError("lastName")
                }}
                error={errors.lastName}
              />

              <div className="grid grid-cols-[110px_1fr] gap-3">
                <FloatingSelect
                  label="Indicativo"
                  required
                  value="+52"
                  onChange={() => undefined}
                  disabled
                >
                  <option value="+52">🇲🇽 +52</option>
                </FloatingSelect>
                <FloatingInput
                  label="Número de teléfono"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(normalizePhoneInput(e.target.value))
                    clearError("phone")
                  }}
                  error={errors.phone}
                  helper={
                    !errors.phone
                      ? "Formato esperado: número de teléfono con al menos 8 dígitos"
                      : null
                  }
                />
              </div>

              <div>
                <p
                  className={`mb-3 text-[13px] ${
                    errors.birthDate ? "text-red-600" : "text-neutral-700"
                  }`}
                >
                  Fecha de nacimiento
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <FloatingSelect
                    label="Día"
                    value={birthDay}
                    invalid={Boolean(errors.birthDate)}
                    onChange={(e) => {
                      setBirthDay(e.target.value)
                      clearError("birthDate")
                    }}
                  >
                    <option value="" disabled hidden />
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}
                      </option>
                    ))}
                  </FloatingSelect>
                  <FloatingSelect
                    label="Mes"
                    value={birthMonth}
                    invalid={Boolean(errors.birthDate)}
                    onChange={(e) => {
                      setBirthMonth(e.target.value)
                      clearError("birthDate")
                    }}
                  >
                    <option value="" disabled hidden />
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={String(idx + 1)}>
                        {m}
                      </option>
                    ))}
                  </FloatingSelect>
                  <FloatingSelect
                    label="Año"
                    value={birthYear}
                    invalid={Boolean(errors.birthDate)}
                    onChange={(e) => {
                      setBirthYear(e.target.value)
                      clearError("birthDate")
                    }}
                  >
                    <option value="" disabled hidden />
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </FloatingSelect>
                </div>
                {errors.birthDate ? (
                  <p className="mt-2 text-[12px] text-red-600" role="alert">
                    {errors.birthDate}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-neutral-600">
                    Introduzca una fecha de nacimiento válida que confirme que
                    tenga 18 años como mínimo.
                  </p>
                )}
              </div>
            </section>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-[13px] text-neutral-700">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-neutral-900"
            />
            <span>
              Acepto recibir por correo electrónico información relativa a las
              ofertas, servicios, productos y eventos de Liz Cabriales, de
              conformidad con la{" "}
              <Link href="/privacidad" className="underline">
                Política de Confidencialidad
              </Link>
              .
            </span>
          </label>
          <p className="text-[12px] text-neutral-600">
            Puede cancelar la suscripción en cualquier momento en su cuenta, o
            haciendo clic en el enlace que se encuentra en la parte inferior de
            todos nuestros mensajes.
          </p>

          {serverError ? (
            <p className="text-[13px] text-red-600" role="alert">
              {serverError}
            </p>
          ) : null}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full max-w-md items-center justify-center bg-neutral-900 px-12 text-[13px] tracking-[0.2em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "CREANDO CUENTA…" : "CREAR UNA CUENTA"}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-neutral-700">
        ¿Ya tiene cuenta?{" "}
        <Link
          href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          className="underline-offset-2 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
