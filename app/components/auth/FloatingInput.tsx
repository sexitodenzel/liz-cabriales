"use client"

import { forwardRef, useId, useState } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string
  required?: boolean
  error?: string | null
  /** Pinta label + border en rojo sin mostrar mensaje. Útil para grupos con un mensaje compartido. */
  invalid?: boolean
  helper?: ReactNode
  rightSlot?: ReactNode
  containerClassName?: string
}

/**
 * Input estilo Hermès / Dior: label flotante (placeholder gris que se achica
 * arriba al focus o cuando hay valor) + borde inferior. Soporta error en rojo
 * con texto "Información necesaria" + helper de formato esperado.
 */
const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput(
    {
      label,
      required,
      error,
      invalid,
      helper,
      rightSlot,
      containerClassName = "",
      id: idProp,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      className = "",
      type = "text",
      ...rest
    },
    ref
  ) {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const [focused, setFocused] = useState(false)
    // Campos de contraseña: botón para mostrar/ocultar el texto.
    const isPassword = type === "password"
    const [revealed, setRevealed] = useState(false)
    const effectiveType = isPassword ? (revealed ? "text" : "password") : type
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (typeof value === "string") return value
      if (typeof defaultValue === "string") return defaultValue
      return ""
    })

    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value ?? "") : internalValue
    const hasValue = currentValue.length > 0
    const float = focused || hasValue
    const hasError = Boolean(error) || Boolean(invalid)
    const showErrorMessage = Boolean(error)

    const labelColor = hasError
      ? "text-red-600"
      : float
      ? "text-neutral-700"
      : "text-neutral-500"

    const borderColor = hasError
      ? "border-red-500"
      : focused
      ? "border-neutral-900"
      : "border-neutral-300"

    return (
      <div className={`relative ${containerClassName}`}>
        <div className={`relative border-b ${borderColor} transition-colors`}>
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-0 origin-left transition-all duration-200 ease-out ${labelColor} ${
              float
                ? "top-1 text-[11px] tracking-wide"
                : "top-1/2 -translate-y-1/2 text-[15px]"
            }`}
          >
            {label}
            {required ? " *" : ""}
          </label>

          <div className="flex items-end gap-2">
            <input
              ref={ref}
              id={id}
              type={effectiveType}
              required={required}
              aria-invalid={hasError || undefined}
              aria-describedby={
                hasError ? `${id}-error` : helper ? `${id}-helper` : undefined
              }
              value={value}
              defaultValue={defaultValue}
              onChange={(event) => {
                if (!isControlled) setInternalValue(event.target.value)
                onChange?.(event)
              }}
              onFocus={(event) => {
                setFocused(true)
                onFocus?.(event)
              }}
              onBlur={(event) => {
                setFocused(false)
                onBlur?.(event)
              }}
              className={`peer min-w-0 flex-1 bg-transparent pb-2 pt-5 text-[15px] text-neutral-900 outline-none placeholder:text-transparent ${className}`}
              {...rest}
            />
            {isPassword ? (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={revealed}
                className="pb-2 text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:text-neutral-900 focus:outline-none"
                tabIndex={-1}
              >
                {revealed ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            ) : null}
            {rightSlot ? <div className="pb-2">{rightSlot}</div> : null}
          </div>
        </div>

        {showErrorMessage ? (
          <p id={`${id}-error`} className="mt-2 text-[12px] text-red-600">
            {error}
          </p>
        ) : null}
        {helper ? (
          <p
            id={`${id}-helper`}
            className="mt-1 text-[12px] text-neutral-600"
          >
            {helper}
          </p>
        ) : null}
      </div>
    )
  }
)

export default FloatingInput
