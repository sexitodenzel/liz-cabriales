"use client"

import { forwardRef, useId, useState } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: string
  required?: boolean
  error?: string | null
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
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (typeof value === "string") return value
      if (typeof defaultValue === "string") return defaultValue
      return ""
    })

    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value ?? "") : internalValue
    const hasValue = currentValue.length > 0
    const float = focused || hasValue
    const hasError = Boolean(error)

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
              type={type}
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
              className={`peer w-full bg-transparent pb-2 pt-5 text-[15px] text-neutral-900 outline-none placeholder:text-transparent ${className}`}
              {...rest}
            />
            {rightSlot ? <div className="pb-2">{rightSlot}</div> : null}
          </div>
        </div>

        {hasError ? (
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
