# Sprint Actual — Sprint 2

> Este archivo dice exactamente qué estás construyendo HOY. Léelo al iniciar cada sesión de trabajo. Actualízalo al terminar cada sesión con el estado real.

---

## Sprint 2 — Panel admin de órdenes + deuda técnica

**Objetivo concreto:** El admin puede ver todas las órdenes paginadas, cambiar su estado manualmente, y el flujo de pago es atómico e idempotente.

**Inicio:** 9 abril 2026  
**Fin estimado:** 25 abril 2026  
**Sprint review con Liz:** semana del 14 abril 2026

---

## Scope — qué SÍ entra en este sprint

- [x] Transacción atómica — función `create_order_atomic` en PostgreSQL vía `rpc()`
- [x] Idempotencia del webhook — columna `email_sent` en tabla `payments`
- [x] Limpiar `cart_items` tras pago confirmado — bloque `approved` del webhook
- [x] Panel admin `/admin/orders` — lista paginada con filtros y badges por estado
- [x] Detalle `/admin/orders/[id]` — cliente, ítems, cambio manual de estado
- [x] `GET /api/admin/orders` — page + limit + status + count:exact
- [x] `PATCH /api/admin/orders/[id]/status` — solo shipped / delivered / cancelled
- [x] Alerta de stock bajo en panel admin
- [ ] Importar base de datos de productos reales ← BLOQUEADO por visita a Liz
- [ ] Script de migración con validación previa a importación

## Scope — qué NO entra en este sprint

✗ Módulo de citas (Fase 2)  
✗ Módulo de cursos (Fase 2)  
✗ Admin multi-rol / recepcionista (Fase 2)  
✗ Shadcn/ui completo — las pantallas usan tabla HTML + Tailwind (consistente con admin/products)

---

## ⚠️ Pendientes operativos — ejecutar antes de QA

| Acción                                                                                                                                    | Responsable | Estado         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| Ejecutar `ALTER TABLE payments ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false` en Supabase SQL Editor                               | Denzel      | ✅ Ejecutado \| |
| Ejecutar `CREATE OR REPLACE FUNCTION create_order_atomic(...)` en Supabase SQL Editor — cuerpo en `app/api/webhooks/mercadopago/route.ts` | Denzel      | ✅ Ejecutado    |
| Agregar enlace a `/admin/orders` desde dashboard `/admin`                                                                                 | Denzel      | ⏳ Pendiente    |

---

## Estado de tareas

| Tarea | Estado | Notas |
|---|---|---|
| `create_order_atomic` PostgreSQL + rpc() | ✅ Hecho | `lib/supabase/orders.ts` — requiere SQL en Supabase |
| `email_sent` en tabla payments | ✅ Hecho | `lib/supabase/payments.ts` — requiere ALTER TABLE en Supabase |
| Limpiar carrito tras pago aprobado | ✅ Hecho | `clearCartForUser` — bloque approved del webhook |
| Panel admin `/admin/orders` | ✅ Hecho | Tabla paginada, filtros, badges, fila clicable |
| Detalle `/admin/orders/[id]` | ✅ Hecho | Cliente, ítems, select de estado, botón guardar |
| `GET /api/admin/orders` | ✅ Hecho | page + limit + status + count:exact |
| `GET /api/admin/orders/[id]` | ✅ Hecho | Necesario para cargar detalle con cookie de sesión |
| `PATCH /api/admin/orders/[id]/status` | ✅ Hecho | Zod, role admin, solo shipped/delivered/cancelled |
| Alerta de stock bajo en panel admin | ⏳ Pendiente | Siguiente frente |
| Importar productos reales | 🔴 Bloqueado | Esperando visita a Liz |
| Script de migración con validación | ⏳ Pendiente | Depende de importación |

---

## Bloqueadores de este sprint

| Bloqueador | Responsable | Estado |
|---|---|---|
| SQL sin ejecutar en Supabase (`email_sent` + `create_order_atomic`) | Denzel | ⏳ Pendiente — bloquea QA |
| Credenciales MercadoPago producción | Liz | ⚠️ Pendiente |
| Base de datos real de productos | Liz / visita | 🔴 Bloqueado |

---

## Archivos creados en este sprint

lib/ ├── supabase/ │ ├── adminOrders.ts — listado paginado, detalle admin, actualización de estado │ └── payments.ts — claimApprovedPaymentForOrder, updateOrderStatusToPaid, clearCartForUser ├── validations/ │ └── adminOrders.ts — adminOrdersQuerySchema + adminOrderStatusPatchSchema

app/ ├── admin/orders/ │ ├── page.tsx — lista paginada con filtros y badges │ └── [id]/page.tsx — detalle de orden + cambio de estado └── api/admin/orders/ ├── route.ts — GET paginado └── [id]/ ├── route.ts — GET detalle └── status/route.ts — PATCH cambio de estado

## Archivos modificados en este sprint

- `lib/supabase/orders.ts` — usa `create_order_atomic` vía rpc()
- `app/api/orders/route.ts` — comentario que enlaza con la RPC
- `app/api/webhooks/mercadopago/route.ts` — idempotencia, limpieza de carrito, SQL documentado en comentario

---

## Notas de sesiones

### 9 abril 2026
- Sprint 1 cerrado al 100% — producción estable
- Análisis de deuda técnica realizado — 8 puntos clasificados
- Backlog actualizado con deuda técnica y nuevos ítems de Sprint 2

### 9 abril 2026 (segundo bloque)
- Sprint 2 arrancado — primera tarea entregada
- `create_order_atomic`, `email_sent`, limpieza de carrito implementados
- Panel admin `/admin/orders` y detalle `/admin/orders/[id]` operativos
- Build correcto — lint falla en archivos previos fuera de scope, no en los nuevos
- Pendiente crítico: ejecutar 2 SQL en Supabase antes de QA