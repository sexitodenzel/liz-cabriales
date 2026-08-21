/**
 * Import: catálogo Manikura Pro (marca dentro de "catalogos aylen")
 * USO: npx ts-node --project tsconfig.scripts.json scripts/import-manikura-pro.ts
 *
 * NOTA: ninguna imagen de esta carpeta se pudo asociar a un producto — todas
 * son fotos de Facebook/WhatsApp o códigos de stock sin nombre reconocible.
 * Los 29 productos quedan sin foto (ver gap-tracking).
 */
import { importBrand, Item } from "./lib/catalog-import"

const BRAND = "Manikura Pro"

const TIPS_DUAL_DESC =
  "Tips dual con 120 pz por caja, ideales para la técnica dual, desechables y con variedad de tamaños."

const ITEMS: Item[] = [
  // ---- MANIKURA PRO ----
  { name: "Blood Stop Solución Hemostática", categorySlug: "insumos-accesorios", price: 70, pack: "3 pz", description: "Ideal para detener sangrados leves, producidos por laceraciones pequeñas creadas durante el proceso de la manicura." },
  { name: "Pusher Iconic", categorySlug: "herramientas", price: 280, pack: "7 pz", description: "Empujador de cutícula, ideal para un fácil levantamiento de cutícula, 100% reutilizable." },
  { name: "Cureta Type 1", categorySlug: "herramientas", price: 150, pack: "5 pz", description: "Herramienta podológica ideal para proceso de limpieza en canales y borde libre. Con doble cabeza." },
  { name: "Up File Pro", categorySlug: "limas", price: 110, pack: "4 pz", description: "Ideal para abrasivos descartables, además de ser apta para esterilización en forma recta." },
  { name: "Repuestos Lima File Pro #240", categorySlug: "limas", price: 70, pack: "2 pz", description: "Abrasivo japonés desechable, 1.0 mm de espesor. Contiene 10 pz." },
  { name: "Maniseptik 250ml", categorySlug: "bioseguridad", price: 155, pack: "7 pz", description: "Antiséptico con 70% de alcohol concentrado, ideal para el proceso pre-manicura." },
  {
    name: "Neutra+",
    categorySlug: "insumos-accesorios",
    price: 125,
    pack: "1 pz",
    description:
      "Solución neutra post manicura. Limpia la piel al finalizar el proceso, retira el polvo y neutraliza los químicos. Calma pieles irritadas y enrojecidas. No contiene alcohol ni acetonas.",
  },

  // ---- EFECTOS ----
  { name: "Nebulosa Mirror", categorySlug: "efectos", price: 135, pack: "3 pz", description: "Crea hermosos diseños con nebulosa mirror, usa base blanca o negra para lograr efectos únicos." },
  { name: "Cosmic Mirror", categorySlug: "efectos", price: 135, pack: "11 pz" },
  { name: "Witchery Mirror", categorySlug: "efectos", price: 135, pack: "1 pz" },
  { name: "Hocus Pocus", categorySlug: "efectos", price: 135, pack: "4 pz", description: "Hermosos efectos espejo con alta pigmentación, fácil de adherir, presentación de 10 g." },

  // ---- LIMAS ----
  { name: "Zebra 180/240", categorySlug: "limas", price: 30, pack: "3 pz", description: "Lima zebra adecuada para el proceso de asepsia, forma recta con doble abrasivo 180/240." },

  // ---- PINCELES ----
  { name: "Pincel Lengua de Gato", categorySlug: "pinceles", price: 350, pack: "3 pz", description: "14mm de largo y 6mm de ancho, ideal para acrygel, gel constructor y rubber base." },
  { name: "Liner 8.0MM", categorySlug: "pinceles", price: 350, pack: "1 pz", description: "Liner de calidad premium con cerdas suaves y firmes que aportan estabilidad." },

  // ---- PUNTAS ----
  {
    name: "Punta Pera Polished",
    categorySlug: "puntas",
    price: 270,
    pack: "2 pz",
    description: "Broca de pulido/corte. Recubrimiento diamantado BOT, vástago universal, apta para esterilización, 45mm de diámetro, doble zona de corte.",
  },
  { name: "Punta DIAMOND S", categorySlug: "puntas", price: 280, pack: "1 pz", description: "Broca para corte y pulido para la manicura." },
  { name: "Punta Ball Podológica", categorySlug: "puntas", price: 400, pack: "4 pz", description: "Ideal para desbaste de onicomicosis. Corte crosscut, apta para esterilización." },

  // ---- TIPS ----
  { name: "Oligum", categorySlug: "tips", price: 150, pack: "1 pz", description: "Caja mixta de tips para dual system, 288 pz, incluye plantillas para french." },
  { name: "Coffin Extra Long", categorySlug: "tips", price: 150, pack: "7 pz", description: "Tips coffin para soft gel, 240 pz extra largas para crear uñas extra hermosas." },
  { name: "Coffin Dual", categorySlug: "tips", price: 110, pack: "3 pz", description: TIPS_DUAL_DESC },
  { name: "Stiletto Dual", categorySlug: "tips", price: 110, pack: "5 pz", description: TIPS_DUAL_DESC },
  { name: "Cuadrado Dual", categorySlug: "tips", price: 110, pack: "2 pz", description: TIPS_DUAL_DESC },

  // ---- SPA ----
  { name: "Relaxing Gel", categorySlug: "cuidado-de-la-piel", price: 150, pack: "1 pz", description: "Gel relajante para manos, especializado para el proceso de manicura y post cuidados. Calmante para pieles recién procesadas." },
  { name: "Spray Relaxing", categorySlug: "cuidado-de-la-piel", price: 135, pack: "2 pz", description: "Spray relajante antiséptico con mentol, ideal post aplicación, sin sensación grasosa. Ideal para pieles sensibles y enrojecidas." },

  // ---- TALCO ----
  { name: "Many Dust", categorySlug: "insumos-accesorios", price: 95, pack: "3 pz", description: "Talco ideal para pieles normales, secas y mixtas, disminuye la fricción al trabajar la manicura." },
  {
    name: "Touchy Dust",
    categorySlug: "insumos-accesorios",
    price: 125,
    pack: "6 pz",
    description: "Talco para manicura ideal para pieles sensibles, húmedas y enrojecidas. Consistencia densa, disminuye la fricción. Puede usarse antes, durante y después.",
  },

  // ---- REPUESTOS PODODISCO 25mm ----
  { name: "Podo Pro #150", categorySlug: "limas", price: 95, pack: "3 pz", description: "Lima zebra desechable adhesiva para pododisco, disponible en dos gramajes distintos." },
  { name: "Podo Pro #240", categorySlug: "limas", price: 95, pack: "1 pz", description: "Lima zebra desechable adhesiva para pododisco, disponible en dos gramajes distintos." },

  // ---- OTROS ----
  { name: "Mandil Negro", categorySlug: "bioseguridad", price: 450, pack: "2 pz" },
]

importBrand(BRAND, "manikura-pro", ITEMS).catch((err) => {
  console.error("\n❌  El import falló:", (err as Error).message)
  process.exit(1)
})
