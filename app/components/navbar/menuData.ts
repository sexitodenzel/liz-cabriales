/* =========================================
   DATOS DEL MENU
   ========================================= */

export type MenuItem = {
  label: string
  href: string
}

export type TiendaSubcategory = { label: string; href: string }

export type TiendaCategory = {
  label: string
  slug: string
  href: string
  subcategories: TiendaSubcategory[]
}

export const tiendaCategories: TiendaCategory[] = [
  // 1) Con subcategorías (alfabético)
  {
    label: "Accesorios",
    slug: "accesorios",
    href: "/tienda?categoria=accesorios",
    subcategories: [
      { label: "Mobiliario", href: "/tienda?categoria=accesorios&subcategoria=mobiliario" },
      { label: "Pinceles",   href: "/tienda?categoria=accesorios&subcategoria=pinceles" },
    ],
  },
  {
    label: "Cuidado de la piel",
    slug: "cuidado-piel",
    href: "/tienda?categoria=cuidado-piel",
    subcategories: [
      { label: "Exfoliantes",          href: "/tienda?categoria=cuidado-piel&subcategoria=exfoliantes" },
      { label: "Kits",                 href: "/tienda?categoria=cuidado-piel&subcategoria=kits" },
      { label: "Aceite",               href: "/tienda?categoria=cuidado-piel&subcategoria=aceite" },
      { label: "Mascarilla",           href: "/tienda?categoria=cuidado-piel&subcategoria=mascarilla" },
      { label: "Crema",                href: "/tienda?categoria=cuidado-piel&subcategoria=crema" },
      { label: "Velas para masaje",    href: "/tienda?categoria=cuidado-piel&subcategoria=velas-masaje" },
      { label: "Sales efervescentes",  href: "/tienda?categoria=cuidado-piel&subcategoria=sales-efervescentes" },
      { label: "Bombas efervescentes", href: "/tienda?categoria=cuidado-piel&subcategoria=bombas-efervescentes" },
    ],
  },
  {
    label: "Esmaltes en gel",
    slug: "esmaltes-en-gel",
    href: "/tienda?categoria=esmaltes-en-gel",
    subcategories: [
      { label: "Base",                  href: "/tienda?categoria=esmaltes-en-gel&subcategoria=base" },
      { label: "Top Coat",              href: "/tienda?categoria=esmaltes-en-gel&subcategoria=top-coat" },
      { label: "Color",                 href: "/tienda?categoria=esmaltes-en-gel&subcategoria=color" },
      { label: "Cat Eye (Ojo de gato)", href: "/tienda?categoria=esmaltes-en-gel&subcategoria=cat-eye" },
      { label: "Reflectivos",           href: "/tienda?categoria=esmaltes-en-gel&subcategoria=reflectivos" },
      { label: "Top Matte",             href: "/tienda?categoria=esmaltes-en-gel&subcategoria=top-matte" },
      { label: "Esmalte",               href: "/tienda?categoria=esmaltes-en-gel&subcategoria=esmalte" },
      { label: "Tintas",                href: "/tienda?categoria=esmaltes-en-gel&subcategoria=tintas" },
      { label: "Vitrales",              href: "/tienda?categoria=esmaltes-en-gel&subcategoria=vitrales" },
    ],
  },
  {
    label: "Estructura",
    slug: "estructura",
    href: "/tienda?categoria=estructura",
    subcategories: [
      { label: "Moldes",    href: "/tienda?categoria=estructura&subcategoria=moldes" },
      { label: "Tips",      href: "/tienda?categoria=estructura&subcategoria=tips" },
      { label: "Dual form", href: "/tienda?categoria=estructura&subcategoria=dual-form" },
      { label: "Soft Gel",  href: "/tienda?categoria=estructura&subcategoria=soft-gel" },
    ],
  },
  {
    label: "Limas",
    slug: "limas",
    href: "/tienda?categoria=limas",
    subcategories: [
      { label: "Limas y sponges",             href: "/tienda?categoria=limas&subcategoria=limas-y-sponges" },
      { label: "Limas metálicas",              href: "/tienda?categoria=limas&subcategoria=limas-metalicas" },
      { label: "Repuestos para lima metálica", href: "/tienda?categoria=limas&subcategoria=repuestos-lima-metalica" },
      { label: "Repuestos para pododisco",     href: "/tienda?categoria=limas&subcategoria=repuestos-pododisco" },
    ],
  },
  {
    label: "Líquidos",
    slug: "liquidos",
    href: "/tienda?categoria=liquidos",
    subcategories: [
      { label: "Limpiadores",           href: "/tienda?categoria=liquidos&subcategoria=limpiadores" },
      { label: "Hemostáticos",          href: "/tienda?categoria=liquidos&subcategoria=hemostaticos" },
      { label: "Sanitizantes",          href: "/tienda?categoria=liquidos&subcategoria=sanitizantes" },
      { label: "Preparadores",          href: "/tienda?categoria=liquidos&subcategoria=preparadores" },
      { label: "Monómero",              href: "/tienda?categoria=liquidos&subcategoria=monomero" },
      { label: "Solución para Polygel", href: "/tienda?categoria=liquidos&subcategoria=solucion-polygel" },
      { label: "Removedor de cutícula", href: "/tienda?categoria=liquidos&subcategoria=removedor-cuticula" },
      { label: "Acetona",               href: "/tienda?categoria=liquidos&subcategoria=acetona" },
      { label: "Remover Gel",           href: "/tienda?categoria=liquidos&subcategoria=remover-gel" },
    ],
  },
  {
    label: "Nail art",
    slug: "nail-art",
    href: "/tienda?categoria=nail-art",
    subcategories: [
      { label: "Decoraciones",     href: "/tienda?categoria=nail-art&subcategoria=decoraciones" },
      { label: "Glitter",          href: "/tienda?categoria=nail-art&subcategoria=glitter" },
      { label: "Painting gel",     href: "/tienda?categoria=nail-art&subcategoria=painting-gel" },
      { label: "Relieves",         href: "/tienda?categoria=nail-art&subcategoria=relieves" },
      { label: "Cristalería",      href: "/tienda?categoria=nail-art&subcategoria=cristaleria" },
      { label: "Gel moldeador",    href: "/tienda?categoria=nail-art&subcategoria=gel-moldeador" },
      { label: "Gel para textura", href: "/tienda?categoria=nail-art&subcategoria=gel-para-textura" },
      { label: "Plastilina",       href: "/tienda?categoria=nail-art&subcategoria=plastilina" },
      { label: "Acuarelas",        href: "/tienda?categoria=nail-art&subcategoria=acuarelas" },
    ],
  },
  {
    label: "Puntas",
    slug: "puntas",
    href: "/tienda?categoria=puntas",
    subcategories: [
      { label: "Carburo",  href: "/tienda?categoria=puntas&subcategoria=carburo" },
      { label: "Diamante", href: "/tienda?categoria=puntas&subcategoria=diamante" },
      { label: "Silicona", href: "/tienda?categoria=puntas&subcategoria=silicona" },
    ],
  },

  // 2) Sin subcategorías (alfabético)
  {
    label: "Bioseguridad",
    slug: "bioseguridad",
    href: "/tienda?categoria=bioseguridad",
    subcategories: [],
  },
  {
    label: "Builder gel",
    slug: "builder-gel",
    href: "/tienda?categoria=builder-gel",
    subcategories: [],
  },
  {
    label: "Cursos",
    slug: "cursos",
    href: "/academia",
    subcategories: [],
  },
  {
    label: "Electrónicos",
    slug: "electronicos",
    href: "/tienda?categoria=electronicos",
    subcategories: [],
  },
  {
    label: "Herramientas",
    slug: "herramientas",
    href: "/tienda?categoria=herramientas",
    subcategories: [],
  },
  {
    label: "Insumos de pestañas",
    slug: "insumos-pestanas",
    href: "/tienda?categoria=insumos-pestanas",
    subcategories: [],
  },
  {
    label: "Polygel",
    slug: "polygel",
    href: "/tienda?categoria=polygel",
    subcategories: [],
  },
  {
    label: "Producto Podal",
    slug: "producto-podal",
    href: "/tienda?categoria=producto-podal",
    subcategories: [],
  },
]

export const cursosCategories: TiendaCategory[] = [
  {
    label: "Cursos",
    slug: "cursos",
    href: "/academia",
    subcategories: [
      { label: "Todos los cursos",   href: "/academia" },
      { label: "Curso básico",       href: "/academia" },
      { label: "Intermedio",         href: "/academia" },
      { label: "Masterclass",        href: "/academia" },
      { label: "Especialización",    href: "/academia" },
    ],
  },
  {
    label: "Próximos eventos",
    slug: "proximos-eventos",
    href: "/academia",
    subcategories: [
      { label: "Ver calendario",     href: "/academia" },
      { label: "Cómo inscribirme",   href: "/academia#como-inscribirme" },
      { label: "Precios y horarios", href: "/academia" },
    ],
  },
  {
    label: "Modalidades",
    slug: "modalidades",
    href: "/academia",
    subcategories: [
      { label: "Presencial",         href: "/academia" },
      { label: "En línea",           href: "/academia" },
      { label: "Individual",         href: "/academia" },
      { label: "Grupal",             href: "/academia" },
    ],
  },
]

export const menuData = {} as const
