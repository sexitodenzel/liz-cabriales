"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useRef, useState } from "react"

/* Wrapper de next/image con el fade-in de la tienda (ProductImageScroller):
   opacity 0 → 100 en 700ms al terminar de cargar. Reutilizable en todo el
   sitio para que las imágenes entren parejas y suaves en vez de aparecer de
   golpe sobre el recuadro placeholder.

   El fade va por `style` (no por clase) a propósito: así no choca con las
   clases `transition-transform` de las imágenes que ya tienen hover-zoom u
   otras transiciones — opacity y transform conviven sin pelearse por
   `transition-property`.

   Maneja imágenes YA cacheadas: cuando el navegador la tiene en caché,
   `onLoad` puede dispararse antes de que React ligue el handler, así que en el
   mount revisamos `img.complete` para marcarla cargada sin parpadeo. */
export default function SmoothImage({
  onLoad,
  style,
  unoptimized,
  src,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // /api/nail-art/image/* responde 302 a signed URL: el optimizer de Next
  // no debe intentar reescribir esa ruta (rompe covers UGC).
  const srcStr = typeof src === "string" ? src : ""
  const skipOptimize =
    Boolean(unoptimized) || srcStr.startsWith("/api/nail-art/image/")

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  return (
    <Image
      ref={imgRef}
      src={src}
      {...props}
      unoptimized={skipOptimize}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
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
