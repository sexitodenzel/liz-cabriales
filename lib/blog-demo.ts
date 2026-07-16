/**
 * Posts de demostración para el blog. Sirven para previsualizar el diseño de la
 * sección (mismas cards que academia/tienda) con imágenes placeholder mientras
 * aún no se corre `docs/delivery/sql-blog.sql` ni se cargan artículos reales.
 *
 * En cuanto `blog_posts` tenga al menos una fila activa, la capa de datos deja
 * de usar estos demos automáticamente (ver `lib/supabase/blog.ts`). No requiere
 * limpieza manual.
 */

import type { BlogPost } from "@/lib/supabase/blog"

type DemoSeed = {
  title: string
  slug: string
  category: string
  excerpt: string
  body: string
  /** Semilla para la imagen placeholder (picsum). */
  imageSeed: string
  published_at: string
}

const DEMO_SEEDS: DemoSeed[] = [
  // ── Nail Art ──────────────────────────────────────────────────────────────
  {
    title: "Encapsulado de flores secas paso a paso",
    slug: "encapsulado-flores-secas",
    category: "Nail Art",
    excerpt:
      "Aprende a sellar flores naturales dentro del gel para lograr un acabado transparente, duradero y de aspecto profesional.",
    body: "## Materiales que vas a necesitar\n\n- Gel constructor transparente\n- Flores secas prensadas\n- Pinza de punta fina\n\n## El proceso\n\nAplica una capa fina de gel, coloca la flor con la pinza y sella con una segunda capa antes de curar. La clave está en no saturar el diseño.",
    imageSeed: "nailart1",
    published_at: "2026-07-10",
  },
  {
    title: "Degradado francés en tonos nude",
    slug: "degradado-frances-nude",
    category: "Nail Art",
    excerpt:
      "La versión moderna del clásico francés: un degradado suave que estiliza la mano y combina con cualquier look.",
    body: "## Por qué funciona\n\nEl nude alarga visualmente el dedo y el degradado difumina la línea de la sonrisa para un efecto natural.\n\n## Tip de esponja\n\nUsa una esponja de maquillaje para transferir el color y difuminar antes de sellar.",
    imageSeed: "nailart2",
    published_at: "2026-06-28",
  },
  {
    title: "Efecto mármol con acuarela",
    slug: "efecto-marmol-acuarela",
    category: "Nail Art",
    excerpt:
      "Vetas suaves y orgánicas que imitan la piedra natural, logradas con gel acuarela y un pincel de detalle.",
    body: "## La técnica\n\nDeja caer gotas de color sobre una base húmeda y arrástralas con un pincel fino para formar las vetas.\n\n## Acabado\n\nSella con top brillante para resaltar la profundidad del mármol.",
    imageSeed: "nailart3",
    published_at: "2026-06-12",
  },
  {
    title: "Chrome espejo: guía para principiantes",
    slug: "chrome-espejo-principiantes",
    category: "Nail Art",
    excerpt:
      "Todo lo que necesitas saber para lograr el acabado espejo perfecto sin manchas ni opacidades.",
    body: "## El secreto\n\nEl pigmento chrome se activa sobre un top no-wipe bien curado y frío.\n\n## Aplicación\n\nFrota el polvo con un aplicador de silicón hasta que la uña quede completamente reflejante.",
    imageSeed: "nailart4",
    published_at: "2026-05-30",
  },

  // ── Bioseguridad ──────────────────────────────────────────────────────────
  {
    title: "Protocolo de esterilización de tu equipo",
    slug: "protocolo-esterilizacion-equipo",
    category: "Bioseguridad",
    excerpt:
      "Del lavado inicial al autoclave: la rutina completa para que tu instrumental quede libre de microorganismos entre clienta y clienta.",
    body: "## Los tres pasos\n\n1. **Limpieza:** retira residuos con cepillo y detergente enzimático.\n2. **Desinfección:** sumerge en solución de alto nivel.\n3. **Esterilización:** autoclave o calor seco según el material.\n\n## Registro\n\nLleva una bitácora de ciclos: es tu respaldo ante cualquier revisión.",
    imageSeed: "bioseg1",
    published_at: "2026-07-05",
  },
  {
    title: "Guía de bioseguridad para tu cabina",
    slug: "guia-bioseguridad-cabina",
    category: "Bioseguridad",
    excerpt:
      "Ventilación, superficies, desechos y equipo de protección: lo esencial para una cabina segura para ti y tus clientas.",
    body: "## Superficies\n\nDesinfecta mesa, lámpara y apoyabrazos entre cada servicio.\n\n## Protección personal\n\nCubrebocas y guantes no son opcionales al trabajar con limado y químicos.",
    imageSeed: "bioseg2",
    published_at: "2026-06-20",
  },
  {
    title: "Manejo correcto de residuos en cabina",
    slug: "manejo-residuos-cabina",
    category: "Bioseguridad",
    excerpt:
      "Cortopunzante, algodón contaminado y químicos: cómo separar y desechar cada tipo de residuo de forma segura.",
    body: "## Separa por tipo\n\nDestina contenedores distintos para cortopunzante, residuos comunes y químicos.\n\n## Cortopunzante\n\nUsa siempre un contenedor rígido rotulado y nunca lo llenes por completo.",
    imageSeed: "bioseg3",
    published_at: "2026-06-08",
  },
  {
    title: "Lavado de manos y guantes: lo que sí importa",
    slug: "lavado-manos-guantes",
    category: "Bioseguridad",
    excerpt:
      "El guante no reemplaza el lavado. Repasamos la técnica correcta y cuándo cambiarlos durante el servicio.",
    body: "## Antes y después\n\nLava tus manos con técnica completa antes de calzar el guante y al retirarlo.\n\n## Cambio de guantes\n\nCámbialos entre clientas y siempre que se contaminen o rompan.",
    imageSeed: "bioseg4",
    published_at: "2026-05-25",
  },

  // ── Tendencias ────────────────────────────────────────────────────────────
  {
    title: "Uñas aura: el efecto que domina 2026",
    slug: "unas-aura-2026",
    category: "Tendencias",
    excerpt:
      "El difuminado en halo de color que se viralizó llegó para quedarse. Te contamos cómo lograrlo y con qué combinarlo.",
    body: "## Qué es\n\nUn punto de color aerografiado o difuminado que crea un halo luminoso al centro de la uña.\n\n## Paletas del momento\n\nDurazno con crema, lila con blanco y verde agua con nude.",
    imageSeed: "tend1",
    published_at: "2026-07-12",
  },
  {
    title: "Chrome y cat eye: el dúo del año",
    slug: "chrome-cat-eye-duo",
    category: "Tendencias",
    excerpt:
      "Dos acabados metálicos que se llevan mejor juntos. Ideas para mezclarlos sin saturar el diseño.",
    body: "## La combinación\n\nReserva el cat eye para una uña de acento y deja el resto en chrome espejo.\n\n## Cuidado del top\n\nSella siempre con top no-wipe para que el brillo no pierda intensidad.",
    imageSeed: "tend2",
    published_at: "2026-06-15",
  },
  {
    title: "Micro-french: la manicura minimalista",
    slug: "micro-french-minimalista",
    category: "Tendencias",
    excerpt:
      "La línea de la sonrisa más fina posible: elegante, discreta y favorecedora en cualquier largo de uña.",
    body: "## La clave\n\nUna línea ultrafina en la punta, hecha con pincel de detalle y pulso firme.\n\n## Combínalo\n\nSobre base nude o lechosa para el efecto más limpio.",
    imageSeed: "tend3",
    published_at: "2026-05-20",
  },
  {
    title: "Tonos jelly: el acabado gelatina",
    slug: "tonos-jelly-gelatina",
    category: "Tendencias",
    excerpt:
      "Color translúcido y jugoso que deja ver la uña. Perfecto para un look fresco de temporada.",
    body: "## Cómo se logra\n\nCapas finas de gel translúcido pigmentado que construyen color sin perder transparencia.\n\n## Mejores tonos\n\nCereza, mandarina y uva funcionan increíble en jelly.",
    imageSeed: "tend4",
    published_at: "2026-05-10",
  },

  // ── Novedades ─────────────────────────────────────────────────────────────
  {
    title: "Nueva colección de geles de invierno",
    slug: "coleccion-geles-invierno",
    category: "Novedades",
    excerpt:
      "Doce tonos fríos y cálidos pensados para la temporada, con la pigmentación y cobertura que ya conoces.",
    body: "## Lo nuevo\n\nDoce tonos que van del vino profundo al blanco nieve, todos con acabado cremoso en una sola capa.\n\n## Disponibilidad\n\nYa puedes encontrarlos en la tienda, por unidad o en set completo.",
    imageSeed: "nov1",
    published_at: "2026-07-14",
  },
  {
    title: "Llega la línea profesional a la tienda",
    slug: "linea-profesional-tienda",
    category: "Novedades",
    excerpt:
      "Instrumental, insumos y equipo de nivel profesional, ahora disponibles para que surtas tu cabina en un solo lugar.",
    body: "## Qué incluye\n\nLámparas, cabinas de aspiración, fresas y consumibles de marcas seleccionadas.\n\n## Para alumnas\n\nSi tomaste un curso con nosotras, pregunta por las condiciones especiales.",
    imageSeed: "nov2",
    published_at: "2026-06-30",
  },
  {
    title: "Renovamos nuestro catálogo de fresas",
    slug: "renovamos-catalogo-fresas",
    category: "Novedades",
    excerpt:
      "Nuevas fresas de tungsteno y cerámica, con granos y formas para cada etapa del servicio.",
    body: "## Novedad\n\nAmpliamos las opciones de desbaste, cutícula y acabado con fresas de mayor durabilidad.\n\n## Cómo elegir\n\nGuíate por el color del anillo para identificar el grano de cada fresa.",
    imageSeed: "nov3",
    published_at: "2026-06-18",
  },
  {
    title: "Nuevos tops mate de larga duración",
    slug: "nuevos-tops-mate",
    category: "Novedades",
    excerpt:
      "Acabado aterciopelado que resiste el roce y no pierde el efecto mate con el uso diario.",
    body: "## Lo nuevo\n\nDos tops mate: uno sedoso y otro ultramate, ambos con gran resistencia al desgaste.\n\n## Tip\n\nAplica en capa fina y uniforme para un mate parejo sin zonas brillantes.",
    imageSeed: "nov4",
    published_at: "2026-06-05",
  },
]

export const DEMO_BLOG_POSTS: BlogPost[] = DEMO_SEEDS.map((seed, i) => ({
  id: `demo-${seed.slug}`,
  title: seed.title,
  slug: seed.slug,
  category: seed.category,
  excerpt: seed.excerpt,
  cover_image: `https://picsum.photos/seed/${seed.imageSeed}/800/533`,
  body: seed.body,
  is_active: true,
  sort_order: i,
  published_at: seed.published_at,
  created_at: seed.published_at,
  linked_products: [],
}))

export function getDemoBlogPosts(category?: string): BlogPost[] {
  const list = category
    ? DEMO_BLOG_POSTS.filter((p) => p.category === category)
    : DEMO_BLOG_POSTS
  return list
    .slice()
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
}

export function getDemoBlogPostBySlug(slug: string): BlogPost | null {
  return DEMO_BLOG_POSTS.find((p) => p.slug === slug) ?? null
}
