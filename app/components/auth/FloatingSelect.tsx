"use client"

import { forwardRef, useId, useState } from "react"
import type { SelectHTMLAttributes, ReactNode } from "react"

type FloatingSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "placeholder"> & {
  label: string
  required?: boolean
  error?: string | null
  /** Pinta label + border en rojo sin mostrar mensaje. Útil para grupos con un mensaje compartido. */
  invalid?: boolean
  helper?: ReactNode
  containerClassName?: string
}

const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
  function FloatingSelect(
    {
      label,
      required,
      error,
      invalid,
      helper,
      containerClassName = "",
      id: idProp,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      className = "",
      children,
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

          <select
            ref={ref}
            id={id}
            required={required}
            aria-invalid={hasError || undefined}
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
            className={`w-full appearance-none bg-transparent pb-2 pt-5 pr-6 text-[15px] outline-none [&>option]:bg-white [&>option]:text-neutral-900 ${
              hasValue ? "text-neutral-900" : "text-transparent"
            } ${className}`}
            {...rest}
          >
            {children}
          </select>

          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500">
            ▾
          </span>
        </div>

        {showErrorMessage ? (
          <p className="mt-2 text-[12px] text-red-600">{error}</p>
        ) : null}
        {helper ? (
          <p className="mt-1 text-[12px] text-neutral-600">{helper}</p>
        ) : null}
      </div>
    )
  }
)

export default FloatingSelect
