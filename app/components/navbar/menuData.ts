/* =========================================
   DATOS DEL MENU
   ========================================= */

import { COURSE_EVENT_TYPES, EVENT_TYPE_LABEL } from "@/app/academia/event-types"

export type MenuItem = {
  label: string
  href: string
}

export type TiendaSubcategory = { label: string; href: string }

export type TiendaCategory = {
  label: string
  /** Id conceptual del menú (único). No siempre es una categoría real de BD. */
  slug: string
  href: string
  subcategories: TiendaSubcategory[]
  /**
   * Categorías REALES de la BD que agrupa esta entrada del menú. Se usa para
   * traer los productos destacados (preview) y para el link `?categoria=a,b`.
   * Si se omite, se asume [slug]. Un grupo como "Nail art" mapea a varias.
   * El link queda como /tienda?categoria=slugUno,slugDos.
   */
  categorySlugs?: string[]
}

/** Slugs reales para el fetch de preview / filtro. Cae a [slug] si no hay grupo. */
export function categorySlugsOf(cat: TiendaCategory): string[] {
  return cat.categorySlugs && cat.categorySlugs.length > 0
    ? cat.categorySlugs
    : [cat.slug]
}

// Menú CURADO por Mildred, pero cada entrada mapea a categorías REALES de la
// BD (`categorySlugs`). Los grupos (Nail art, Estructura, Accesorios, Cuidado
// de la piel, Producto podal) juntan varias categorías reales para que ninguna
// se pierda; sus subcategorías apuntan a la categoría real correspondiente y
// por eso SÍ filtran. Ver scripts/validate-menu-categories.mjs.
export const tiendaCategories: TiendaCategory[] = [
  // 1) Con subcategorías
  {
    label: "Esmaltes en gel",
    slug: "esmaltes-en-gel",
    categorySlugs: ["esmaltes-en-gel"],
    href: "/tienda?categoria=esmaltes-en-gel",
    // Subcategorías REALES (campo subcategory de los productos); el filtro
    // ?subcategoria= las matchea vía slugify. Ver validate-menu-categories.
    subcategories: [
      { label: "Gel semipermanente",     href: "/tienda?categoria=esmaltes-en-gel&subcategoria=gel-semipermanente" },
      { label: "Cat eye (Ojo de gato)",  href: "/tienda?categoria=esmaltes-en-gel&subcategoria=cat-eye" },
      { label: "Rubber base",            href: "/tienda?categoria=esmaltes-en-gel&subcategoria=rubber-base" },
      { label: "Gel Rubber",             href: "/tienda?categoria=esmaltes-en-gel&subcategoria=gel-rubber" },
      { label: "Top",                    href: "/tienda?categoria=esmaltes-en-gel&subcategoria=top" },
      { label: "Top Matte",              href: "/tienda?categoria=esmaltes-en-gel&subcategoria=top-matte" },
      { label: "Base coat",              href: "/tienda?categoria=esmaltes-en-gel&subcategoria=base-coat" },
      { label: "Gel vitral",             href: "/tienda?categoria=esmaltes-en-gel&subcategoria=gel-vitral" },
      { label: "Gel reflectivo",         href: "/tienda?categoria=esmaltes-en-gel&subcategoria=gel-reflectivo" },
      { label: "Gel iridiscente",        href: "/tienda?categoria=esmaltes-en-gel&subcategoria=gel-iridiscente" },
      { label: "Tratamiento en esmalte", href: "/tienda?categoria=esmaltes-en-gel&subcategoria=tratamiento-en-esmalte" },
    ],
  },
  {
    label: "Nail art",
    slug: "nail-art",
    categorySlugs: ["nail-art", "decoracion", "glitter", "cristaleria", "efectos", "stamping"],
    href: "/tienda?categoria=nail-art,decoracion,glitter,cristaleria,efectos,stamping",
    subcategories: [
      { label: "Nail art",     href: "/tienda?categoria=nail-art" },
      { label: "Decoración",   href: "/tienda?categoria=decoracion" },
      { label: "Glitter",      href: "/tienda?categoria=glitter" },
      { label: "Cristalería",  href: "/tienda?categoria=cristaleria" },
      { label: "Efectos",      href: "/tienda?categoria=efectos" },
      { label: "Stamping",     href: "/tienda?categoria=stamping" },
    ],
  },
  {
    label: "Estructura",
    slug: "estructura",
    categorySlugs: ["moldes", "tips"],
    href: "/tienda?categoria=moldes,tips",
    subcategories: [
      { label: "Moldes", href: "/tienda?categoria=moldes" },
      { label: "Tips",   href: "/tienda?categoria=tips" },
    ],
  },
  {
    label: "Cuidado de la piel",
    slug: "cuidado-piel",
    categorySlugs: ["cuidado-de-la-piel", "belleza", "kit"],
    href: "/tienda?categoria=cuidado-de-la-piel,belleza,kit",
    subcategories: [
      { label: "Cuidado de la piel", href: "/tienda?categoria=cuidado-de-la-piel" },
      { label: "Belleza",            href: "/tienda?categoria=belleza" },
      { label: "Kits",               href: "/tienda?categoria=kit" },
    ],
  },
  {
    label: "Accesorios",
    slug: "accesorios",
    categorySlugs: ["insumos-accesorios", "pinceles"],
    href: "/tienda?categoria=insumos-accesorios,pinceles",
    subcategories: [
      { label: "Insumos y accesorios", href: "/tienda?categoria=insumos-accesorios" },
      { label: "Pinceles",             href: "/tienda?categoria=pinceles" },
    ],
  },
  {
    label: "Producto podal",
    slug: "producto-podal",
    categorySlugs: ["producto-podal", "quiropodia"],
    href: "/tienda?categoria=producto-podal,quiropodia",
    subcategories: [
      { label: "Producto podal", href: "/tienda?categoria=producto-podal" },
      { label: "Quiropodia",     href: "/tienda?categoria=quiropodia" },
    ],
  },

  // 2) Categoría real única (sin subcategorías)
  {
    label: "Acrílicos",
    slug: "acrilicos",
    categorySlugs: ["acrilicos"],
    href: "/tienda?categoria=acrilicos",
    subcategories: [],
  },
  {
    label: "Líquidos",
    slug: "liquidos",
    categorySlugs: ["liquidos"],
    href: "/tienda?categoria=liquidos",
    subcategories: [
      { label: "Espuma limpiadora",     href: "/tienda?categoria=liquidos&subcategoria=espuma-limpiadora" },
      { label: "Sanitizantes",          href: "/tienda?categoria=liquidos&subcategoria=sanitizante" },
      { label: "Preparadores",          href: "/tienda?categoria=liquidos&subcategoria=preparadores" },
      { label: "Hidratación",           href: "/tienda?categoria=liquidos&subcategoria=hidratacion" },
      { label: "Aceite de cutícula",    href: "/tienda?categoria=liquidos&subcategoria=aceite-de-cuticula" },
      { label: "Monómero",              href: "/tienda?categoria=liquidos&subcategoria=monomero" },
      { label: "Resina",                href: "/tienda?categoria=liquidos&subcategoria=resina" },
      { label: "Hemostáticos",          href: "/tienda?categoria=liquidos&subcategoria=hemostatico" },
      { label: "Antisépticos",          href: "/tienda?categoria=liquidos&subcategoria=antiseptico" },
      { label: "Limpiador de pinceles", href: "/tienda?categoria=liquidos&subcategoria=limpiador-de-pinceles" },
    ],
  },
  {
    label: "Polygel",
    slug: "polygel",
    categorySlugs: ["polygel"],
    href: "/tienda?categoria=polygel",
    subcategories: [],
  },
  {
    label: "Puntas",
    slug: "puntas",
    categorySlugs: ["puntas"],
    href: "/tienda?categoria=puntas",
    subcategories: [
      { label: "Diamante", href: "/tienda?categoria=puntas&subcategoria=diamante" },
      { label: "Carburo",  href: "/tienda?categoria=puntas&subcategoria=carburo" },
    ],
  },
  {
    label: "Builder gel",
    slug: "builder-gel",
    categorySlugs: ["builder-gel"],
    href: "/tienda?categoria=builder-gel",
    subcategories: [],
  },
  {
    label: "Limas",
    slug: "limas",
    categorySlugs: ["limas"],
    href: "/tienda?categoria=limas",
    subcategories: [
      { label: "Limas",                   href: "/tienda?categoria=limas&subcategoria=lima" },
      { label: "Sponges",                 href: "/tienda?categoria=limas&subcategoria=sponge" },
      { label: "Repuestos para pododisco", href: "/tienda?categoria=limas&subcategoria=repuestos-para-pododisco" },
    ],
  },
  {
    label: "Herramientas",
    slug: "herramientas",
    categorySlugs: ["herramientas"],
    href: "/tienda?categoria=herramientas",
    subcategories: [],
  },
  {
    label: "Electrónicos",
    slug: "electronicos",
    categorySlugs: ["electronicos"],
    href: "/tienda?categoria=electronicos",
    subcategories: [],
  },
  {
    label: "Manicura",
    slug: "manicura",
    categorySlugs: ["manicura"],
    href: "/tienda?categoria=manicura",
    subcategories: [],
  },
  {
    label: "Bioseguridad",
    slug: "bioseguridad",
    categorySlugs: ["bioseguridad"],
    href: "/tienda?categoria=bioseguridad",
    subcategories: [],
  },
  {
    label: "Insumos de pestañas",
    slug: "insumos-pestanas",
    categorySlugs: ["pestanas"],
    href: "/tienda?categoria=pestanas",
    subcategories: [],
  },
]

