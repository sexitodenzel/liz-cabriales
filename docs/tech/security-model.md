# security-model.md

> Quién puede hacer qué en el sistema. Aplicar en dos capas: middleware de Next.js (rutas) + RLS de Supabase (datos). Nunca confiar solo en el frontend para controlar acceso.

---

## Roles actuales

|Rol|Descripción|Dónde se define|
|---|---|---|
|`client`|Cliente registrado — compra, agenda, se inscribe|`users.role`|
|`admin`|Acceso total al panel de administración|`users.role`|
|`receptionist`|_(Fase 2)_ Acceso limitado: citas y agenda|`users.role`|
|_guest_|Sin cuenta — puede navegar y agregar al carrito|—|

> ⚠️ `receptionist` no existe aún en la base de datos. Se agrega en Fase 2 cuando se implemente el módulo de citas. El campo `users.role` actualmente acepta `'client' | 'admin'` — extender el tipo cuando llegue Fase 2.

---

## Protección de rutas (middleware.ts)

### Rutas públicas — cualquiera puede acceder

```
/
/tienda
/tienda/[slug]
/cursos
/cursos/[slug]
/inspiracion
/api/webhooks/*        ← webhooks externos no llevan sesión
```

### Rutas privadas — requieren sesión activa

```
/perfil/*
/checkout
/orden/*
/citas/nueva
/cursos/[slug]/inscripcion
```

### Rutas admin — requieren rol 'admin'

```
/admin/*
/api/admin/*
```

### Rutas admin + recepcionista _(Fase 2)_

```
/admin/citas/*
/admin/agenda/*
/api/admin/appointments/*
```

**Lógica del middleware:**

```typescript
// Si ruta es /admin/* y role !== 'admin' → redirect /
// Si ruta es privada y no hay sesión → redirect /login
// El rol se lee desde users.role, nunca desde el JWT directamente
```

---

## RLS — Políticas por tabla

> Las políticas usan `auth.uid()` para identificar al usuario autenticado. El `supabaseAdmin` (service role) bypasea RLS — usar SOLO en `lib/supabase/admin.ts`.

### users

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Usuario mismo|`id = auth.uid()`|
|UPDATE|Usuario mismo|`id = auth.uid()`|
|SELECT (todos)|Admin|via service role|

### products, categories

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Cualquiera|`is_active = true AND deleted_at IS NULL`|
|INSERT/UPDATE/DELETE|Admin|via service role|

### product_variants

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Cualquiera|variante activa|
|INSERT/UPDATE/DELETE|Admin|via service role|

### carts, cart_items

|Operación|Permitido|Condición|
|---|---|---|
|SELECT/INSERT/UPDATE/DELETE|Usuario mismo|`cart.user_id = auth.uid()`|

### orders, order_items

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Usuario mismo|`orders.user_id = auth.uid()`|
|INSERT|Usuario autenticado|Al crear orden|
|UPDATE status|Admin|via service role|
|SELECT (todos)|Admin|via service role|

### payments

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Usuario mismo|`user_id = auth.uid()`|
|INSERT/UPDATE|Solo via webhook / service role|via service role|

### favorites

|Operación|Permitido|Condición|
|---|---|---|
|SELECT/INSERT/DELETE|Usuario mismo|`user_id = auth.uid()`|

### appointments, appointment_services

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Usuario mismo|`user_id = auth.uid()`|
|INSERT|Usuario autenticado|—|
|UPDATE/DELETE|Admin o recepcionista|via service role|
|SELECT (todos)|Admin/recepcionista|via service role|

### courses, instructors

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Cualquiera|`is_published = true`|
|INSERT/UPDATE/DELETE|Admin|via service role|

### course_registrations

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Usuario mismo|`user_id = auth.uid()`|
|INSERT|Usuario autenticado|—|
|UPDATE/DELETE|Admin|via service role|

### services, professionals, blocked_slots

|Operación|Permitido|Condición|
|---|---|---|
|SELECT|Cualquiera|activos|
|INSERT/UPDATE/DELETE|Admin/recepcionista|via service role|

---

## Uso correcto de clientes Supabase

```typescript
// ✅ Server Component o API Route — lectura con contexto del usuario
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
const { data } = await supabase.from('orders').select('*')
// RLS aplica — el usuario solo ve SUS órdenes

// ✅ Operación admin — bypasea RLS
import { supabaseAdmin } from '@/lib/supabase/admin'
const { data } = await supabaseAdmin.from('orders').select('*')
// Sin RLS — ve todas las órdenes

// ❌ Nunca usar supabaseAdmin en Client Components
// ❌ Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente
```

---

## Reglas de seguridad para webhooks

Los webhooks (ej. MercadoPago) llegan sin sesión de usuario. Reglas:

1. **Siempre verificar la firma** del webhook antes de procesar
2. **Usar `supabaseAdmin`** para las actualizaciones del webhook (necesita bypassear RLS)
3. **Nunca confiar en el body sin validar** — validar con Zod
4. **Retornar 200 siempre** aunque haya error interno (para evitar reintentos infinitos de MercadoPago) — loggear el error internamente

```typescript
// Verificación de firma MercadoPago
const signature = request.headers.get('x-signature')
const requestId = request.headers.get('x-request-id')
// validar con MERCADOPAGO_WEBHOOK_SECRET
```

---

## Checklist de seguridad por endpoint

Antes de marcar un endpoint como listo, verificar:

```
[ ] Valida input con Zod
[ ] Verifica autenticación si la ruta lo requiere
[ ] Verifica rol si es ruta de admin
[ ] No expone datos de otros usuarios
[ ] Usa supabaseAdmin solo cuando es necesario (escrituras admin)
[ ] Maneja errores sin exponer stack traces al cliente
[ ] Variables de entorno en .env.local, no hardcodeadas
```

---

## Evolución de roles — Fase 2

Cuando se implemente `receptionist`:

1. Agregar `'receptionist'` al tipo `UserRole` en `types/index.ts`
2. Actualizar constraint en `users.role` en Supabase
3. Actualizar middleware para permitir acceso a `/admin/citas/*` con rol receptionist
4. Agregar políticas RLS específicas donde aplique
5. Documentar aquí los cambios