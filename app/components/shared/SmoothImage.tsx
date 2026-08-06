"use client"

import Image, { type ImageProps } from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

/** ¿next/image puede construir una URL a partir de este src sin lanzar? */
function isRenderableSrc(src: ImageProps["src"]): boolean {
  // StaticImport (import estático de imagen) siempre es válido.
  if (typeof src !== "string") return Boolean(src)
  const s = src.trim()
  if (!s) return false
  // Rutas locales / data / blob las acepta next/image sin construir URL remota.
  if (s.startsWith("/") || s.startsWith("data:") || s.startsWith("blob:")) return true
  try {
    new URL(s)
    return true
  } catch {
    return false
  }
}

/* Wrapper de next/image con el fade-in de la tienda (ProductImageScroller):
   opacity 0 → 100 en 700ms al terminar de cargar. Reutilizable en todo el
   sitio para que las imágenes entren parejas y suaves en vez de aparecer de
   golpe sobre el recuadro placeholder.

   El fade va por `style` (no por clase) a propósito: así no choca con las
   clases `transition-transform` de las imágenes que ya tienen hover-zoom u
   otras transiciones — opacity y transform conviven sin pelearse por
   `transition-property`.

   Maneja imágenes YA cacheadas o lazy: el onLoad de React a veces se pierde
   (caché / loading=lazy / hydration), así que en el mount revisamos
   `img.complete` y además escuchamos los eventos load/error nativos. */
export default function SmoothImage({
  onLoad,
  onError,
  style,
  unoptimized,
  src,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Callback ref: se ejecuta con el <img> real en cuanto monta (más fiable que
  // useRef+useEffect para "ya estaba cargada al montar"). Si next/image sí
  // forwardea el ref, revelamos al instante sin esperar eventos.
  const setImgEl = useCallback((el: HTMLImageElement | null) => {
    imgRef.current = el
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }, [])

  // /api/nail-art/image/* responde 302 a signed URL: el optimizer de Next
  // no debe intentar reescribir esa ruta (rompe covers UGC).
  const srcStr = typeof src === "string" ? src : ""
  const skipOptimize =
    Boolean(unoptimized) || srcStr.startsWith("/api/nail-art/image/")

  useEffect(() => {
    const img = imgRef.current
    const reveal = () => setLoaded(true)

    if (img) {
      // Ya cargó antes de que ligáramos eventos (caché / hydration / eager):
      // revélala de una.
      if (img.complete) {
        setLoaded(true)
        return
      }
      // `error` también revela: una imagen rota no debe quedar invisible eterna.
      img.addEventListener("load", reveal)
      img.addEventListener("error", reveal)
    }

    // Fallback duro, INDEPENDIENTE del ref y de los eventos. Garantiza que
    // NINGUNA imagen quede invisible: si el ref no se forwardeó o el `load` se
    // perdió (p. ej. covers /api/nail-art/image con redirect 302, o imágenes
    // que cargaron antes de hidratar), la revela igual tras un breve margen.
    const fallback = window.setTimeout(() => setLoaded(true), 300)

    return () => {
      if (img) {
        img.removeEventListener("load", reveal)
        img.removeEventListener("error", reveal)
      }
      window.clearTimeout(fallback)
    }
  }, [srcStr])

  // Guarda contra src inválido: next/image hace `new URL(src)` internamente y
  // un src vacío / undefined / ruta relativa no-absoluta lanza
  // "Failed to construct 'URL': Invalid URL", que tumba TODO el árbol de React.
  // Un wrapper compartido no debe reventar la página por una imagen faltante;
  // si no hay src usable no renderiza nada (los contenedores ya traen su
  // placeholder bg-neutral-100).
  if (!isRenderableSrc(src)) return null

  return (
    <Image
      ref={setImgEl}
      src={src}
      {...props}
      unoptimized={skipOptimize}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        setLoaded(true)
        onError?.(event)
      }}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        // Incluye transform para que las imágenes con hover-zoom (que traen
        // `transition-transform` en su className) sigan animando: el inline
        // `transition` sobrescribe al de la clase, así que lo cubrimos aquí.
        transition: "opacity 700ms ease-out, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  )
}
