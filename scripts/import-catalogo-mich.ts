/**
 * Import: Catálogo mich (Google Doc suelto en la raíz de "Catálogos
 * Distribuidora LC", no dentro de "catalogos aylen").
 *
 * Mezcla varias marcas reales: NGHIA, Tecnipie, Nail Fit, Nail Tech, Mely
 * Nails, "Puntas: Maestro Willy Alvarez", Acry Love, y una sección de
 * mobiliario/equipo genérico sin marca (brand: null).
 *
 * Las fotos NO están junto al documento — están en las carpetas hermanas
 * de cada marca directo en "Catálogos Distribuidora LC" (ya revisadas).
 *
 * El catálogo aquí sí trae "Xpz" como EXISTENCIA real (confirmado porque
 * usa literal "Agotado" en el mismo lugar), así que se usa como `stock`.
 *
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-catalogo-mich.ts
 */
import { importBrand, Item } from "./lib/catalog-import"

const ITEMS: Item[] = [
  // ================= Mobiliario (genérico, sin marca) =================
  {
    name: "Reposamanos",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 490,
    variants: [
      { colorName: "Negro", stock: 1 },
      { colorName: "Rosa", stock: 2 },
      { colorName: "Blanco", stock: 2 },
    ],
    description: "Reposabrazos para manicura, hecho de cuero de microfibra de alta calidad, superficie cómoda y de alta densidad que no se deforma.",
    imageDriveId: "1bF0Cm-aFa33jmImDpERxEzyGsDgtR2xn",
  },
  {
    name: "Reposabrazos con Soporte Integrado para Teléfono",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 850,
    variants: [
      { colorName: "Negro", stock: 0 },
      { colorName: "Rosa", stock: 2 },
      { colorName: "Blanco", stock: 2 },
    ],
    description: "Reposabrazos en forma de U diseñado ergonómicamente, con soporte integrado para teléfono para que el cliente navegue cómodamente durante el servicio.",
  },
  {
    name: "Tapete de Cristales para Mesa",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 150,
    variants: [
      { colorName: "Gris", stock: 1 },
      { colorName: "Plata", stock: 1 },
      { colorName: "Blanco", stock: 1 },
    ],
    description: "Superficie elegante y sofisticada, fácil de limpiar y mantener.",
    imageDriveId: "1pVvMXOWmqR6zco2ccTZSv5IDVDVYxsTt",
  },
  {
    name: "Lámpara con Extractor de Polvo 2 en 1",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 500,
    stock: 4,
    description: "Combina una lámpara secadora de uñas UV/LED y un extractor de polvo integrado. Cura geles rápido y mantiene el espacio limpio al limar.",
    imageDriveId: "1s8sj8NdeVb4U906aZsH9vmFiHeotfXzV",
  },
  {
    name: "Lámpara de Escritorio con Base Rectangular",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 350,
    stock: 2,
    description: "Lámpara de escritorio plegable, blanca, diseño delgado y ajustable.",
    imageDriveId: "1-wJUUhpf1fGaoy4sPCKIMkXnjQCw06An",
  },
  {
    name: "Lámpara de Escritorio con Base Circular",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 450,
    stock: 2,
    description: "Lámpara de escritorio blanca, diseño plegable con panel de control táctil.",
    imageDriveId: "143u9cTnIMc6KbUwNvmj3TJdB2sEwkRXq",
  },
  {
    name: "Lámpara Pre-Curado",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 90,
    variants: [
      { colorName: "Blanco", price: 90, stock: 1 },
      { colorName: "Rosa", price: 90, stock: 2 },
      { colorName: "Fucsia", price: 130, stock: 2 },
      { colorName: "Rosa Tornasol", price: 130, stock: 1 },
    ],
    description: "Lámpara de uñas recargable, compacta y ligera. Pantalla clara para visualizar el tiempo de secado.",
    imageDriveId: "1EUeH81pejJWFd0nSaUsOohiWKTLc7lJN",
  },
  {
    name: "Lámpara Mini LED",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 260,
    stock: 1,
    description: "Lámpara para secado de uñas de gel, patas metálicas plegables color dorado.",
    imageDriveId: "1fMKus7BNEPeGahjii8jC2vyTHgtQXq-k",
  },
  {
    name: "Lámpara UV Inalámbrica",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 220,
    stock: 2,
    description: "Brazo flexible de 360° para ajustar ángulo y altura, sensor inteligente para el secado.",
    imageDriveId: "1dj07MYypn5iJE-MMx8K2twGEyI6UAMEV",
  },
  {
    name: "Porta Pinceles",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 150,
    stock: 3,
    description: "Porta pinceles de acrílico transparente, 26 espacios de diferentes tamaños, organización vertical.",
    imageDriveId: "1V6MHGUetq7dmkVzjUm8aQEVQutoQL6gA",
  },
  {
    name: "Lámpara SUN 5 de 48w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 250,
    stock: 2,
    description: "Lámpara UV LED de 48w, secado rápido, temporizador con pantalla digital, 4 ajustes y sensor automático.",
    imageDriveId: "1_eNyJASXVvMAkthLJdK-u8-0xsKqDKfQ",
  },
  {
    name: "Lámpara SUN X5 MAX de 48w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 250,
    stock: 12,
    description: "Lámpara UV LED de 48w, curado rápido y eficiente, pantalla digital, 4 ajustes de temporizador, sensores de movimiento automáticos.",
    imageDriveId: "1kqY8159r-wEfr_2yKwWRvE8YuFqopnZZ",
  },
  {
    name: "Lámpara SUN X Plus de 120w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 270,
    stock: 5,
    description: "Lámpara UV LED de 120w, secado rápido, 4 ajustes de temporizador, sensor de movimiento automático.",
    imageDriveId: "1AYhQTsEklq5dww6mFAdbBLdfDZlaKLDa",
  },
  {
    name: "Lámpara SUN X de 54w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 350,
    stock: 2,
    description: "Lámpara UV LED de 54w con acabado degradado rosa/azul, secado rápido y uniforme, pantalla digital y sensores automáticos.",
    imageDriveId: "1CFOKosXTvTZmIG2R7H0nt1Hf4gQZ0K5S",
  },
  {
    name: "Lámpara Z7 de 54w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 550,
    stock: 1,
    description: "Lámpara UV LED de 54w, secado rápido, temporizador con pantalla digital, 4 ajustes y sensor automático.",
    imageDriveId: "1NXChAtEgEXmiMqEGk5l269wDPmTJdAg2",
  },
  {
    name: "Lámpara SUN L03",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 550,
    stock: 9,
    description: "Lámpara UV LED ideal para dos manos, curado rápido y eficiente, pantalla digital, 4 ajustes de temporizador, sensores automáticos.",
    imageDriveId: "1XMVKgadYoQMkEEkVD6gE705D4tnPPBNm",
  },
  {
    name: "Lámpara SUN L2 Plus de 248w",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 380,
    stock: 3,
    description: "Lámpara UV LED de 248w con pantalla en forma de trébol, uso profesional, cura geles semipermanentes, 4 ajustes de temporizador y sensor automático.",
    imageDriveId: "1Piyh6_jfGEjd7r6aNY_4t8TCH1GC7EJj",
  },
  {
    name: "Lámpara SUN S80",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 950,
    stock: 1,
    description: "Lámpara UV LED con acabado de cristales morados y diseño Mickey Mouse. Curado rápido, pantalla digital, 4 ajustes y sensores automáticos.",
    imageDriveId: "1xAKI4skSAMebANMirUPGKi0yEpAO8QHS",
  },
  {
    name: "Drill Profesional 35000 RPM",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 600,
    variants: [
      { colorName: "Blanco", stock: 1 },
      { colorName: "Rosa", stock: 1 },
    ],
    description:
      "Drill profesional para uñas, control de velocidad variable 0-35000 RPM. Incluye consola base, lápiz de alta precisión, pedal manos libres, soporte integrado y set de fresas intercambiables.",
    imageDriveId: "1dXmV16tJpXE-oOqeFibcpNpwCgLGPFgQ",
  },
  {
    name: "Drill Profesional 35000 RPM Tornasol",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 750,
    stock: 1,
    description:
      "Drill profesional para uñas, control de velocidad variable 0-35000 RPM. Incluye consola base, lápiz de alta precisión, pedal manos libres, soporte integrado y set de fresas intercambiables.",
    imageDriveId: "13nTAWmm3DTYkcxvawjq5jLyyEZBc23UU",
  },
  {
    name: "Drill Profesional 45000 RPM",
    brand: null,
    categorySlug: "insumos-accesorios",
    price: 1100,
    stock: 1,
    description:
      "Drill eléctrico recargable, 45000 RPM, degradado rosa a azul. Base de carga de sobremesa, pieza de mano metálica, 6 brocas intercambiables, pantalla LCD con RPM y batería.",
    imageDriveId: "1KBA1pGiyiyo-72ud80IV3MIa8MAUJzeR",
  },

  // ================= NGHIA =================
  { name: "KD.701 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 300, stock: 4, description: "Hoja de 19 mm, largo total 91 mm. Acero quirúrgico inoxidable, protegido contra corrosión.", imageDriveId: "1pAZmudt5AVV4isR_s7HV0n9ce-f57fJ-" },
  { name: "KD.706 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 320, stock: 6, description: "Hoja de 22 mm, largo total 99 mm. Acero quirúrgico inoxidable, protegido contra corrosión.", imageDriveId: "1wvhIplQQcOBY3ZpDOYYzb1aiwmJo186W" },
  { name: "KD.707 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 430, stock: 8, description: "Hoja de 22.5 mm, largo total 95 mm. Acero quirúrgico inoxidable, protegido contra corrosión.", imageDriveId: "1Tdqi1LLnabuwlqegnaZe4xlfO6IIuQX2" },
  { name: "KD.708 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 280, stock: 3, description: "Hoja de 22 mm, largo total 93 mm. Acero quirúrgico inoxidable, protegido contra corrosión.", imageDriveId: "11eH8MMjjRMNObuk5kil8C-z92V8NBi52" },
  { name: "KD.715 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 400, stock: 0, description: "Puntas delgadas y curvas en forma de gancho, acero inoxidable de grado quirúrgico, hojas finas y extremadamente afiladas.", imageDriveId: "1i53de0Lwk0l6rJbZLYeikbVYxPfqIjyH" },
  { name: "KD.716 Tijera Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 350, stock: 0, description: "Largo de 90 mm, hoja curva de 17 mm, mangos rectos, acabado pulido espejo. Acero quirúrgico inoxidable.", imageDriveId: "11z0obrc6cnAy9dM3TcnmWcI4oKq0Fvyi" },
  { name: "NC.06 Cortaúñas Profesional", brand: "NGHIA", categorySlug: "herramientas", price: 130, stock: 1, description: "Estructura ergonómica, hojas bien afiladas, filo curvo que imita la forma de las uñas. También conocido como: Nail Clipper.", imageDriveId: "10qUTq-hWhvqqeuqeWf5PiH84qz5D_r3r" },
  { name: "NC.02 Cortaúñas Profesional", brand: "NGHIA", categorySlug: "herramientas", price: 130, stock: 3, description: "Hojas afiladas, diseño optimizado para corte fácil y seguro, filo curvo que imita la forma de la uña. También conocido como: Nail Clipper.", imageDriveId: "12YqFNRBcp8gPG5nRiTKGurCJeiwbU9fG" },
  { name: "P.08 Empujador Profesional para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 170, stock: 3, description: "Diseño de alta precisión, acero inoxidable quirúrgico, manipulación suave y segura. También conocido como: Pusher.", imageDriveId: "1ZtkeY6AVYqRF8kJWXLONcYhMuks-XEAn" },
  { name: "T.11 Pinza Podológica para Extracción", brand: "NGHIA", categorySlug: "herramientas", price: 285, stock: 4, description: "Acero inoxidable de grado quirúrgico, para retiro de uñas encarnadas o extracción de objetos incrustados y cutículas. También conocido como: Splinter Tweezers.", imageDriveId: "1RKJoZFVSsbPgqJH-cRwvDyra3p41gSfO" },
  { name: "C.114 Alicate para Cutícula", brand: "NGHIA", categorySlug: "herramientas", price: 250, stock: 4, description: "Corte preciso y controlado, mangos curvos, acero de carbono de alta resistencia, duradero y resistente a la corrosión.", imageDriveId: "1_Ds9Wsd9qp_3KLYzP9HRSrrPC9YUvFj1" },
  { name: "CL.S01 Alicate Profesional para Cutícula 3.5 mm", brand: "NGHIA", categorySlug: "herramientas", price: 420, stock: 1, description: "Cuchillas rectas de 3.5 mm, mangos curvos, muelle de resorte, acabado mate.", imageDriveId: "1FY5G3CG8m5p-I5QKAM_LdZfGhatQuyNW" },
  { name: "CL.S01 Alicate Profesional para Cutícula 7 mm", brand: "NGHIA", categorySlug: "herramientas", price: 420, stock: 1, description: "Cuchillas rectas de 7 mm, mangos curvos, muelle de resorte, acabado mate.", imageDriveId: "1k9tyCWq0ppq1zHtuHo4vbfgvGwSmo6dQ" },
  { name: "NL.201 Alicate Profesional para Uñas", brand: "NGHIA", categorySlug: "herramientas", price: 520, stock: 1, description: "Cuchillas de 14 mm, largo total 119 mm, acero inoxidable de grado quirúrgico.", imageDriveId: "1LvIl4sc7F9Ji0nt2VV8DalwIl9FWGela" },
  { name: "NL.202 Alicate Profesional para Uñas Encarnadas", brand: "NGHIA", categorySlug: "herramientas", price: 580, stock: 2, description: "Cuchillas de 17 mm, relieve para fijar firmemente en la mano, acero inoxidable grado quirúrgico.", imageDriveId: "1-nXXnc4QyNFrM5BWVgwemyfBqUPHlhL0" },
  { name: "NL.205 Alicate Profesional para Uñas Encarnadas", brand: "NGHIA", categorySlug: "herramientas", price: 550, stock: 1, description: "Filos de 14 mm, largo total 115.5 mm, mangos alargados, acero inoxidable de grado quirúrgico.", imageDriveId: "1iIN2eaDc8zTH8xZwPCRD0Ep-lAWKZCHE" },

  // ================= Tecnipie =================
  { name: "Gel Mentol 150 g", brand: "Tecnipie", categorySlug: "producto-podal", price: 160, stock: 5, description: "Suaviza callosidades, lubrica dejando la piel tersa y fresca. Apto para uso en diabéticos.", imageDriveId: "1RmsgxUde6Xt3PdsuZJoO1kPUBtMhTyaX" },
  {
    name: "Aerosol Desinfectante 150 ml",
    brand: "Tecnipie",
    categorySlug: "producto-podal",
    price: 160,
    stock: 2,
    description: "Elimina malos olores y desinfecta el calzado, aroma a mentol, previene bacterias y hongos por humedad.",
    imageDriveId: "13Hq41XrWnlhsEPhgLt5mvXyHJQvclbYK",
  },

  // ================= Nail Fit =================
  { name: "Efecto Espejo 2 en 1 (Rosa/Plata)", brand: "Nail Fit", categorySlug: "efectos", price: 100, stock: 1, description: "Para aplicación sobre uñas de gel, acrílicas o naturales, acabado brillante de larga duración.", imageDriveId: "1X8gh9Y1F_ookN3Yl3TeZfmkgsOtwX8qb" },
  { name: "Efecto Espejo 2 en 1 (Rosa/Dorado)", brand: "Nail Fit", categorySlug: "efectos", price: 100, stock: 2, description: "Para aplicación sobre uñas de gel, acrílicas o naturales, acabado brillante de larga duración.", imageDriveId: "1H8bCMPd-0-WRD79PwzzlBddopCXEj0wv" },
  { name: "Colección Beauty", brand: "Nail Fit", categorySlug: "esmaltes-en-gel", price: 200, stock: 2, description: "Colección versátil que se adapta a cualquier ocasión o temporada. 6 colores de 10 ml.", imageDriveId: "1Jr_CqV6Emt_yBeNJrhmwenX_ZP_b_32K" },
  { name: "Colección Energy", brand: "Nail Fit", categorySlug: "esmaltes-en-gel", price: 200, stock: 3, description: "Gel semipermanente en tonos vibrantes y de alta calidad. 6 colores de 10 ml.", imageDriveId: "1RSc_GmRyvhpIzRshHDLkFc_LKtUHz_ZI" },
  { name: "Colección Cardio", brand: "Nail Fit", categorySlug: "esmaltes-en-gel", price: 230, stock: 1, description: "Tonos vibrantes con brillo eléctrico de glitters. 6 colores de 10 ml.", imageDriveId: "1mWCSlSb4Tmo84tybz9eYouUayVCHWI8t" },

  // ================= Nail Tech =================
  { name: "Disco para Pedicura 20 mm", brand: "Nail Tech", categorySlug: "limas", price: 140, stock: 15, description: "Acero inoxidable de alta calidad, apto para desinfección y esterilización con altas temperaturas.", imageDriveId: "1TiAPq5kZjTiZy4hjWK7pPBCOPJhYvnb9" },
  { name: "Disco para Pedicura 25 mm", brand: "Nail Tech", categorySlug: "limas", price: 150, stock: 15, description: "Acero inoxidable de alta calidad, apto para desinfección y esterilización con altas temperaturas.", imageDriveId: "16gRHbq5DbIVS8rSKr3fAZ3V-xE7oiWkn" },
  { name: "Disco para Pedicura 35 mm", brand: "Nail Tech", categorySlug: "limas", price: 160, stock: 10, description: "Acero inoxidable de alta calidad, apto para desinfección y esterilización con altas temperaturas.", imageDriveId: "1MVtRNeRNUhW1ZO8IHAesSrGdRA3rbMmo" },
  { name: "Repuesto para Pododisco 35 mm (Grano 100)", brand: "Nail Tech", categorySlug: "limas", price: 120, stock: 10, description: "50 piezas redondas blancas de 35 mm de diámetro, grano 100.", imageDriveId: "1VrPglc5Kn2NDgUwiTFKTyLKvoLKqTvJi" },
  { name: "Repuesto para Pododisco 35 mm (Grano 180)", brand: "Nail Tech", categorySlug: "limas", price: 120, stock: 10, description: "50 piezas redondas blancas de 35 mm de diámetro, grano 180.", imageDriveId: "1nihDBCon6NR5Q3WKBh_P8q-nbuHW25xZ" },
  { name: "Repuesto Sponge para Pododisco 35 mm", brand: "Nail Tech", categorySlug: "limas", price: 170, stock: 10, description: "25 piezas con base de esponja, acabados suaves tras el limado, 35 mm de diámetro.", imageDriveId: "1PHxrG9GxFi_XiXd7IXaTkTlWm_9gcK2V" },
  {
    name: "Repuesto de Lima Adhesivo Descartable",
    brand: "Nail Tech",
    categorySlug: "limas",
    price: 180,
    variants: [
      { colorName: "Grano 240", stock: 2 },
      { colorName: "Grano 180", stock: 2 },
    ],
    description: "Rollo de lima adhesiva, material abrasivo desechable y reemplazable para base de lima metálica.",
  },

  // ================= Puntas: Maestro Willy Alvarez =================
  { name: "Punta Flama Roja 2.1 mm", brand: "Maestro Willy Alvarez", categorySlug: "puntas", price: 220, stock: 9, description: "Grano rojo, nariz fino, diámetro 2.1 mm, superficie de trabajo 8 mm. Ideal para pieles sensibles.", imageDriveId: "1rtb2KaEC8Kk53C3FGBHPSvW5ZRIaoKXJ" },
  { name: "Punta Flama Roja 2.3 mm", brand: "Maestro Willy Alvarez", categorySlug: "puntas", price: 220, stock: 0, description: "Grano rojo, nariz fino, diámetro 2.3 mm, superficie de trabajo 8 mm. Ideal para pieles sensibles.", imageDriveId: "1hnfStmnFqKezW1gpuU4a4s2pbP6G0wfw" },
  { name: "Punta Flama Azul", brand: "Maestro Willy Alvarez", categorySlug: "puntas", price: 220, stock: 4, description: "Grano azul (abrasividad media), nariz fino, superficie de trabajo 8 mm. Ideal para levantamiento de cutículas y pulido.", imageDriveId: "1tfP7Jv_tHY_i-TE73_TfeIUORD25ZiTs" },
  { name: "Punta Flama Amarilla", brand: "Maestro Willy Alvarez", categorySlug: "puntas", price: 220, stock: 16, description: "Grano amarillo (abrasividad extra suave), nariz fino, superficie de trabajo 8 mm. Ideal para trabajos delicados y terminados de alto brillo.", imageDriveId: "1xkKckFd8MHwOPySQVMxtcndaEwrT5pbV" },

  // ================= Mely Nails =================
  {
    name: "Polygel Mely Nails",
    brand: "Mely Nails",
    categorySlug: "polygel",
    price: 250,
    variants: [
      { colorName: "017", stock: 4 },
      { colorName: "032", stock: 2 },
      { colorName: "Clear", stock: 3 },
    ],
    description: "Para construcción y extensión de uñas, formato de tubo que facilita dosificación y aplicación.",
  },
  {
    name: "Gel Vitral Mely Nails",
    brand: "Mely Nails",
    categorySlug: "esmaltes-en-gel",
    price: 90,
    variants: [
      { colorName: "Cherry", stock: 28 },
      { colorName: "Blueberry", stock: 4 },
      { colorName: "Apple", stock: 5 },
      { colorName: "Tangerine", stock: 0 },
    ],
    description: 'Esmalte semipermanente traslúcido y fluido, efecto transparencia tipo "cristal color" o "jelly".',
  },
  {
    name: "Pincel Diamond",
    brand: "Mely Nails",
    categorySlug: "pinceles",
    price: 700,
    stock: 8,
    description: "Para aplicación y esculpido de acrílico, mango decorado con cristales.",
  },
  {
    name: "Flake It Mely Nails",
    brand: "Mely Nails",
    categorySlug: "efectos",
    price: 45,
    variants: [
      { colorName: "A", stock: 4 },
      { colorName: "B", stock: 5 },
      { colorName: "C", stock: 7 },
      { colorName: "D", stock: 4 },
      // E sin foto — no hay archivo "Flake E" en la carpeta de Mely Nails.
      { colorName: "E", stock: 6 },
    ],
    description: "Hojuelas ultrafinas, asimétricas e iridiscentes que cambian de color según el ángulo de la luz.",
    // Galería con las 4 fotos disponibles (A, B, C, D) — el esquema no permite
    // una foto distinta por variante, así que se muestran las 4 como galería
    // del producto en vez de asignarlas a un color específico.
    imageDriveIds: [
      "11I74vcVr2f8mfrzQriwWZB61BwxaNeuq",
      "1wMZK0J6YnmI02MDq5xVNUBO1LLTC7u6v",
      "1AvhOghglGoJkaolLOzzUz4qNvLr22eCQ",
      "1gK3VAkMvRgjMmUHmSn3Dmwg_V1YI00Tw",
    ],
  },
  {
    name: "Magic Mirror Mely Nails",
    brand: "Mely Nails",
    categorySlug: "efectos",
    price: 45,
    variants: [
      { colorName: "Dorado", stock: 10 },
      { colorName: "Cobre", stock: 11 },
      { colorName: "Plata", stock: 10 },
      { colorName: "Naranja", stock: 11 },
      { colorName: "Rosa", stock: 7 },
      { colorName: "Esmeralda", stock: 9 },
      { colorName: "Azul", stock: 5 },
      { colorName: "Verde", stock: 11 },
      { colorName: "Rojo", stock: 11 },
    ],
    description: "Pigmentos con efecto reflectante y acabado metálico de alta intensidad y brillo.",
    // OJO: única foto candidata en la carpeta se llama "Efecto Espejo Mely Nails" —
    // coincide en significado (mirror = espejo) pero NO en nombre exacto. Se usa
    // con reserva; ver nota en gap-tracking.
    imageDriveId: "1SlWaU0sCzV4WGaA3rDw8dxeMQNucXfh2",
  },

  // ================= Acry Love =================
  // El catálogo original trae "(descripción)" como placeholder en todos estos —
  // se dejó sin descripción (null) en vez de insertar ese texto literal.
  {
    name: "Repuesto para Lima Metálica",
    brand: "Acry Love",
    categorySlug: "limas",
    price: 65,
    variants: [
      { colorName: "80/80", stock: 3 },
      { colorName: "100/100", stock: 5 },
      { colorName: "150/150", stock: 3 },
      { colorName: "180/180", stock: 3 },
    ],
  },
  { name: "Set de Limas", brand: "Acry Love", categorySlug: "limas", price: 95, stock: 16 },
  {
    name: "Repuesto Sponge para Lima Metálica",
    brand: "Acry Love",
    categorySlug: "limas",
    price: 65,
    variants: [
      { colorName: "220/220", stock: 3 },
      { colorName: "100/100", stock: 6 },
    ],
  },
  { name: "Repuesto Mix para Lima Metálica", brand: "Acry Love", categorySlug: "limas", price: 65, stock: 9 },
  { name: "Lima Steel", brand: "Acry Love", categorySlug: "limas", price: 107, stock: 0 },
  // Categoría no especificada en el catálogo original (campo vacío) — se infirió "nail-art".
  { name: "Set de Punteros", brand: "Acry Love", categorySlug: "nail-art", price: 115, stock: 3 },
  { name: "Pincel Graceful #4", brand: "Acry Love", categorySlug: "pinceles", price: 415, stock: 1 },
  // Categoría no especificada en el catálogo original (campo vacío) — se infirió "pinceles" (va con el estuche anterior).
  {
    name: "Estuche para Pinceles",
    brand: "Acry Love",
    categorySlug: "pinceles",
    price: 199,
    variants: [
      { colorName: "Blanco", stock: 1 },
      { colorName: "Rosa", stock: 1 },
    ],
  },
]

importBrand("Catálogo mich — Varios", "mich", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
