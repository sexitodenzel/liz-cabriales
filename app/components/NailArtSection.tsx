import { getNailArtPosts } from "@/lib/supabase/nail-art"
import type { NailArtPost } from "@/lib/supabase/nail-art"
import NailArtShowcase, {
  type NailArtShowcaseTab,
} from "@/app/components/nail-art/NailArtShowcase"

/* Vitrina Nail Art del home (estilo "Summer Nail Art" de OPI). Construye las
   pestañas a partir de agrupaciones existentes —sin columnas nuevas—: los
   diseños destacados, los elaborados por el estudio y los más gustados. */

const PER_TAB = 12
const MIN_PER_TAB = 4

/* ── Demo hardcodeado ───────────────────────────────────────────────────────
   Mientras el estudio no haya subido diseños reales (tabla nail_art_posts
   vacía), mostramos una vitrina de ejemplo con imágenes de Unsplash para poder
   ver la sección en vivo. En cuanto exista ≥1 post real, esto se ignora. */

const DEMO_IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=640&q=80&auto=format&fit=crop`

function demoPost(
  n: number,
  title: string,
  imgId: string,
  editorial: boolean,
  likes: number,
  products: string[]
): NailArtPost {
  return {
    id: `demo-${n}`,
    title,
    slug: "#",
    description: null,
    cover_image: DEMO_IMG(imgId),
    is_active: true,
    sort_order: n,
    created_at: new Date(Date.now() - n * 86400000).toISOString(),
    author_display_name: "Liz Cabriales",
    status: "approved",
    is_editorial: editorial,
    likes_count: likes,
    linked_products: products.map((name, i) => ({
      id: `demo-${n}-p${i}`,
      usage_description: null,
      sort_order: i,
      product: { id: `demo-p-${n}-${i}`, name, slug: "#", images: null },
    })),
  }
}

function demoPosts(): NailArtPost[] {
  return [
    demoPost(1, "French Tip Dorado", "photo-1604654894610-df63bc536371", true, 128, ["Gel Blush", "Top Coat Glass"]),
    demoPost(2, "Ombré Nude", "photo-1607779097040-26e80aa78e66", true, 96, ["Base Rubber", "Nude 03"]),
    demoPost(3, "Cromo Espejo", "photo-1610992015732-2449b76344bc", false, 210, ["Polvo Chrome", "Sellador"]),
    demoPost(4, "Rosa Lechoso", "photo-1519014816548-bf5fe059798b", true, 74, ["Milky Pink", "Builder Gel"]),
    demoPost(5, "Aurora Glitter", "photo-1632345031435-8727f6897d53", false, 152, ["Flakes Aurora"]),
    demoPost(6, "Rojo Clásico", "photo-1522337660859-02fbefca4702", false, 188, ["Rojo Rubí", "Top No Wipe"]),
    demoPost(7, "Encapsulado Floral", "photo-1596462502278-27bfdc403348", true, 63, ["Builder Clear", "Foil Flores"]),
    demoPost(8, "Almendra Mate", "photo-1571290274554-6a2eaa771e5f", false, 141, ["Matte Top", "Taupe 07"]),
  ]
}

function byLikes(a: NailArtPost, b: NailArtPost) {
  return (
    b.likes_count - a.likes_count ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export default async function NailArtSection() {
  const real = await getNailArtPosts(36, "featured")
  // Sin diseños reales todavía → vitrina demo para poder ver la sección.
  const posts = real.length > 0 ? real : demoPosts()

  const editorial = posts.filter((p) => p.is_editorial).slice(0, PER_TAB)
  const populares = [...posts].filter((p) => p.likes_count > 0).sort(byLikes).slice(0, PER_TAB)

  const candidates: NailArtShowcaseTab[] = [
    { id: "destacados", label: "Destacados", posts: posts.slice(0, PER_TAB) },
    { id: "editorial", label: "Por Nosotros", posts: editorial },
    { id: "populares", label: "Más Gustados", posts: populares },
  ]

  // La primera pestaña (Destacados) siempre entra; las demás solo si tienen
  // suficientes diseños para llenar una fila.
  const tabs = candidates.filter(
    (t, i) => i === 0 || t.posts.length >= MIN_PER_TAB
  )

  return (
    <section className="py-12 md:py-16" aria-label="Inspiración Nail Art">
      <NailArtShowcase
        tabs={tabs}
        eyebrow="Inspiración"
        title="Nail Art"
        subtitle="Diseños creados con productos de nuestro catálogo. Encuentra el tuyo y recréalo en casa."
        ctaHref="/nail-art"
        ctaLabel="Ver todo el Nail Art"
      />
    </section>
  )
}