// Taxonomía REAL de la academia. Las columnas reflejan lo que /academia puede
// filtrar de verdad (CourseGrid lee estos parámetros de la URL al montar):
// vista de calendario, orden por eventos pasados, nivel y tipo de evento.
// Los tipos salen de event-types.ts (fuente única de verdad) para no divergir.
// Se conserva el nombre `cursosCategories` y la forma TiendaCategory[] porque
// también alimenta el drawer móvil (MobileDrawer) y el megamenú de academia.
export const cursosCategories: TiendaCategory[] = [
  {
    label: "Explorar",
    slug: "explorar",
    href: "/academia",
    subcategories: [
      { label: "Todos los eventos", href: "/academia" },
      { label: "Calendario",        href: "/academia?vista=calendario" },
      { label: "Eventos pasados",   href: "/academia?sort=pasados" },
    ],
  },
  {
    label: "Por nivel",
    slug: "nivel",
    href: "/academia",
    subcategories: [
      { label: "Principiante", href: "/academia?nivel=principiante" },
      { label: "Intermedio",   href: "/academia?nivel=intermedio" },
      { label: "Avanzado",     href: "/academia?nivel=avanzado" },
      { label: "Abierto",      href: "/academia?nivel=abierto" },
    ],
  },
  {
    label: "Por tipo de evento",
    slug: "tipo",
    href: "/academia",
    subcategories: COURSE_EVENT_TYPES.map((type) => ({
      label: EVENT_TYPE_LABEL[type],
      href: `/academia?tipo=${type}`,
    })),
  },
]

export const menuData = {} as const
