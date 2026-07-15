/**
 * Seed: historial de cursos de la academia (2019–2026)
 *
 * Crea instructores + cursos a partir de la lista oficial de cursos impartidos.
 * Si existe una foto en liz_events con la misma fecha, se usa como portada del
 * curso y se siembra como primer item de su galería (course_gallery).
 *
 * Idempotente: si ya existe un curso con la misma start_date, se salta.
 *
 * USO:
 *   npx tsx scripts/seed-past-courses.ts
 */

import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  for (const raw of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim()
  }
}
loadEnvLocal()

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------
type Level = "beginner" | "intermediate" | "advanced" | "open"

type SeedCourse = {
  title: string
  instructor: string
  start: string // YYYY-MM-DD
  end?: string
  level?: Level
  description: string
}

const ACADEMY = "Academia Liz Cabriales"

const COURSES: SeedCourse[] = [
  // ── 2019–2021 (desde galería liz_events) ─────────────────────────────────
  {
    title: "Painting Gel y 3D Plastilina",
    instructor: "Gaby Camacho",
    start: "2019-06-19",
    description:
      "Curso impartido por la Master Gaby Camacho con la técnica de uñas Painting Gel y 3D Plastilina.",
  },
  {
    title: "Estructura y Técnicas Mixtas",
    instructor: "Maximiliano Cortéz",
    start: "2020-03-14",
    description:
      "Curso impartido por el Master Maximiliano Cortéz con un temario de Estructura y Técnicas Mixtas.",
  },
  {
    title: "One Stroke y Técnicas Mixtas",
    instructor: "Lucy Zayas",
    start: "2020-06-20",
    description:
      "Curso impartido por la Master Lucy Zayas con el temario de One Stroke y técnicas mixtas.",
  },
  {
    title: "3D Flat y Salón Mix",
    instructor: "Gaby Camacho",
    start: "2020-11-16",
    end: "2020-11-17",
    description:
      "Curso impartido por la Master Gaby Camacho con el temario de 3D flat y salón mix.",
  },
  {
    title: "Diseños Navideños",
    instructor: "Lalo Arroyo",
    start: "2020-12-06",
    description:
      "Curso impartido por el Master Lalo Arroyo con el temario de Diseños navideños.",
  },
  {
    title: "Estructura de Salón Profesional y Técnicas Mixtas",
    instructor: "Maximiliano Cortéz",
    start: "2021-04-24",
    description:
      "Curso impartido por el Master Maximiliano Cortéz y la Master Gaby Camacho con el tema de Estructura de salón profesional y técnicas mixtas.",
  },
  {
    title: "Acrygel y Press On",
    instructor: "Andrés Pergo",
    start: "2021-08-28",
    description:
      "Curso impartido por el Master Andrés Pergo con el temario de Acrygel y Press On.",
  },
  {
    title: "Técnicas Mixtas con Gel",
    instructor: "Jennifer Preciado",
    start: "2021-09-25",
    end: "2021-09-26",
    description:
      "Curso impartido por la Master Jennifer Preciado con el temario de técnicas mixtas con gel.",
  },
  {
    title: "Micropintura Básica de Cartón",
    instructor: "Ismael Camero",
    start: "2021-12-04",
    level: "beginner",
    description:
      "Curso impartido por el Master Ismael Camero con el Taller de Micropintura Básica de Cartón.",
  },

  // ── 2022 ─────────────────────────────────────────────────────────────────
  {
    title: "Perfeccionamiento en Tip y 3D",
    instructor: "Claudia Ferrer",
    start: "2022-02-05",
    end: "2022-02-06",
    description:
      "Curso impartido por la Master Claudia Ferrer con el Tema de Perfeccionamiento en tip y 3D.",
  },
  {
    title: "Look Natural en Estructura Básica",
    instructor: "Liz Torres",
    start: "2022-03-05",
    end: "2022-03-06",
    level: "beginner",
    description:
      "Curso impartido por la Master Liz Torres con el Temario de Look Natural en estructura básica.",
  },
  {
    title: "Onicoplastia con Medicamento Encapsulado y Reconstrucción Ungueal",
    instructor: "Raquel Escalante",
    start: "2022-04-09",
    description:
      "Curso impartido por la I.Q. Pdga. Raquel Escalante con el Tema de Onicoplastia con medicamento encapsulado y reconstrucción ungueal.",
  },
  {
    title: "Pedicure Spa · Módulo 1",
    instructor: "Lizeth Cabriales",
    start: "2022-05-08",
    description:
      "Curso impartido por la Maestra Lizeth Cabriales con el Módulo 1 de Pedicure Spa.",
  },
  {
    title: "Pedicure Spa y Bioseguridad",
    instructor: "Lizeth Cabriales",
    start: "2022-05-14",
    description:
      "Curso impartido por la Maestra Lizeth Cabriales con el tema de Pedicure Spa y Bioseguridad.",
  },
  {
    title: "Estructura XXL y Bisutería",
    instructor: "Ivette López",
    start: "2022-06-18",
    end: "2022-06-19",
    description:
      "Curso impartido por la Master Ivette López con el Tema de Estructura XXL y Bisutería.",
  },
  {
    title: "Micropintura en Flores y Técnicas Mixtas",
    instructor: "Mireya Torres",
    start: "2022-07-16",
    end: "2022-07-17",
    description:
      "Curso impartido por la Master Mireya Torres con el Taller de micropintura en flores y técnicas mixtas.",
  },
  {
    title: "Pedicure Spa · Módulo 1",
    instructor: "Lizeth Cabriales",
    start: "2022-08-01",
    description:
      "Curso impartido por la Maestra Lizeth Cabriales con el Módulo 1 de Pedicure Spa.",
  },
  {
    title: "Bioseguridad y Dry Pedicure",
    instructor: "Lore García",
    start: "2022-08-06",
    end: "2022-08-07",
    description:
      "Curso impartido por la Master Lore García con el Tema de Bioseguridad y Dry pedicure.",
  },
  {
    title: "Reconstrucción Ungueal con Medicamento Encapsulado",
    instructor: "Raquel Escalante",
    start: "2022-09-10",
    description:
      "Curso impartido por la I.Q. Pdga. Raquel Escalante con el Tema de Reconstrucción ungueal con medicamento encapsulado.",
  },
  {
    title: "Certificación UINS Novel 2022",
    instructor: ACADEMY,
    start: "2022-10-10",
    end: "2022-10-16",
    description: "Certificación UINS Novel 2022.",
  },
  {
    title: "Micropintura Básica",
    instructor: "Ismael Camero",
    start: "2022-11-12",
    level: "beginner",
    description:
      "Curso impartido por el Master Ismael Camero con el Tema de Micropintura básica.",
  },
  {
    title: "Estructura de Salón con Acrílico",
    instructor: "Braulio Cosmar",
    start: "2022-11-27",
    description:
      "Curso impartido por el Master Braulio Cosmar con el Tema de Estructura de salón con acrílico.",
  },
  {
    title: "Pedicure Spa · Módulo 1",
    instructor: "Lizeth Cabriales",
    start: "2022-12-01",
    description:
      "Curso impartido por la Maestra Lizeth Cabriales con el Módulo 1 de Pedicure Spa.",
  },
  {
    title: "Mini Formas en Polygel",
    instructor: "Liz Torres",
    start: "2022-12-03",
    description:
      "Curso impartido por la Master Liz Torres con el tema de mini formas en polygel.",
  },
  {
    title: "Diseños de Temporada en Gel",
    instructor: "Jennifer Preciado",
    start: "2022-12-04",
    description:
      "Curso impartido por la Master Jennifer Preciado con diseños de temporada en gel.",
  },

  // ── 2023 ─────────────────────────────────────────────────────────────────
  {
    title: "One Stroke y Dry Manicura",
    instructor: "Willy Álvarez",
    start: "2023-01-21",
    end: "2023-01-22",
    description:
      "Curso impartido por el Nail art trainer Willy Álvarez con el Temario de One Stroke y Dry Manicura.",
  },
  {
    title: "Acripie en Polygel",
    instructor: "Cesar Luna",
    start: "2023-02-27",
    description:
      "Curso impartido por Cesar Luna con el Tema de Acripie en Polygel.",
  },
  {
    title: "Dry Manicure Balance",
    instructor: "Lucero Enríquez",
    start: "2023-03-05",
    description:
      "Curso impartido por Lucero Enríquez con el Tema de Dry Manicure Balance.",
  },
  {
    title: "Dry Manicure Ruso y Estructura de Salón de una Perla",
    instructor: "Javier Rubalcava",
    start: "2023-03-18",
    end: "2023-03-19",
    description:
      "Curso impartido por el Master Javier Rubalcava con el Temario de Dry Manicure Ruso y Estructura de Salón de una Perla.",
  },
  {
    title: "Estructura Nivel 1",
    instructor: "León Cabriales",
    start: "2023-04-10",
    end: "2023-04-11",
    level: "beginner",
    description:
      "Curso impartido por el Master León Cabriales con el Tema de Estructura nivel 1.",
  },
  {
    title: "Pedicure Estética en Polygel",
    instructor: "Cesar Luna",
    start: "2023-04-16",
    description:
      "Curso impartido por Cesar Luna con el Tema de Pedicure Estética en Polygel (Baby Boomer, French y Decoración).",
  },
  {
    title: "Reflexología Podal Holística",
    instructor: "Canek Muñoz Valencia",
    start: "2023-04-22",
    end: "2023-04-23",
    description:
      "Curso impartido por el Lic. Naturópata Canek Muñoz Valencia con el Temario de Reflexología Podal Holística.",
  },
  {
    title: "Perfeccionamiento en Tip",
    instructor: "Lucero Enríquez",
    start: "2023-05-06",
    end: "2023-05-07",
    description:
      "Curso impartido por Lucero Enríquez con el Tema de Perfeccionamiento en tip.",
  },
  {
    title: "Estructura de Salón y Técnicas Mixtas (Cristalería y 3D)",
    instructor: "Ivette López",
    start: "2023-05-20",
    end: "2023-05-21",
    description:
      "Curso impartido por la Master Ivette López con el Tema de Estructura de salón y técnicas mixtas (Cristalería y 3D).",
  },
  {
    title: "Dry Manicure Pro",
    instructor: "Itzel Osorio Estrada",
    start: "2023-05-28",
    description:
      "Curso impartido por Itzel Osorio Estrada con el tema de Dry Manicure Pro.",
  },
  {
    title: "Polygel: Frozen, Flowers, Mosaico y Flor 3D",
    instructor: "Adán Ramírez",
    start: "2023-06-17",
    end: "2023-06-18",
    description:
      "Curso impartido por el Master Adán Ramírez con el Tema de Polygel (Frozen, flowers, mosaico y flor 3D) con valor curricular ante la SEP.",
  },
  {
    title: "The Ultimate Nail Camp 2023",
    instructor: ACADEMY,
    start: "2023-07-08",
    end: "2023-07-11",
    description: "The Ultimate Nail Camp 2023.",
  },
  {
    title: "Pedicure Spa",
    instructor: "Meyda Salamanca",
    start: "2023-07-29",
    description:
      "Curso impartido por la Master Meyda Salamanca con el Tema de Pedicure Spa con valor ante la SEP.",
  },
  {
    title: "Diseño y Cartoon",
    instructor: "Jennifer Preciado",
    start: "2023-08-19",
    end: "2023-08-20",
    description:
      "Curso impartido por la Master Jennifer Preciado con el Taller de diseño y cartoon.",
  },
  {
    title: "Cartoon Intermedio y Acuarela",
    instructor: "Ismael Camero",
    start: "2023-09-16",
    end: "2023-09-17",
    level: "intermediate",
    description:
      "Curso impartido por los Master Ismael Camero y Mónica Castro con el Temario de Cartoon intermedio y Acuarela.",
  },
  {
    title: "Técnica de Hilo Retractor",
    instructor: "Lizeth Cabriales",
    start: "2023-09-23",
    description:
      "Curso impartido por la Maestra Lizeth Cabriales con la Técnica de Hilo Retractor.",
  },
  {
    title: "Pedicure Pro",
    instructor: "Meyda Salamanca",
    start: "2023-11-11",
    description:
      "Curso impartido por la Master Meyda Salamanca con el Tema de Pedicure Pro.",
  },
  {
    title: "Manicura Pro, Técnica Híbrida y Onicofagia",
    instructor: "Liz Torres",
    start: "2023-11-18",
    end: "2023-11-19",
    description:
      "Curso impartido por la Master Liz Torres con el Temario de Manicura Pro, Técnica híbrida (Rubber, polygel y gel constructor) y Onicofagia.",
  },
  {
    title: "Estructura 1 y Estructura French",
    instructor: "Andrés Pergo",
    start: "2023-11-24",
    description:
      "Curso impartido por el Master Andrés Pergo con el tema Estructura 1 y Estructura French.",
  },

  // ── 2024 ─────────────────────────────────────────────────────────────────
  {
    title: "Estructura de Salón de una Perla y Perfect French",
    instructor: "Javier Rubalcava",
    start: "2024-02-17",
    end: "2024-02-18",
    description:
      "Curso impartido por el Master Javier Rubalcava con el Taller de Estructura de Salón (una sola perla) y Perfect French.",
  },
  {
    title: "Dry Pedicure y Dry Manicura",
    instructor: "Willy Álvarez",
    start: "2024-03-09",
    end: "2024-03-10",
    description:
      "Curso impartido por el Nail art trainer Willy Álvarez con el Tema de Dry Pedicure y Dry Manicura.",
  },
  {
    title: "Pedicura Spa",
    instructor: "Dulce Blanquet",
    start: "2024-03-30",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Pedicura Spa.",
  },
  {
    title: "Estructura Nivel 1",
    instructor: "León Cabriales",
    start: "2024-04-11",
    end: "2024-04-12",
    level: "beginner",
    description:
      "Curso impartido por el Master León Cabriales con el Tema de Estructura Nivel 1.",
  },
  {
    title: "Manicura Spa",
    instructor: "Dulce Blanquet",
    start: "2024-04-20",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Manicura Spa.",
  },
  {
    title: "Reflexología Podal y Técnicas Avanzadas",
    instructor: "Canek Muñoz Valencia",
    start: "2024-05-25",
    end: "2024-05-26",
    level: "advanced",
    description:
      "Curso impartido por el Lic. Naturópata Canek Muñoz Valencia con el Temario de Reflexología Podal y Técnicas Avanzadas.",
  },
  {
    title: "Dry Manicure Pro",
    instructor: "Itzel Osorio Estrada",
    start: "2024-06-15",
    description:
      "Curso impartido por Itzel Osorio Estrada con el tema de Dry Manicure Pro.",
  },
  {
    title: "Flores Camaleón",
    instructor: "Jennifer Preciado",
    start: "2024-06-22",
    end: "2024-06-23",
    description:
      "Curso impartido por la Master Jennifer Preciado con el Temario de Flores Camaleón.",
  },
  {
    title: "Estructura de Salón y Estructura Híbrida",
    instructor: "Luis Soto",
    start: "2024-07-27",
    end: "2024-07-28",
    description:
      "Curso impartido por el Master Luis Soto con el Tema de Estructura de salón y Estructura híbrida.",
  },
  {
    title: "Manicura Combinada y Técnica Híbrida",
    instructor: "Laura Torres",
    start: "2024-09-01",
    description:
      "Curso impartido por la Master Laura Torres con el Tema de Manicura combinada y técnica híbrida.",
  },
  {
    title: "Reconstrucción Ungueal, Onicomicosis y Quiropodia",
    instructor: "Raquel Escalante",
    start: "2024-09-20",
    end: "2024-09-21",
    description:
      "Curso impartido por la I.Q. Pdga. Raquel Escalante y el Pdgo. Héctor Alba con el Taller de reconstrucción ungueal, manejo de ácidos para onicomicosis, ortonixias y sistema de mediación, actualización en servicio de quiropodia y manejo de instrumental y fresas.",
  },
  {
    title: "Bioseguridad en el Área de la Belleza",
    instructor: "Ángela Juárez",
    start: "2024-10-05",
    description:
      "Curso impartido por la Master Ángela Juárez con el Tema de Bioseguridad en el área de la belleza.",
  },
  {
    title: "Ortonixia",
    instructor: "Oksana Makarova",
    start: "2024-10-14",
    description:
      "Curso impartido por la Pdga. Oksana Makarova con el Tema de Ortonixia.",
  },
  {
    title: "Onicocriptosis",
    instructor: "Oksana Makarova",
    start: "2024-10-15",
    description:
      "Curso impartido por la Pdga. Oksana Makarova con el Tema de Onicocriptosis.",
  },
  {
    title: "3D Floral, Bisutería y Estructura en Tip XXL",
    instructor: "Fanny Madrigal",
    start: "2024-10-26",
    end: "2024-10-27",
    description:
      "Curso impartido por la Master Fanny Madrigal con el Temario de 3D floral, bisutería y estructura en tip XXL.",
  },
  {
    title: "Anime Art Nivel Intermedio",
    instructor: "Ismael Camero",
    start: "2024-11-09",
    level: "intermediate",
    description:
      "Curso impartido por el Master Ismael Camero con el Tema de Anime art nivel intermedio.",
  },
  {
    title: "Cartoon 3D Nivel Avanzado",
    instructor: "Ismael Camero",
    start: "2024-11-10",
    level: "advanced",
    description:
      "Curso impartido por el Master Ismael Camero con el Tema de Cartoon 3D nivel avanzado.",
  },
  {
    title: "Gel Xperience",
    instructor: "Liz Torres",
    start: "2024-11-16",
    end: "2024-11-17",
    description:
      "Curso impartido por la Master Liz Torres con el Temario de Gel Xperience.",
  },
  {
    title: "Acuario French Navideño",
    instructor: "Claudia Ferrer",
    start: "2024-12-07",
    description:
      "Curso impartido por la Master Claudia Ferrer con el Temario de Acuario French Navideño.",
  },

  // ── 2025 ─────────────────────────────────────────────────────────────────
  {
    title: "Pedicure Estético",
    instructor: "Dulce Blanquet",
    start: "2025-01-25",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Pedicure Estético.",
  },
  {
    title: "Dry Pedicure Pro",
    instructor: "Willy Álvarez",
    start: "2025-02-21",
    description:
      "Curso impartido por el Nail art trainer Willy Álvarez con el Tema de Dry Pedicure Pro.",
  },
  {
    title: "Salón Polygel System y Manicura Combinada",
    instructor: "Willy Álvarez",
    start: "2025-02-22",
    end: "2025-02-23",
    description:
      "Curso impartido por el Nail art trainer Willy Álvarez con el Temario de Salón Polygel System y Manicura Combinada.",
  },
  {
    title: "Gel Semipermanente Rubber y Manicure Express",
    instructor: "Dulce Blanquet",
    start: "2025-02-28",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Gel Semipermanente Rubber y Manicure Express.",
  },
  {
    title: "Onicogrifosis y Onicocriptosis",
    instructor: "Dorty Girón Ceballos",
    start: "2025-03-22",
    end: "2025-03-23",
    description:
      "Curso impartido por la Master Dorty Girón Ceballos y el Pdgo. Armando Calderón con el Tema de Onicogrifosis y Onicocriptosis. Con valor ante la SEP.",
  },
  {
    title: "Perfeccionamiento",
    instructor: "León Cabriales",
    start: "2025-04-15",
    end: "2025-04-16",
    description:
      "Curso impartido por el Master León Cabriales con el Tema de Perfeccionamiento.",
  },
  {
    title: "Pedicure Ucraniano 1 y 2, Onicomicosis y Onicolisis",
    instructor: "Oksana Makarova",
    start: "2025-05-17",
    end: "2025-05-18",
    description:
      "Curso impartido por la Pdga. Oksana Makarova con el Tema de Pedicure Ucraniano 1 y 2, Onicomicosis y Onicolisis.",
  },
  {
    title: "Pedicura Rusa con Wraps",
    instructor: "Lore García",
    start: "2025-05-24",
    description:
      "Curso impartido por la Master Lore García con el Tema de Pedicura Rusa con Wraps.",
  },
  {
    title: "Prótesis Segura sin Acrílico y Onicomicosis",
    instructor: "Lore García",
    start: "2025-05-25",
    description:
      "Curso impartido por la Master Lore García con el Tema de Prótesis segura sin acrílico y Onicomicosis.",
  },
  {
    title: "Diplomado de Bombas Efervescentes",
    instructor: "Lizeth Cabriales",
    start: "2025-06-06",
    description:
      "Diplomado de Bombas Efervescentes impartido por la Maestra Lizeth Cabriales.",
  },
  {
    title: "Manicura Combinada Balance, Diseño y Técnicas Mixtas",
    instructor: "Alonso Caraveo (Cardone)",
    start: "2025-06-14",
    end: "2025-06-15",
    description:
      "Curso impartido por el Master Alonso Caraveo (Cardone) con el Temario de Manicura combinada balance y esmaltado, Diseño y técnicas mixtas.",
  },
  {
    title: "Relieves, Efectos, Técnicas Mixtas y Manicura Combinada",
    instructor: "Jennifer Preciado",
    start: "2025-07-12",
    end: "2025-07-13",
    description:
      "Curso impartido por la Master Jennifer Preciado y el Master Luis Soto con el Tema de Relieves, efectos, Técnicas Mixtas, Manicura combinada y hardware.",
  },
  {
    title: "Soft Gel",
    instructor: "Dulce Blanquet",
    start: "2025-07-26",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Soft Gel.",
  },
  {
    title: "3D Mixto (Plastilina y Acrílico) y Estructura en Tip",
    instructor: "Diana Gómez",
    start: "2025-08-02",
    end: "2025-08-03",
    description:
      "Curso impartido por la Master Diana Gómez con el Taller de 3D mixto (plastilina y acrílico) y estructura en tip.",
  },
  {
    title: "Pedicura Pro Dry",
    instructor: "Laura Torres",
    start: "2025-08-15",
    description:
      "Curso impartido por la Master Laura Torres con el Tema de Pedicura Pro Dry.",
  },
  {
    title: "Técnica Híbrida, Dual System y Diseño de Texturas",
    instructor: "Anna Shevchenko",
    start: "2025-08-30",
    end: "2025-08-31",
    description:
      "Curso impartido por la Master Anna Shevchenko con el Temario de Técnica Híbrida y Dual System, Diseño de Texturas.",
  },
  {
    title: "Diplomado Integral Nail Formation",
    instructor: ACADEMY,
    start: "2025-09-08",
    end: "2025-09-12",
    description:
      "Diplomado Integral Nail Formation (Manikura S-Mart, Biosecurity, Chemistry and Dual Design Forms).",
  },
  {
    title: "Manicura Exprés y Aplicación de Uñas Soft Gel",
    instructor: "Dulce Blanquet",
    start: "2025-09-20",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Manicura Exprés y Aplicación de uñas Soft Gel.",
  },
  {
    title: "Quiropodia: Onicocriptosis y Reconstrucción Ungueal (Fixonic 5.0)",
    instructor: "Martín Dávila",
    start: "2025-09-23",
    description:
      "Capacitación especializada de Quiropodia, Onicocriptosis y reconstrucción ungueal con el sistema de Fixonic 5.0, por el Lic. Martín Dávila C. y la Lic. Karina Rojas Gtz.",
  },
  {
    title: "ROCK LAB · Mix Nail Art",
    instructor: "Danny Art",
    start: "2025-10-18",
    description:
      "Curso impartido por el Master Danny Art con el Temario de ROCK LAB – Mix Nail Art.",
  },
  {
    title: "Gel Polish · Clase Privada Personalizada",
    instructor: "Dulce Blanquet",
    start: "2025-10-26",
    description:
      "Clase Privada Personalizada impartida por Dulce Blanquet con el tema de Gel Polish.",
  },
  {
    title: "Seminario Quiro Aesthetic Pedicure 2025",
    instructor: ACADEMY,
    start: "2025-11-16",
    description: "Seminario Quiro Aesthetic Pedicure 2025.",
  },
  {
    title: "Patch Art y 3D en Acrílico y Gel Moldeador",
    instructor: "Alberto Fernández",
    start: "2025-12-06",
    end: "2025-12-07",
    description:
      "Curso impartido por el Nail Trainer Alberto Fernández con el Temario de Patch Art y 3D (en acrílico y gel moldeador).",
  },

  // ── 2026 ─────────────────────────────────────────────────────────────────
  {
    title: "Soft Gel",
    instructor: "Dulce Blanquet",
    start: "2026-01-24",
    description:
      "Curso impartido por Dulce Blanquet con el tema de Soft Gel.",
  },
  {
    title: "1ª Master Class 2026",
    instructor: ACADEMY,
    start: "2026-01-31",
    description:
      "1ª Master Class 2026: Estructura de polygel, cartoon básico, técnicas mixtas y 3D mixto.",
  },
  {
    title: "Onicomicosis, Bioseguridad y Química del Producto",
    instructor: "Andrés Castellanos",
    start: "2026-02-14",
    end: "2026-02-15",
    description:
      "Curso impartido por el Químico Farmacobiólogo Andrés Castellanos con el Temario de Onicomicosis, Bioseguridad, Química del producto y primeros auxilios.",
  },
  {
    title: "Pedicure en Seco",
    instructor: "Liz Togo",
    start: "2026-03-14",
    description:
      "Curso impartido por la Master Liz Togo con el Temario de Pedicure en seco.",
  },
  {
    title: "Nails Aerógrafo",
    instructor: "Liz Togo",
    start: "2026-03-15",
    description:
      "Curso impartido por la Master Liz Togo con el Temario de Nails Aerógrafo.",
  },
  {
    title: "Dry Pedicura con Hilos de Polímeros",
    instructor: "Hilda López",
    start: "2026-04-04",
    description:
      "Curso impartido por la Master Hilda López con el Temario de Dry Pedicura con hilos de polímeros.",
  },
  {
    title: "Dry Manicura con Hilos de Polímeros",
    instructor: "Hilda López",
    start: "2026-04-05",
    description:
      "Curso impartido por la Master Hilda López con el Temario de Dry Manicura con hilos de polímeros.",
  },
  {
    title: "Estructura en Polygel",
    instructor: "Gabo Castro",
    start: "2026-04-25",
    end: "2026-04-26",
    description:
      "Curso impartido por el Master Gabo Castro con el Tema de Estructura en Polygel.",
  },
  {
    title: "Diseños al Estilo Talavera",
    instructor: "Michelle Folk",
    start: "2026-05-23",
    description:
      "Curso impartido por la Master Michelle Folk con el Temario de Diseños al estilo Talavera.",
  },
  {
    title: "Taller de Quiropodia ABC 2026",
    instructor: ACADEMY,
    start: "2026-06-06",
    end: "2026-06-07",
    description: "Taller de Quiropodia ABC 2026.",
  },
  {
    title: "Técnicas Mixtas",
    instructor: "Grecia Huitrón",
    start: "2026-06-13",
    description:
      "Curso impartido por la Master Grecia Huitrón con el Temario de Técnicas Mixtas.",
  },
  {
    title: "Dry Pedicura, Estética Correcta y Prótesis Ungueal",
    instructor: "Julián Pascual",
    start: "2026-07-11",
    description:
      "Curso impartido por el Master Julián Pascual con el Temario de Dry Pedicura, Estética correcta y prótesis ungueal.",
  },
  {
    title: "Correcciones del Antepié, Espiculotomía y Ortonixia",
    instructor: "Héctor Alba",
    start: "2026-08-08",
    description:
      "Curso impartido por el Pdgo. Héctor Alba con el Temario de Correcciones del Antepié con prótesis de silicona, espiculotomía y Ortonixia.",
  },
  {
    title: "Pedicura Química y Cosmética con Wraps",
    instructor: "Lore García",
    start: "2026-08-15",
    description:
      "Curso impartido por la Pdga. Lore García con el Temario de Pedicura Química y Cosmética con Wraps.",
  },
  {
    title: "Softgel Revolución y Manicura Xpress",
    instructor: "Liz Togo",
    start: "2026-08-29",
    description:
      "Curso impartido por la Master Liz Togo con el Temario de Softgel Revolución y Manicura XPRESS.",
  },
  {
    title: "2ª Master Class 2026",
    instructor: ACADEMY,
    start: "2026-09-05",
    description: "2ª Master Class 2026.",
  },
  {
    title: "Técnicas Mixtas: Stamping",
    instructor: "Lalo Arroyo",
    start: "2026-09-19",
    description:
      "Curso impartido por el Master Lalo Arroyo con el Temario de Técnicas Mixtas (Stamping).",
  },
  {
    title: "Edición II Seminario Quiro Aesthetic Pedicure",
    instructor: ACADEMY,
    start: "2026-11-14",
    description: "Edición II del Seminario Quiro Aesthetic Pedicure.",
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const LOCATION = "Academia Liz Cabriales, Tampico"

async function main() {
  // 1. Cursos existentes (por fecha de inicio) para no duplicar
  const { data: existing, error: exErr } = await db
    .from("courses")
    .select("id, title, start_date")
  if (exErr) throw exErr
  const existingByDate = new Map(existing.map((c) => [c.start_date, c]))

  // 2. Fotos de liz_events por fecha
  const { data: events, error: evErr } = await db
    .from("liz_events")
    .select("id, image_url, event_date")
  if (evErr) throw evErr
  const photoByDate = new Map<string, string>()
  for (const ev of events) {
    if (ev.event_date && !photoByDate.has(ev.event_date)) {
      photoByDate.set(ev.event_date, ev.image_url)
    }
  }

  // 3. Instructores existentes por nombre (case-insensitive)
  const { data: instructors, error: insErr } = await db
    .from("instructors")
    .select("id, name")
  if (insErr) throw insErr
  const instructorByName = new Map(
    instructors.map((i) => [i.name.trim().toLowerCase(), i.id])
  )

  async function getInstructorId(name: string): Promise<string> {
    const key = name.trim().toLowerCase()
    const found = instructorByName.get(key)
    if (found) return found
    const { data, error } = await db
      .from("instructors")
      .insert({ name: name.trim() })
      .select("id")
      .single()
    if (error || !data) throw new Error(`Instructor "${name}": ${error?.message}`)
    instructorByName.set(key, data.id)
    console.log(`  + instructor: ${name}`)
    return data.id
  }

  let created = 0
  let skipped = 0
  let withPhoto = 0

  for (const c of COURSES) {
    const clash = existingByDate.get(c.start)
    if (clash) {
      console.log(`  ~ ya existe curso el ${c.start} ("${clash.title}") — salto "${c.title}"`)
      skipped++
      continue
    }

    const instructorId = await getInstructorId(c.instructor)
    const cover = photoByDate.get(c.start) ?? null

    const { data: course, error } = await db
      .from("courses")
      .insert({
        instructor_id: instructorId,
        title: c.title,
        description: c.description,
        cover_image: cover,
        price: 0,
        capacity: 20,
        level: c.level ?? "open",
        start_date: c.start,
        end_date: c.end ?? c.start,
        start_time: "10:00",
        location: LOCATION,
        is_published: true,
        allow_online_registration: false,
        show_price_public: false,
        show_capacity_public: false,
      })
      .select("id")
      .single()
    if (error || !course) {
      throw new Error(`Curso "${c.title}" (${c.start}): ${error?.message}`)
    }
    existingByDate.set(c.start, { id: course.id, title: c.title, start_date: c.start })

    if (cover) {
      const { error: galErr } = await db.from("course_gallery").insert({
        course_id: course.id,
        type: "image",
        url: cover,
        caption: null,
        position: 0,
      })
      if (galErr) throw new Error(`Galería de "${c.title}": ${galErr.message}`)
      withPhoto++
    }

    created++
    console.log(`  ✓ ${c.start} — ${c.title}${cover ? " (con foto)" : ""}`)
  }

  console.log(
    `\nListo: ${created} cursos creados (${withPhoto} con foto de la galería), ${skipped} saltados por fecha duplicada.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
