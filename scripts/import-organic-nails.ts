/**
 * Import: catálogo Organic Nails (marca dentro de "catalogos aylen")
 * Fuente: ORGANIC NAILS.docx (Word real, no Google Doc — se extrajo el
 * texto descargando el .docx y parseando word/document.xml).
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-organic-nails.ts
 */
import { importBrand, Item } from "./lib/catalog-import"

const BRAND = "Organic Nails"

const TOTAL_REMOVER_DESC =
  "Diseñado para remover Color Gel, TechGel, acrílico y polish. Contiene hidratantes y agentes acondicionadores, bajo contenido de acetona, no pigmenta la uña ni la piel. Para uso de salón y spa."

const ITEMS: Item[] = [
  // ---- PREPARADOR ----
  {
    name: "Protein Bond",
    categorySlug: "insumos-accesorios",
    price: 85,
    pack: "28 pz",
    description: "Sellador proteico libre de ácido.",
    longDescription:
      "Polímero orgánico que no contiene ácido. Incoloro, de bajo aroma. Sistema de anclaje de doble cohesión.\n\n" +
      "-Permite mayor adherencia del producto, acrílico y gel\n-Alto rendimiento y durabilidad\n-Regulador de PH para uña natural\n-Recomendado para cualquier aplicación de acrílico y gel\n-Ideal para aplicarse antes del esmalte y prolongar su durabilidad",
    imageDriveId: "1G1w_lAV20qQ0KII6sbAAiOCC1EfUKVNk",
  },

  // ---- RUBBER ----
  {
    name: "Rubber Clear",
    categorySlug: "builder-gel",
    price: 225,
    pack: "6 pz",
    description: "Gel nivelador que aporta resistencia y una apariencia uniforme, lineal y estética en la uña natural con irregularidades.",
    longDescription: "-Autonivelable\n-Precisión\n-Volumen y adhesión propia\n-No necesitas Protein Bond ni Base Coat\n-Perfecto para el recubrimiento y protección de la uña natural",
    imageDriveId: "1pZl0r3_B8KBIhoH-42YKXFezeXwV1j4b",
  },

  // ---- TOP ----
  {
    name: "Top Coat Gel",
    categorySlug: "insumos-accesorios",
    price: 205,
    pack: "3 pz",
    description: "Gel que da un brillo espectacular, con extrema adherencia a la uña natural.",
  },

  // ---- BASE ----
  {
    name: "Base Coat Gel",
    categorySlug: "insumos-accesorios",
    price: 205,
    pack: "4 pz",
    description:
      "Crea una unión potente y flexible que evita el desprendimiento sin necesidad de imprimaciones de proteínas adicionales. Evita manchas de esmaltes de alta pigmentación y protege la uña de la dilatación térmica durante el secado con lámpara.",
    imageDriveId: "1rliGmXzc26K2DHYh6Nx2QtqyfVqdZJqM",
  },

  // ---- LIMAS ----
  {
    name: "Sponge 240/240",
    categorySlug: "limas",
    price: 35,
    pack: "11 pz",
    description: "Especializada para limar y desbastar superficies suaves que requieren porosidad ligera.",
    imageDriveId: "1nPAM2SOWRdUWDNM-5F4RQPgVozogc7VV",
  },
  {
    name: "Sponge 180/180",
    categorySlug: "limas",
    price: 60,
    pack: "19 pz",
    description: "Especial para pulir y dar terminado a aplicaciones de acrílico y gel.",
  },
  {
    name: "Lima 150/150",
    categorySlug: "limas",
    price: 25,
    pack: "35 pz",
    description: "Especializada para limar uña natural y quitar asperezas de superficies desiguales.",
  },

  // ---- TOTAL REMOVER ----
  {
    name: "Total Remover 4.05 Oz",
    categorySlug: "insumos-accesorios",
    price: 60,
    pack: "13 pz",
    description: TOTAL_REMOVER_DESC,
    imageDriveId: "1XFKLtyXXpMEXmDNlAn6U3QfYtxIeHcR3",
  },
  {
    name: "Total Remover 16.23 Oz",
    categorySlug: "insumos-accesorios",
    price: 140,
    pack: "12 pz",
    description: TOTAL_REMOVER_DESC,
  },

  // ---- PAINTING GEL ----
  {
    name: "Oleo Painting Gel White",
    categorySlug: "nail-art",
    price: 129,
    pack: "2 pz",
    description:
      "Gel de alta pigmentación y viscosidad, ideal para diseños de arte en uñas a mano alzada. Perfecto para técnicas como one stroke, micropintura, acuarela y microrelieves.",
  },
]

importBrand(BRAND, "organic-nails", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
