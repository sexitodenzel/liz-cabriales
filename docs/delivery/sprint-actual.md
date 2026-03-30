# Sprint Actual — Sprint 1

> Este archivo dice exactamente qué estás construyendo HOY. Léelo al iniciar cada sesión de trabajo. Actualízalo al terminar cada sesión con el estado real.

---

## Sprint 1 — Checkout con MercadoPago

**Objetivo concreto:** Un cliente puede agregar productos al carrito, ir al checkout, pagar con tarjeta/OXXO/SPEI vía MercadoPago, y recibir confirmación de su compra.

**Inicio:** 29 marzo 2026 **Fin:** 11 abril 2026 **Sprint review con Liz:** ~12 abril 2026

---

## Scope — qué SÍ entra en este sprint

```
[ ] Página /checkout — dirección de envío + resumen de orden
[ ] API Route POST /api/orders — crear orden en Supabase
[ ] API Route POST /api/payments/mercadopago — crear preferencia de pago
[ ] Webhook POST /api/webhooks/mercadopago — confirmar pago y actualizar orden
[ ] Página /orden/[id] — confirmación de compra exitosa
[ ] Página /orden/[id]/error — manejo de pago fallido o cancelado
[ ] Email de confirmación al comprador (Resend)
[ ] Tablas en Supabase: orders, order_items (si no existen)
[ ] Estados de orden: pending → paid → shipped → delivered
```

## Scope — qué NO entra en este sprint

```
✗ Panel admin de órdenes (Sprint 2)
✗ Importar productos reales de Liz (Sprint 2, visita acordada)
✗ Sincronización de inventario (Sprint 2)
✗ Módulo de citas (Fase 2)
✗ Módulo de cursos (Fase 2)
```

> Si algo no está en el scope de arriba → va al backlog, no se construye ahora.

---

## Estado de tareas

|Tarea|Estado|Notas|
|---|---|---|
|Página /checkout|⏳ Pendiente||
|POST /api/orders|⏳ Pendiente||
|POST /api/payments/mercadopago|⏳ Pendiente|Bloqueado hasta tener credenciales|
|Webhook MercadoPago|⏳ Pendiente||
|Página /orden/[id]|⏳ Pendiente||
|Página /orden/[id]/error|⏳ Pendiente||
|Email de confirmación|⏳ Pendiente|Definir si usamos Resend|
|Tablas orders + order_items|⏳ Pendiente|Revisar si ya existen en schema|

---

## Bloqueadores de este sprint

|Bloqueador|Responsable|Estado|
|---|---|---|
|Credenciales MercadoPago (producción)|Liz|⚠️ Pendiente solicitar|
|Definir proveedor de email (Resend?)|Denzel|⏳ Decidir|

> Mientras no llegan las credenciales de producción, trabajar con credenciales sandbox de MercadoPago.

---

## Orden recomendado de construcción

Esto importa — construir en este orden evita retrabajos:

```
1. Verificar/crear tablas orders y order_items en Supabase
   ↓
2. POST /api/orders — lógica de crear orden (sin pago aún)
   ↓
3. Página /checkout — UI + conectar con /api/orders
   ↓
4. POST /api/payments/mercadopago — generar preferencia de pago
   ↓
5. Conectar checkout con MercadoPago (redirigir a pago)
   ↓
6. Webhook /api/webhooks/mercadopago — confirmar pago
   ↓
7. Página /orden/[id] — mostrar confirmación
   ↓
8. Página /orden/[id]/error — manejar fallo
   ↓
9. Email de confirmación
```

---

## Archivos a crear en este sprint

```
app/
├── checkout/
│   └── page.tsx
├── orden/
│   └── [id]/
│       ├── page.tsx
│       └── error/page.tsx
└── api/
    ├── orders/
    │   └── route.ts
    ├── payments/
    │   └── mercadopago/
    │       └── route.ts
    └── webhooks/
        └── mercadopago/
            └── route.ts

lib/
└── supabase/
    └── orders.ts    ← queries de órdenes
```

---

## .md que necesita Cursor para este sprint

Pegar siempre en el prompt de Cursor:

- `tech/database-schema.md`
- `commerce/order-flow.md`
- `payments/proveedorpagos.md`
- `tech/dev-rules.md`
- `tech/api-design.md` (cuando esté listo)

---

## Notas de sesiones

### 29 marzo 2026

- Sprint 1 definido y documentado
- Vault reorganizado — carpeta delivery/ creada
- claude-prompt.md y ai-context.md actualizados
- Pendiente: pegar tech/database-schema.md para generar api-design.md y security-model.md
- Pendiente: solicitar credenciales sandbox de MercadoPago a Liz o crearlas en cuenta propia para desarrollo