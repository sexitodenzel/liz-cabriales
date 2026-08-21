/**
 * Import: carpeta "MUSSA,MC,STUDIO N. MAHIR" (catalogos aylen).
 *
 * OJO: esta carpeta NO es una sola marca — el documento mezcla 7 marcas
 * reales (Le'Mussa, MC, Studio Nails, Mahir, Luinails, GyR by Alondra,
 * Ice Nova). Cada producto lleva su `brand` real vía el override del
 * importador compartido, no la carpeta.
 *
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-mussa-mc-mahir.ts
 */
import { importBrand, Item } from "./lib/catalog-import"

const GAMA_DESC =
  "Gel semipermanente para uñas — kit de 6 colores (10 ml c/u). Manicuras profesionales de larga duración, alta pigmentación. Uso personal o profesional."
const LUINAILS_BUILDER_DESC =
  "Premium Builder Gel. Tarro 15 ml, libre de HEMA/TPO/TMPTA y de ácido. Con amortiguación (no se agrieta con golpes), consistencia y pigmentación media (cubre el borde libre), no arde en lámpara. Se espesa en frío, más líquido en calor (tixotrópico). Requiere base Rubber Base. Polimerización completa: 120 segundos."
const GAMA_ALONDRA_DESC =
  "Dale color, brillo y personalidad a tus uñas con las Gamas de Gel Alondra. Cada gama incluye 6 geles semipermanentes de color, tonos clásicos, modernos y de temporada. Textura cremosa, alta pigmentación, cobertura total desde la primera capa."
const ICE_RUBBER_DESC =
  "Base de goma para alisar uñas quebradizas, escamosas o irregulares. Más espesa que la base protectora normal, se autonivela y crea una superficie fuerte y uniforme para mejor adherencia del esmalte en gel. Flexibiliza sin romperse."

