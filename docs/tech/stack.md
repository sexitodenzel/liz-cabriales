# stack.md

## Stack actual del proyecto

### Frontend
- **Next.js 14** — framework principal
- **React** — base del frontend (incluido en Next.js)
- **App Router** — arquitectura de rutas activa

### Backend
- **API Routes de Next.js** — backend dentro del mismo proyecto
- **No hay servidor Node separado**

### Base de datos y servicios
- **Supabase** — PostgreSQL, Auth, Storage y RLS
- **Supabase SDK directo** — no ORM

### Lenguaje
- **TypeScript** — obligatorio en todo el proyecto

### Estilos y UI
- **Tailwind CSS** — estilos
- **Shadcn/ui** — componentes base

### Autenticación
- **Supabase Auth** — manejo de sesiones y usuarios
- **Google OAuth** — pendiente implementar

### Pagos
- **MercadoPago** — proveedor oficial del proyecto  
- Ver archivo canónico: `payments/proveedorpagos.md`

### Email transaccional
* Resend — implementado para confirmación de compra * From: `onboarding@resend.dev` (sandbox) — cambiar cuando Liz tenga dominio propio

### Deployment
* Vercel — activo en producción * URL: https://liz-cabriales.vercel.app

---

## Estado de decisiones técnicas

### Ya definidas
- ✅ Next.js App Router
- ✅ TypeScript
- ✅ Supabase SDK directo
- ✅ Tailwind CSS
- ✅ Shadcn/ui
- ✅ API Routes de Next.js
- ✅ MercadoPago como proveedor de pagos
- ✅ Resend como proveedor de email transaccional
- ✅ Vercel como plataforma de deployment

### Pendientes
- [ ] Confirmar si Google OAuth entra en la siguiente fase o se mantiene pendiente

### Requisitos de DB para producción

Antes de cualquier deploy, ejecutar en Supabase SQL Editor:
- `ALTER TABLE payments ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false`
- `CREATE OR REPLACE FUNCTION create_order_atomic(...)` — cuerpo completo en `app/api/webhooks/mercadopago/route.ts`

Sin estos dos pasos el webhook falla y la creación de órdenes lanza error.


---

## Impacto en el desarrollo

Estas decisiones ya no deben reabrirse en prompts ni planning:

1. **Proveedor de pagos** → usar MercadoPago
2. **Lenguaje** → usar TypeScript
3. **Acceso a datos** → usar Supabase SDK directo
4. **UI** → usar Tailwind CSS + Shadcn/ui
5. **Backend** → usar API Routes de Next.js dentro del mismo proyecto

---

## Variables de entorno esperadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=