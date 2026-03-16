# ai-context.md

  

## Qué es este proyecto

  

Plataforma web para **Liz Cabriales**, una academia y salón de uñas en México.

El sistema centraliza tres operaciones del negocio:

  

1. **Ecommerce de productos** — venta nacional de productos para uñas, pestañas y podología (prioridad #1, 60% del negocio)

2. **Cursos y talleres presenciales** — inscripción, pago y control de asistencia

3. **Sistema de citas** — reserva y pago de servicios del salón

  

El público es mayoritariamente femenino. El mercado es México.

Los colores de marca son dorado y negro.

  

---

  

## Stack

  

| Capa | Tecnología |

|---|---|

| Frontend | Next.js 14 (App Router) + React |

| Lenguaje | TypeScript — obligatorio |

| Base de datos | Supabase (PostgreSQL) |

| Auth | Supabase Auth (email/password activo, Google OAuth pendiente) |

| Estilos | Tailwind CSS + Shadcn/ui |

| Pagos | MercadoPago o Stripe (sin definir aún) |

| Backend | API Routes de Next.js |

  

---

  

## Estado actual — 16 marzo 2026

  

| Área | Estado |

|---|---|

| Landing page | ✅ Completa — Hero, Marcas, PromoCards, Galería, FeaturedKits, FeaturedColors, AcademyBanner, Testimonials, Benefits, Footer |

| Auth | ✅ Login y registro funcionando, redirección por rol |

| Base de datos | ✅ 18 tablas creadas en Supabase con RLS y seed de categorías |

| Middleware | ✅ Protección de rutas /admin/*, /perfil/*, /checkout/* |

| Panel admin | ✅ Básico funcionando, CRUD de productos pendiente |

| Catálogo /tienda | ⏳ Pendiente conectar a Supabase real |

| Carrito | ⏳ Solo React Context + localStorage |

| Ecommerce | ⏳ Pendiente |

| Booking | ⏳ Pendiente |

| Cursos | ⏳ Pendiente |

  

## Lo que tiene la landing ahorita

  

- Navbar con megamenú dinámico (categorías desde Supabase)

- Hero slider

- BrandsSlider — marcas distribuidoras

- PromoCards — 3 tarjetas (Tienda, Cursos, Servicios)

- InspirationGallery — galería con modal y /inspiracion

- FeaturedKits — carrusel interactivo

- FeaturedColors — carrusel de colores

- AcademyBanner — banner full-height con collage 2x2 y CTA a /cursos

- Testimonials — 3 reseñas reales con estrellas, slider en móvil

- Benefits — 5 beneficios con íconos lucide-react

- Footer — negro/dorado, 3 columnas, links reales de contacto

- **Pendiente: contenido real** — imágenes son placeholders

  

---

  

## Contexto del negocio (obtenido de scraping Instagram @liz_cabriales)

  

Ver `context/brand-research.md` para el detalle completo. Resumen:

  

- 6 años como organizadora en Tampico, Tamaulipas

- Distribuye 15+ marcas profesionales

- Red de 20+ masters nacionales e internacionales

- Cursos con apartado desde $200 hasta $1,000

- Acepta 6 meses sin intereses

- WhatsApp: 833 218 3399

  

---

  

## Reunión con Liz — lunes 16 marzo 2026

  

**Objetivo:** Mostrar MVP épico, que se enamoren y quieran los módulos extra.

  

**Estrategia:**

1. Mostrar la landing completa y el sistema funcionando

2. Dejar que se emocionen con lo que ya existe

3. Al final proponer los módulos adicionales: cursos, citas, fidelización

4. NO mencionar lo que falta como "falta" — presentarlo como próximas fases

  

**Lo que pidieron originalmente:** Tienda básica con productos, carrito y panel admin.

**Lo que van a ver:** Plataforma completa con landing profesional, auth, DB real, inspiración, kits, colores.

  

**Preguntas clave para la reunión:**

- Proveedor de pagos: MercadoPago vs Stripe

- Fotos reales del negocio, productos y cursos

- Logos de marcas distribuidoras

- Textos definitivos del sitio

- ¿Les interesa el módulo de cursos?

- ¿Les interesa el módulo de citas?

- ¿Les interesa programa de fidelización con puntos?

  

---

  

## Ideas para proponer en la reunión (módulos extra)

  

- **Módulo de cursos** — inscripción online, pago, cupo limitado, confirmación por correo

- **Módulo de citas** — reserva de servicios del salón, pago adelantado, sin reembolso

- **Programa de fidelización** — puntos por compra, recompensas, clientes recurrentes

- **Filtros avanzados en tienda** — por marca, por categoría, por tipo de técnica, por color

- **Integración con Instagram** — galería UGC conectada al feed real

  

---

  

## Estructura del proyecto

```

liz-cabriales/

├── app/

│   ├── (auth)/login/

│   ├── admin/

│   ├── components/

│   │   ├── hero/HeroSlider.tsx

│   │   ├── navbar/ (Navbar, MegaMenu, CartMenu, SearchMenu, menuData)

│   │   ├── BrandsSlider.tsx

│   │   ├── PromoCards.tsx

│   │   ├── InspirationGallery.tsx

│   │   ├── FeaturedKits.tsx

│   │   └── FeaturedColors.tsx

│   ├── inspiracion/page.tsx

│   ├── globals.css

│   ├── layout.tsx

│   └── page.tsx

├── lib/

│   ├── supabase/client.ts

│   ├── supabase/server.ts

│   └── users.ts

├── types/index.ts

├── middleware.ts

├── docs/

└── .env.local

```

  

---

  

## Flujo de trabajo

```

Obsidian (contexto) → Claude (razonamiento + prompt) → Cursor (ejecución) → Claude (actualizar vault) → Obsidian

```

  

1. Denzel describe la tarea

2. Claude pide los .md relevantes y genera el prompt

3. Cursor ejecuta y manda resumen

4. Denzel pega el resumen a Claude

5. Claude actualiza los .md afectados

6. Denzel copia los .md actualizados en Obsidian

  

---

  

## Qué leer antes de generar código

  

Siempre leer primero:

1. `tech/dev-rules.md`

2. `tech/database-schema.md`

3. `tech/stack.md`

4. `tech/architecture.md`

  

Luego según módulo:

  

| Módulo | Archivos adicionales |

|---|---|

| Landing/UI | `ux/design-notes.md` + `ux/pages.md` + `context/brand-research.md` |

| Ecommerce | `product/product-overview.md` + `commerce/order-flow.md` + `product/user-flows.md` |

| Citas | `booking/booking-rules.md` + `booking/services.md` |

| Cursos | `courses/courses-rules.md` |

| Admin | `admin/admin-permissions.md` |

| Pagos | `payments/proveedorpagos.md` |

  

---

  

## Reglas críticas para la IA

  

- **TypeScript siempre** — no generes JavaScript

- **No hardcodees precios, textos clave ni URLs** — van en `constants/`

- **Cliente Supabase server** para Server Components y API Routes

- **Cliente Supabase client** para Client Components

- **Nunca queries inline en componentes** — todas las queries van en funciones nombradas en `lib/supabase/`

- **Zod para toda validación**

- **Respuesta de API siempre consistente:**

  - Éxito: `{ data: T, error: null }`

  - Error: `{ data: null, error: { message: string, code?: string } }`

- **Todo texto visible al usuario en español**

- **Imágenes en Supabase Storage**, nunca en el repo

  

---

  

## Próximos pasos inmediatos

  

1. Footer con datos reales del negocio

2. Actualizar copy de todas las secciones con contenido real de brand-research.md

3. Catálogo /tienda conectado a Supabase

4. CRUD de productos en panel admin

5. Carrito conectado a Supabase

  

---

  

## Notas importantes

  

- Proveedor de pagos sin definir — no implementar lógica de pagos hasta resolverlo

- Todas las imágenes actuales son placeholders de picsum — se reemplazan con fotos reales después de la reunión

- El carrito actual es solo React Context + localStorage

- Google OAuth pendiente

- El negocio opera más como academia que como tienda — la landing debe reflejarlo

- Liz no sabe que estamos construyendo módulos de cursos y citas — es una sorpresa para la reunión