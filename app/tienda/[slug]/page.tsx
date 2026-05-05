import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getProductBySlug } from "@/lib/supabase/products"
import AddToCartButton from "../components/AddToCartButton"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await getProductBySlug(slug)

  if (!data) {
    return { title: "Producto no encontrado | Liz Cabriales" }
  }

  return {
    title: `${data.name} | Tienda | Liz Cabriales`,
    description: data.description ?? `Conoce ${data.name} en nuestra tienda.`,
  }
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0 })
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const { data: product, error } = await getProductBySlug(slug)

  if (error || !product) notFound()

  const image = product.images?.[0] ?? null

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <Link
          href="/tienda"
          className="inline-flex items-center text-sm font-medium text-[#a8862f] transition-colors hover:text-[#8f7120]"
        >
          Regresar a tienda
        </Link>

        <section className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-200" />
            )}
          </div>

          <div>
            {product.brand ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a8862f]">
                {product.brand}
              </p>
            ) : null}

            <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>

            <p className="mt-4 text-2xl font-bold">
              {formatPrice(product.base_price)}
              <span className="ml-2 text-sm font-medium text-neutral-500">
                MXN
              </span>
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AddToCartButton
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                brand={product.brand ?? null}
                image={image}
                basePrice={product.base_price}
                variants={product.variants}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              />
              <Link
                href="/carrito"
                className="inline-flex w-full items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#C9A84C] hover:text-[#a8862f]"
              >
                Ir al carrito
              </Link>
            </div>

            {product.description ? (
              <p className="mt-6 text-[15px] leading-7 text-neutral-700">
                {product.description}
              </p>
            ) : (
              <p className="mt-6 text-[15px] leading-7 text-neutral-500">
                Este producto no tiene descripción disponible por ahora.
              </p>
            )}

            {product.variants.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Variantes
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  {product.variants
                    .filter((variant) => variant.is_active)
                    .map((variant) => (
                      <li
                        key={variant.id}
                        className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2"
                      >
                        <span>{variant.variant_name}</span>
                        <span className="font-medium">
                          {formatPrice(variant.price)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
