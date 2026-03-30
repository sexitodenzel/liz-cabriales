# ai-context.md

## Qué es este proyecto

Plataforma web para **Liz Cabriales**, una academia y salón de uñas en México. El sistema centraliza tres operaciones del negocio:

1. **Ecommerce de productos** — venta nacional de productos para uñas, pestañas y podología (prioridad #1)
2. **Cursos y talleres presenciales** — inscripción, pago y control de asistencia
3. **Sistema de citas** — reserva y pago de servicios del salón

El público es mayoritariamente femenino. El mercado es México. Los colores de marca son dorado y negro.

---

## Stack

|Capa|Tecnología|
|---|---|
|Frontend|Next.js 14 (App Router) + React|
|Lenguaje|TypeScript — obligatorio en todo|
|Base de datos|Supabase (PostgreSQL + RLS)|
|Auth|Supabase Auth (email/password activo, Google OAuth pendiente)|
|Estilos|Tailwind CSS + Shadcn/ui|
|Pagos|MercadoPago (definido — pendiente credenciales de producción de Liz)|
|Backend|API Routes de Next.js|
|Email|Por definir (Resend recomendado)|

---

## Estado actual — 29 marzo 2026

|Área|Estado|
|---|---|
|Landing page|✅ Completa|
|Auth|✅ Login y registro funcionando, redirección por rol|
|Base de datos|✅ 18 tablas en Supabase con RLS y seed de productos|
|Middleware|✅ Protección de rutas /admin/_, /perfil/_, /checkout/*|
|Panel admin `/admin/products`|✅ CRUD de productos con soft delete e inline editing|
|Catálogo `/tienda`|✅ Conectado a Supabase, filtros por categoría y marca|
|Carrito|✅ Persistente — guest localStorage + merge a Supabase al login|
|Página `/carrito`|✅ Con resumen, barra envío gratis y CTA a checkout|
|Checkout y pagos|⏳ Sprint 1 — EN PROGRESO|
|Órdenes admin|⏳ Sprint 2|
|Módulo de citas|⏳ Fase 2|
|Módulo de cursos|⏳ Fase 2|
|Admin multi-rol|⏳ Fase 2|

---

## Sprint actual — Sprint 1

**Objetivo:** Checkout funcional con MercadoPago **Plazo:** ~2 semanas desde 29 marzo 2026 **Ver detalle:** `delivery/sprint-actual.md`

---

## Financiero del proyecto

|Concepto|Monto|
|---|---|
|Total acordado|$22,000 MXN|
|Anticipo cobrado|$2,000 MXN|
|Pendiente|$20,000 MXN|

Distribución: Fase 1 ($8k) → Fase 2 ($8k) → Fase 3 retainer mensual (TBD) Ver detalle: `delivery/project-charter.md`

---

## Estructura del vault

```
docs/
├── delivery/                    ← gestión del proyecto
│   ├── project-charter.md       ← qué construimos, para qué, financiero
│   ├── roadmap.md               ← fases, sprints, entregables, fechas
│   ├── backlog.md               ← todo lo que falta, priorizado
│   ├── sprint-actual.md         ← LEER SIEMPRE AL INICIAR SESIÓN
│   ├── decisions-log.md         ← decisiones aprobadas por Liz
│   └── meetings/
│       └── 2026-03-16.md
├── tech/
│   ├── database-schema.md       ← esquema completo de 18 tablas
│   ├── api-design.md            ← endpoints, contratos, validaciones
│   ├── security-model.md        ← roles, permisos, RLS
│   ├── dev-rules.md             ← reglas obligatorias de código
│   ├── architecture.md
│   └── stack.md
├── context/
│   ├── brand-research.md
│   ├── business-model.md
│   ├── target-users.md
│   └── vision.md
├── product/
│   ├── product-overview.md
│   ├── user-flows.md
│   ├── features.md
│   ├── pricing.md
│   └── catalogo.md
├── commerce/
│   └── order-flow.md
├── booking/
│   ├── booking-rules.md
│   └── services.md
├── courses/
│   ├── courses-rules.md
│   └── courses-rules-dos.md
├── payments/
│   ├── proveedorpagos.md
│   └── proveedorpagos-2.md
├── admin/
│   └── admin-permissions.md
├── ux/
│   ├── design-notes.md
│   └── pages.md
├── ai-context.md                ← SIEMPRE pegar al iniciar sesión
└── claude-prompt.md             ← SIEMPRE pegar al iniciar sesión
```

> ⚠️ `tasks/roadmap.md` y `tasks/backlog.md` están deprecados. Usar `delivery/roadmap.md` y `delivery/backlog.md` en su lugar.

---

## Qué leer antes de generar código

**Siempre:**

1. `delivery/sprint-actual.md` ← qué estamos construyendo hoy
2. `tech/dev-rules.md`
3. `tech/database-schema.md`

**Según módulo:**

|Módulo|Archivos adicionales|
|---|---|
|Checkout / pagos|`commerce/order-flow.md` + `payments/proveedorpagos.md` + `tech/api-design.md`|
|Catálogo / productos|`product/product-overview.md` + `product/user-flows.md`|
|Citas|`booking/booking-rules.md` + `booking/services.md`|
|Cursos|`courses/courses-rules.md`|
|Admin|`admin/admin-permissions.md` + `tech/security-model.md`|
|Landing / UI|`ux/design-notes.md` + `ux/pages.md` + `context/brand-research.md`|

---

## Reglas críticas para la IA

- **TypeScript siempre** — no generes JavaScript
- **No hardcodees precios, textos clave ni URLs** — van en `constants/`
- **Cliente Supabase server** para Server Components y API Routes
- **Cliente Supabase client** para Client Components
- **`lib/supabase/admin.ts`** con service role key solo para operaciones admin
- **Nunca queries inline en componentes** — todas las queries van en funciones nombradas en `lib/supabase/`
- **Zod para toda validación**
- **Respuesta de API siempre consistente:**
    - Éxito: `{ data: T, error: null }`
    - Error: `{ data: null, error: { message: string, code?: string } }`
- **Todo texto visible al usuario en español**
- **Imágenes en Supabase Storage**, nunca en el repo
- **Service role key** solo en scripts de seed y `lib/supabase/admin.ts` — nunca expuesta al cliente

---

## Contexto del negocio

- 6 años como organizadora en Tampico, Tamaulipas
- Distribuye 15+ marcas profesionales
- Red de 20+ masters nacionales e internacionales
- Cursos con apartado desde $200 hasta $1,000
- Acepta 6 meses sin intereses
- WhatsApp: 833 218 3399
- Sin reembolsos — solo cambios de producto
- CFDI: el sistema registra la solicitud, contadora de Liz aplica el %

---

## Bloqueadores activos (pendiente de Liz)

| Insumo                                        | Impacto                              |
| --------------------------------------------- | ------------------------------------ |
| Credenciales MercadoPago producción           | Sin esto no hay checkout real        |
| Base de datos de productos real               | Visita acordada al negocio — agendar |
| Lista de servicios (nombre, precio, duración) | Bloquea módulo de citas              |
| Lista de cursos activos                       | Bloquea módulo de cursos             |
| % CFDI con contadora                          | Bloquea flujo de facturación         |