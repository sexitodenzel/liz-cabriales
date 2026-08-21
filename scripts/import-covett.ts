/**
 * Import: catálogo Covett (marca dentro de "catalogos aylen" en Drive)
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-covett.ts
 */
import { importBrand, Item } from "./lib/catalog-import"

const BRAND = "Covett"

const MARBLE_DESC =
  "Tintas de alcohol Marble Ink Art de Covett, de secado rápido, ideales para crear diseños marmoleados y estilo humo en uñas."
const RUBBER_BASE_DESC =
  "Rubber de color sólido con un lindo brillo. Flexible y removible, maximiza la adherencia, disimula imperfecciones y da una base fuerte y duradera."

const ITEMS: Item[] = [
  // ---- MARBLE INK ART (tintas) $170 c/u ----
  { name: "Marble Ink Art #11 Gris", categorySlug: "nail-art", price: 170, pack: "4 pz", description: MARBLE_DESC, imageDriveId: "1xTLHBD1MHqMMURTVGPsHIYBXsbQHQue7" },
  { name: "Marble Ink Art #16 Rosa", categorySlug: "nail-art", price: 170, pack: "1 pz", description: MARBLE_DESC, imageDriveId: "1Bo4q2U7KM6uAaePhqD4izu28lEMGVlhn" },
  { name: "Marble Ink Art #13 Amarilla", categorySlug: "nail-art", price: 170, pack: "2 pz", description: MARBLE_DESC, imageDriveId: "1cbNXimc-pGQ4spgDyicJ_5KYaCNB_msX" },
  { name: "Marble Ink Art White", categorySlug: "nail-art", price: 170, pack: "6 pz", description: MARBLE_DESC, imageDriveId: "1zZCy9V9ZEZ3qAZCr4FbUEHKxq0CvhyIF" },

  // ---- FINALIZADOR ----
  {
    name: "Shiny Top",
    categorySlug: "insumos-accesorios",
    price: 185,
    pack: "2 pz",
    description:
      "Top diseñado para sellar tu manicura y dar un acabado brillante y duradero. Protege contra arañazos, desconchones y amarillamiento.",
    imageDriveId: "1w9DT8JOv1xfXQwBraIUDvdHMARDVaLzH",
  },

  // ---- BASES ----
  {
    name: "Aurora Base Pinky Star",
    categorySlug: "insumos-accesorios",
    price: 220,
    pack: "1 pz",
    // Sin descripción propia en el catálogo — ver nota en gap-tracking.
  },
  { name: "Aurora Rubber Base Nude Star", categorySlug: "insumos-accesorios", price: 230, pack: "4 pz", description: RUBBER_BASE_DESC },
  { name: "Aurora Rubber Base White Star", categorySlug: "insumos-accesorios", price: 230, pack: "1 pz", description: RUBBER_BASE_DESC },
  { name: "Aurora Rubber Base Lilac Star", categorySlug: "insumos-accesorios", price: 230, pack: "1 pz", description: RUBBER_BASE_DESC },

  // ---- METALIC PAINT GEL $210 c/u ----
  { name: "Metalic Paint Gel Rose Gold", categorySlug: "efectos", price: 210, pack: "4 pz" },
  { name: "Metalic Paint Gel Gold", categorySlug: "efectos", price: 210, pack: "1 pz" },
  { name: "Metalic Paint Gel Silver", categorySlug: "efectos", price: 210, pack: "6 pz" },

  // ---- PINCELES ----
  { name: "Basic Gum Gel (Pincel de Silicón)", categorySlug: "pinceles", price: 60, pack: "7 pz", imageDriveId: "1G-WILvZ82h0Mng6UYQdHNmpErK5sx-yq" },
  { name: "Pincel Round 02", categorySlug: "pinceles", price: 280, pack: "3 pz", imageDriveId: "1ZKxt_aKJWay4PUGfQ7YmoJKT24crQEeW" },
  { name: "Pincel Essentia (para Acrílico)", categorySlug: "pinceles", price: 650, pack: "1 pz", imageDriveId: "1dYjITCRzE4bWdrXsqdJUyGQQrHJJyI0S" },
  { name: "Liners Colors", categorySlug: "pinceles", price: 480, pack: "9 pz", imageDriveId: "1I2jpS1hZ1gjbx1dvSkH3ZpHXk7peNaz_" },
  { name: "Aceite de Cutícula Coco/Canela", categorySlug: "cuidado-de-la-piel", price: 60, pack: "1 pz" },

  // ---- GEL PAINTING ----
  { name: "Gesso Gel Blanco", categorySlug: "nail-art", price: 195, pack: "7 pz", imageDriveId: "1hJ9X1CGvBOcI9ZRZ_SdE_yVcxa5PxA8j" },
  { name: "Gesso Gel Negro", categorySlug: "nail-art", price: 195, pack: "2 pz" },
  { name: "Gel Art Stamping 04 Rosa", categorySlug: "nail-art", price: 200, pack: "2 pz" },
  { name: "Gel Art Stamping 02 Amarillo Neón", categorySlug: "nail-art", price: 200, pack: "2 pz" },
  { name: "Gel Paint y Stamping 03", categorySlug: "nail-art", price: 190, pack: "2 pz" },
  { name: "Gel Paint y Stamping 02", categorySlug: "nail-art", price: 190, pack: "1 pz" },
  { name: "Gel Paint y Stamping 06", categorySlug: "nail-art", price: 190, pack: "2 pz" },

  // ---- COLECCIONES DE GEL ART STAMPING ----
  { name: "Gel Art Stamping Colección Basic Colors", categorySlug: "kit", price: 1089, pack: "1 pz", imageDriveId: "1m8Wib0r0dEdgY65huF9MTdUANvoA_POn" },
  { name: "Gel Art Stamping Colección True Colors", categorySlug: "kit", price: 1089, pack: "1 pz", imageDriveId: "1BoOHj5B5ahtPg23kMg3z7U5PfXTCVJlG" },
  { name: "Gel Art Stamping Colección Pastello", categorySlug: "kit", price: 1089, imageDriveId: "1JC-I9PRzoEZg6RfabEODjf8urIjVX-3C" },

  // ---- CAT EYE ----
  { name: "Cat Eye Rojo", categorySlug: "efectos", price: 250, pack: "1 pz" },
  { name: "Cat Eye Gold", categorySlug: "efectos", price: 250, pack: "1 pz" },
]

importBrand(BRAND, "covett", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
