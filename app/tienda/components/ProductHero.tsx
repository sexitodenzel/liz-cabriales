"use client"

import { useMemo, useRef, useState } from "react"

import type { ProductWithVariants } from "@/lib/supabase/products"
import type { ProductReviewSummary } from "@/lib/supabase/product-reviews"
import { useNavFollowParked } from "@/lib/hooks/use-nav-follow-parked"

import ProductImageScroller from "./ProductImageScroller"
import ProductInfoPanel from "./ProductInfoPanel"
import StickyCartBar from "./StickyCartBar"

function pickInitialVariantId(product: ProductWithVariants): string | null {
  const active = product.variants.filter((v) => v.is_active)
  const withStock = active.find((v) => v.stock > 0)
  if (withStock) return withStock.id
  return active[0]?.id ?? product.variants[0]?.id ?? null
}

type Props = {
  product: ProductWithVariants
  reviewSummary?: ProductReviewSummary
}

export default function ProductHero({ product, reviewSummary }: Props) {
  const heroRef = useRef<HTMLElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // Al agotar la columna de imágenes el panel se estaciona abajo; sin esto el
  // follow del colapso lo dejaba descansando 56px arriba del borde.
  const infoPaneRef = useNavFollowParked<HTMLElement>()
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() =>
    pickInitialVariantId(product)
  )

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null
    return product.variants.find((v) => v.id === selectedVariantId) ?? null
  }, [product.variants, selectedVariantId])

  const images = product.images ?? []

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 768px) {
              .lc-product-hero-grid {
                grid-template-columns: minmax(0, 1fr) 460px;
                column-gap: 80px;
                /* Hace del grid el contenedor de 100cqw (los overlays fixed
                   —lightbox, drawer— viven en portals, no los atrapa). */
                container-type: inline-size;
              }
              .lc-product-info-pane {
                position: sticky;
                top: calc(var(--navbar-actual-h, 64px) + 1.5rem);
                align-self: start;
                width: 100%;
                display: flex;
                /* La 1a imagen es cuadrada: su alto = ancho de la columna
                   izquierda (100cqw − panel − gap) menos el carril de dots
                   del scroller (w-6 + gap-6 = 48px). El panel iguala ese
                   alto y su contenido se centra a ese eje (justify-center
                   del wrapper interno). Si el contenido excede, gana la
                   altura natural (es solo min-height). */
                min-height: calc(100cqw - 588px);
              }
            }
            @media (min-width: 1280px) {
              .lc-product-hero-grid {
                grid-template-columns: minmax(0, 1fr) 480px;
                column-gap: 120px;
              }
              .lc-product-info-pane {
                min-height: calc(100cqw - 648px);
              }
            }
            /* El panel sigue al navbar SOLO en >=1200px: ahí es un sidebar
               sticky y el colapso sube apenas 56px (la fila de módulos
               permanece), con useNavFollowParked gestionando el fin de columna.
               En <1200px NO debe llevar la clase global .navbar-follow-collapse:
               en movil el panel esta en flujo y esa clase (regla max-width:
               1199.98px) lo traslada -(navbar + 100% de su alto) ≈ -487px sobre
               las imagenes y le pone pointer-events:none (boton Agregar
               inclickeable al hacer scroll). */
            @media (min-width: 1200px) {
              .lc-product-info-pane {
                transform: translate3d(0, 0, 0);
                transition: transform 360ms cubic-bezier(0.33, 1, 0.68, 1);
                will-change: transform;
              }
              html.lc-nav-collapsed .lc-product-info-pane {
                transform: translate3d(0, calc(-1 * var(--navbar-collapse-shift)), 0);
              }
              html.lc-nav-collapsed .lc-product-info-pane.lc-follow-parked {
                transform: translate3d(0, 0, 0);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .lc-product-info-pane {
                transition: none;
              }
            }
          `,
        }}
      />
      <section
        ref={heroRef}
        className="lc-product-hero-grid mt-6 grid grid-cols-1 gap-10 md:gap-12"
      >
        <div className="min-w-0">
          <ProductImageScroller images={images} alt={product.name} />
        </div>
        <aside
          ref={infoPaneRef}
          className="lc-product-info-pane md:max-w-[380px]"
        >
          <ProductInfoPanel
            product={product}
            selectedVariantId={selectedVariantId}
            onSelectVariant={setSelectedVariantId}
            reviewSummary={reviewSummary}
          />
        </aside>
      </section>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <StickyCartBar
        product={product}
        selectedVariant={selectedVariant}
        triggerRef={sentinelRef}
      />
    </>
  )
}
