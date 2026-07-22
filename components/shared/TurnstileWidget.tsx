"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

const SCRIPT_ID = "cf-turnstile-script"
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      theme?: "light" | "dark" | "auto"
      size?: "normal" | "flexible" | "compact"
      callback?: (token: string) => void
      "expired-callback"?: () => void
      "error-callback"?: () => void
    }
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void
  getToken: () => string | null
}

type Props = {
  onToken: (token: string | null) => void
  className?: string
  /** Tema del widget; por defecto light para fondos claros del sitio. */
  theme?: "light" | "dark" | "auto"
}

function loadTurnstileScript(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile solo funciona en el navegador"))
  }
  if (window.turnstile) return Promise.resolve(window.turnstile)

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (window.turnstile) resolve(window.turnstile)
        else reject(new Error("Turnstile no disponible"))
      }
      if (window.turnstile) {
        resolve(window.turnstile)
        return
      }
      existing.addEventListener("load", check, { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar Turnstile")),
        { once: true }
      )
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error("Turnstile no disponible"))
    }
    script.onerror = () => reject(new Error("No se pudo cargar Turnstile"))
    document.head.appendChild(script)
  })
}

/**
 * Widget de Cloudflare Turnstile.
 * El token es de un solo uso: tras enviarlo al backend llama a `ref.reset()`.
 */
const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(
  function TurnstileWidget({ onToken, className = "", theme = "light" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const tokenRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
      onTokenRef.current = onToken
    }, [onToken])

    useImperativeHandle(ref, () => ({
      reset() {
        tokenRef.current = null
        onTokenRef.current(null)
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
      getToken() {
        return tokenRef.current
      },
    }))

    useEffect(() => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      if (!siteKey) {
        setLoadError("Falta NEXT_PUBLIC_TURNSTILE_SITE_KEY.")
        return
      }

      let cancelled = false

      loadTurnstileScript()
        .then((api) => {
          if (cancelled || !containerRef.current) return
          if (widgetIdRef.current) {
            try {
              api.remove(widgetIdRef.current)
            } catch {
              // ignore
            }
            widgetIdRef.current = null
          }

          widgetIdRef.current = api.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size: "flexible",
            callback: (token) => {
              tokenRef.current = token
              onTokenRef.current(token)
            },
            "expired-callback": () => {
              tokenRef.current = null
              onTokenRef.current(null)
            },
            "error-callback": () => {
              tokenRef.current = null
              onTokenRef.current(null)
            },
          })
          setLoadError(null)
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError(
              "No se pudo cargar la verificación de seguridad. Recarga la página."
            )
          }
        })

      return () => {
        cancelled = true
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // ignore
          }
          widgetIdRef.current = null
        }
      }
    }, [theme])

    return (
      <div className={className}>
        <div ref={containerRef} />
        {loadError ? (
          <p className="mt-2 text-[12px] text-red-600" role="alert">
            {loadError}
          </p>
        ) : null}
      </div>
    )
  }
)

export default TurnstileWidget
