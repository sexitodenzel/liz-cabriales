/**
 * Import: catálogo Kodi Professional (marca dentro de "catalogos aylen")
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-kodi-professional.ts
 */
import { importBrand, Item } from "./lib/catalog-import"

const BRAND = "Kodi Professional"

const BUILD_GEL_DESC =
  "Build It Up Gel de Kodi Professional, ideal para modelar y fortalecer uñas debilitadas. Excelente tixotropía, ideal para extensiones sin limar. Curado: 60-120 seg en lámpara de 40W."

const ITEMS: Item[] = [
  // ---- RUBBERS ----
  { name: "Milky Rose", categorySlug: "builder-gel", price: 340, pack: "2 pz", description: BUILD_GEL_DESC, imageDriveId: "1ciary_iU5Um3XimPu20JKXIMb4c5DJad" },
  { name: "Cover Pink", categorySlug: "builder-gel", price: 340, pack: "3 pz", description: BUILD_GEL_DESC, imageDriveId: "1lkiUg2AITdk6azMsWXjbzXvaLBsKtaeZ" },
  {
    name: "Rubber Base Gel Black",
    categorySlug: "builder-gel",
    price: 270,
    pack: "1 pz",
    description:
      "Base de goma negra profesional para crear una base fuerte y flexible para el esmalte en gel. Consistencia espesa y autonivelante, mejora la adherencia y previene levantamiento, descascarillado y rotura.",
    imageDriveId: "1pf0UCWxC2BmX4wP_zcJi7HOcqbyX1HOe",
  },

  // ---- PREPARADOR ----
  {
    name: "NO Bacteria",
    categorySlug: "bioseguridad",
    price: 180,
    pack: "9 pz",
    description:
      "Desinfectante de uñas, agente profiláctico que protege la lámina ungueal contra infecciones bacterianas y hongos. Fórmula a base de alcohol isopropílico y tolnaftato (fungicida).",
    imageDriveId: "1XPYr6JK8jv2dEeQ_Rqe9usseqk_Z7_Nv",
  },

  // ---- TOP ----
  {
    name: "No Sticky Top Coat",
    categorySlug: "insumos-accesorios",
    price: 395,
    pack: "2 pz",
    description:
      "Gel transparente grueso que se usa como capa final sobre el esmalte en gel. Brillo pronunciado, sin capa pegajosa. Se cura en 30 seg (LED) o 1 min (UV). Dura hasta 3 semanas sin astillarse.",
    imageDriveId: "1bhNGQvR-W4KYLBrfVx7YIGBtzkj2eipQ",
  },

  // ---- PIES ----
  {
    name: "Neutralizer",
    categorySlug: "producto-podal",
    price: 180,
    pack: "8 pz",
    description:
      "Neutralizador para usarse en la etapa final del tratamiento de pies: neutraliza el efecto de ácido o álcali y normaliza el nivel de pH. Formato spray.",
  },
  {
    name: "Regenerating Foot Cream with Panthenol",
    categorySlug: "producto-podal",
    price: 290,
    pack: "1 pz",
    description:
      "Crema regeneradora para pies con pantenol. Restaura la piel, preserva elasticidad y suavidad, previene pérdida de humedad. Eficaz contra sequedad, callos, grietas y ampollas.",
  },
  {
    name: "Gommage-Peeling Feet and Hand Gel 200ml",
    categorySlug: "producto-podal",
    price: 290,
    pack: "15 pz",
    description:
      "Gel exfoliante para pies y manos con ácidos AHA, elimina células muertas y favorece la regeneración natural. Con aloe (hidratante) y menta (antiséptico natural).",
  },
  {
    name: "Foot Peeling with Lactic Acid",
    categorySlug: "producto-podal",
    price: 290,
    pack: "6 pz",
    description:
      "Peeling en espuma para pies ásperos. Extracto de té blanco (antiséptico) y pantenol (calma irritación y enrojecimiento). Previene grietas, callosidades y durezas.",
  },

  // ---- REMOVEDOR CUTÍCULA ----
  {
    name: "Fruit Acid Cuticle Remover",
    categorySlug: "cuidado-de-la-piel",
    price: 150,
    pack: "6 pz",
    description:
      "Removedor de cutículas con ácidos de frutas (cítricos), prepara la cutícula para su eliminación con efecto suave y evita rebabas. Con extracto de arándano mirto y caña de azúcar.",
    imageDriveId: "1W6eUZHkGrHP-3LrIxA-nI7MrdXRk8ILe",
  },
]

importBrand(BRAND, "kodi-professional", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
