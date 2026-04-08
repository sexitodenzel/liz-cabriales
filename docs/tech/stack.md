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
- **Por definir** — Resend recomendado

### Deployment
- **Por definir** — Vercel es la opción más probable

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

### Pendientes
- [ ] Definir deployment final (`Vercel` u otro)
- [ ] Definir proveedor de emails transaccionales (`Resend` u otro)
- [ ] Confirmar si Google OAuth entra en la siguiente fase o se mantiene pendiente

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