const ITEMS: Item[] = [
  // ================= Le'Mussa =================
  { name: "Negro Carbón (Gama Gel)", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 200, pack: "10 pz", description: GAMA_DESC },
  { name: "Unicorn (Gama Gel)", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 170, pack: "1 pz", description: GAMA_DESC },
  { name: "Gelatina D (Gama Gel)", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 170, pack: "1 pz", description: GAMA_DESC },
  { name: "Gama O", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 170, pack: "1 pz", description: GAMA_DESC },
  { name: "Gama H", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 170, pack: "1 pz", description: GAMA_DESC },
  { name: "Gama D", brand: "Le'Mussa", categorySlug: "esmaltes-en-gel", price: 170, pack: "1 pz", description: GAMA_DESC },
  { name: "Gama Cat Eye B", brand: "Le'Mussa", categorySlug: "efectos", price: 180, pack: "1 pz", description: GAMA_DESC },
  {
    name: "Gel Negro Carbón (26 pz)",
    brand: "Le'Mussa",
    categorySlug: "esmaltes-en-gel",
    price: 45,
    pack: "26 pz",
    description: "Gel semipermanente de alta pigmentación, ideal para uso personal o profesional.",
  },
  // "Lima 100/180 – 26pz" se omitió: el catálogo no trae precio (queda "$" vacío). Ver gap-tracking.

  // ================= MC =================
  {
    name: "Maxi Glow Top Gel 1oz",
    brand: "MC",
    categorySlug: "insumos-accesorios",
    price: 99,
    pack: "4 pz",
    description:
      "Gel top súper brillante para colocar sobre geles y acrílico, secado en lámpara LED/UV. Se aplica después de pulir la uña acrílica con lima sponge, retirar el polvo, poner capa delgada y secar en lámpara LED 1 minuto.",
  },

  // ================= Studio Nails =================
  {
    name: "Top Coat",
    brand: "Studio Nails",
    categorySlug: "insumos-accesorios",
    price: 80,
    pack: "1 pz",
    description: "Top Coat de 15 ml, acabado transparente para un aspecto de uñas naturales y brillantes.",
  },
  { name: "Plastigel 3 Rojo", brand: "Studio Nails", categorySlug: "esmaltes-en-gel", price: 120, pack: "2 pz" },
  { name: "Plastigel 2 Negro", brand: "Studio Nails", categorySlug: "esmaltes-en-gel", price: 120, pack: "6 pz" },

  // ================= Mahir =================
  { name: "Gel Polish 31 Rojo", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "1 pz" },
  { name: "Gel Polish 112 Verde", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "1 pz" },
  { name: "Gel Polish 117 Glitter Morado", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "1 pz" },
  { name: "Gel Polish 46 Blanco Hueso", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "2 pz" },
  { name: "Gel Polish 14 Café Gris", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "1 pz" },
  { name: "Gel Polish 50 Negro", brand: "Mahir", categorySlug: "esmaltes-en-gel", price: 50, pack: "1 pz" },
  {
    name: "Poly Gel 14",
    brand: "Mahir",
    categorySlug: "polygel",
    price: 55,
    pack: "2 pz",
    description: "Consistencia perfecta en gran variedad de técnicas de construcción: flexibilidad de un gel y resistencia de un acrílico.",
  },

  // ================= Luinails =================
  { name: "Premium Builder Gel 05", brand: "Luinails", categorySlug: "builder-gel", price: 269, pack: "3 pz", description: LUINAILS_BUILDER_DESC },
  { name: "Premium Builder Gel 09", brand: "Luinails", categorySlug: "builder-gel", price: 269, pack: "1 pz", description: LUINAILS_BUILDER_DESC },
  { name: "Premium Builder Gel 12", brand: "Luinails", categorySlug: "builder-gel", price: 269, pack: "1 pz", description: LUINAILS_BUILDER_DESC },

  // ================= GyR by Alondra =================
  { name: "Gama Gel Polish C", brand: "GyR by Alondra", categorySlug: "esmaltes-en-gel", price: 150, pack: "1 pz", description: GAMA_ALONDRA_DESC, imageDriveId: "17R117ZLxYX2sadNAxSmi2rcGSOOpYGU2" },
  { name: "Gama Gel Polish H1", brand: "GyR by Alondra", categorySlug: "esmaltes-en-gel", price: 150, pack: "1 pz", description: GAMA_ALONDRA_DESC, imageDriveId: "12OREPk8ygz7Bxu0oAXSQZf16wiEPrZn1" },
  {
    name: "Light Builder 05",
    brand: "GyR by Alondra",
    categorySlug: "builder-gel",
    price: 269,
    pack: "1 pz",
    description:
      "Gel de construcción líquido, fortalece, nivela y alarga las uñas. 15 ml, libre de HEMA/TPO/TMPTA. Consistencia como rubber base (autonivelante), baja temperatura, espesor permitido 0.5mm en borde libre, pigmentación media, polimeriza en 120 seg. Ideal para alargar uñas hasta 2-3 el largo, técnica dual system. Requiere limado de la uña natural antes de aplicar.",
  },

  // ================= Ice Nova =================
  { name: "Rubber 23", brand: "Ice Nova", categorySlug: "builder-gel", price: 280, pack: "2 pz", description: ICE_RUBBER_DESC, imageDriveId: "1zki4cNcmq6RurmVKkytJrkp9oOwVrT0r" },
  { name: "Rubber 21", brand: "Ice Nova", categorySlug: "builder-gel", price: 280, pack: "1 pz", description: ICE_RUBBER_DESC, imageDriveId: "1s-hOpjFVzsED3NDPjaCIM-1nh-tQxsxi" },
  { name: "Rubber 16", brand: "Ice Nova", categorySlug: "builder-gel", price: 280, pack: "2 pz", description: ICE_RUBBER_DESC, imageDriveId: "1mPftm1EqrTq28XmpqgeZIubaTBH1P0jN" },
  {
    name: "Gel Silver Painting Gel Liner",
    brand: "Ice Nova",
    categorySlug: "nail-art",
    price: 260,
    pack: "2 pz",
    description: "Painting gel libre de HEMA y TPO, 100% vegano. Ideal para líneas delgadas y perfectas.",
    imageDriveId: "1XA-UU6SiU80cxeRSYXzxsIYUjnA-ST4i",
  },
  { name: "Acetona Pura 1L", brand: "Ice Nova", categorySlug: "insumos-accesorios", price: 140, pack: "21 pz" },
  { name: "Acetona Pura 500ml", brand: "Ice Nova", categorySlug: "insumos-accesorios", price: 75, pack: "17 pz" },
  { name: "Acetona Pura 250ml", brand: "Ice Nova", categorySlug: "insumos-accesorios", price: 49, pack: "14 pz" },
  { name: "Acetona Pura 125ml", brand: "Ice Nova", categorySlug: "insumos-accesorios", price: 29, pack: "15 pz" },
  {
    name: "Keratin Softener",
    brand: "Ice Nova",
    categorySlug: "producto-podal",
    price: 450,
    pack: "11 pz",
    description:
      "Facilita el manejo de queratodermias plantares, onicofosis, onicodistrofias, onicomicosis, hiperqueratosis plantares y onicocriptosis.",
  },

  // ================= Herramientas (sección final, sin marca clara — ver nota en gap-tracking) =================
  { name: "Base Transparente para Repuesto", brand: "Ice Nova", categorySlug: "quiropodia", price: 80, pack: "1 pz" },
  // "hoja para bisturí – 17pz" se omitió: el catálogo no trae precio. Ver gap-tracking.
  { name: "Cloide Discoide", brand: "Ice Nova", categorySlug: "quiropodia", price: 100, pack: "4 pz" },
  { name: "Mango para Bisturí", brand: "Ice Nova", categorySlug: "quiropodia", price: 100, pack: "2 pz" },
  { name: "Mat Podológico", brand: "Ice Nova", categorySlug: "quiropodia", price: 190, pack: "1 pz" },
  { name: "Cucharilla/Guiador", brand: "Ice Nova", categorySlug: "quiropodia", price: 280, pack: "3 pz" },
  { name: "Electron", brand: "Ice Nova", categorySlug: "quiropodia", price: 100, pack: "1 pz" },
  { name: "Explorador", brand: "Ice Nova", categorySlug: "quiropodia", price: 140, pack: "1 pz" },
]

importBrand("Catalogos Aylen — Varios", "mussa-mc-mahir", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
