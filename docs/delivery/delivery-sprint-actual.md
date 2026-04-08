
```md
# Sprint Actual — Sprint 1

> Este archivo dice exactamente qué estás construyendo HOY. Léelo al iniciar cada sesión de trabajo. Actualízalo al terminar cada sesión con el estado real.

---

## Sprint 1 — Checkout con MercadoPago

**Objetivo concreto:** Un cliente puede agregar productos al carrito, ir al checkout, pagar con tarjeta/OXXO/SPEI vía MercadoPago, y recibir confirmación de su compra.

**Inicio:** 29 marzo 2026 **Fin:** 11 abril 2026 **Sprint review con Liz:** ~12 abril 2026

---

```
## Scope — qué SÍ entra en este sprint

[x] Drift corregido, página implementada, conectada a `POST /api/orders`, CTA placeholder para MP
[x] API Route POST /api/orders — crear orden en Supabase  
[ ] API Route POST /api/payments/mercadopago — crear preferencia de pago  
[ ] Webhook POST /api/webhooks/mercadopago — confirmar pago y actualizar orden  
[ ] Página /orden/[id] — confirmación de compra exitosa  
[ ] Página /orden/[id]/error — manejo de pago fallido o cancelado  
[ ] Email de confirmación al comprador (Resend)  
[x] Tablas en Supabase: orders, order_items (verificadas en schema real)  
[ ] Estados de orden: pending → paid → shipped → delivered

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

| Tarea                          | Estado       | Notas                                                                                             |
| ------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| Página /checkout               | ⏳ Pendiente  | Siguiente frente de trabajo; conectar con `POST /api/orders`                                      |
| POST /api/orders               | ✅ Hecho      | Auth, Zod, `CART_EMPTY`, `OUT_OF_STOCK`, snapshot de `order_items.unit_price`, `status = pending` |
| POST /api/payments/mercadopago | ✅ Hecho      |                                                                                                   |
| Webhook MercadoPago            | ✅ Hecho      |                                                                                                   |
| Página /orden/[id]             | ✅ Hecho      |                                                                                                   |
| Página /orden/[id]/error       | ✅ Hecho      |                                                                                                   |
| Email de confirmación          | ⏳ Pendiente  | Definir si usamos Resend                                                                          |
| Tablas orders + order_items    | ✅ Verificado | Existen en Supabase y soportan las columnas requeridas                                            |

---

## Bloqueadores de este sprint

| Bloqueador                                | Responsable       | Estado                                         |
| ----------------------------------------- | ----------------- | ---------------------------------------------- |
| Credenciales MercadoPago (producción)     | Liz               | ⚠️ Pendiente solicitar                         |
| Definir proveedor de email (Resend?)      | Denzel            | ⏳ Decidir                                      |
| Drift del módulo carrito vs schema activo | Equipo desarrollo | ✅ Resuelto — cart_items ahora usa joins reales |

> Mientras no llegan las credenciales de producción, trabajar con credenciales sandbox de MercadoPago.

---

## Orden recomendado de construcción

Esto importa — construir en este orden evita retrabajos:

```

1. Verificar/crear tablas orders y order_items en Supabase ✅  
    ↓
    
2. POST /api/orders — lógica de crear orden (sin pago aún) ✅  
    ↓
    
3. 3. Alinear carrito con schema real + Página /checkout — UI + conectar con /api/orders ✅ 
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
│ └── page.tsx  
├── orden/  
│ └── [id]/  
│ ├── page.tsx  
│ └── error/page.tsx  
└── api/  
├── orders/  
│ └── route.ts  
├── payments/  
│ └── mercadopago/  
│ └── route.ts  
└── webhooks/  
└── mercadopago/  
└── route.ts

lib/  
└── supabase/  
└── orders.ts ← queries de órdenes

```

---

## .md que necesita Cursor para este sprint

Pegar siempre en el prompt de Cursor:

- `tech/database-schema.md`
- `commerce/order-flow.md`
- `payments/proveedorpagos.md`
- `tech/dev-rules.md`
- `tech/api-design.md`

---

## Notas de sesiones

### 29 marzo 2026

- Sprint 1 definido y documentado
- Vault reorganizado — carpeta delivery/ creada
- claude-prompt.md y ai-context.md actualizados
- Pendiente: pegar tech/database-schema.md para generar api-design.md y security-model.md
- Pendiente: solicitar credenciales sandbox de MercadoPago a Liz o crearlas en cuenta propia para desarrollo

### 7 abril 2026

- Codex cerró `POST /api/orders`
- `orders` y `order_items` verificados contra Supabase real
- La lógica reusable quedó en `lib/supabase/orders.ts`
- `POST /api/orders` valida auth, body, carrito vacío y stock
- La orden se crea en `pending` y genera snapshot en `order_items`
- No se creó `payments`, no se descontó stock y no se limpió carrito todavía
- Se detectó drift entre módulo de carrito y schema activo; corregir antes de conectar `/checkout`
- Siguiente tarea recomendada: alinear carrito con schema real y conectar `/checkout` a los helpers de órdenes

### 8 abril 2026
- Drift del módulo carrito corregido — cart_items ya usa joins reales a products y product_variants
- /api/cart alineado al schema activo
- CartContext actualizado — hidrata carrito desde /api/cart, sincroniza tras login
- /checkout implementado — resumen real del carrito, formulario shipping/pickup, submit a POST /api/orders
- Al éxito muestra order_id y CTA placeholder para siguiente paso de pago
- No se limpió carrito todavía — pendiente decidir si al crear orden o al confirmar pago
- Siguiente frente: POST /api/payments/mercadopago (bloqueado por credenciales sandbox)

### 8 abril 2026 (segundo bloque)
- POST /api/payments/mercadopago implementado — genera preferencia real en MP sandbox
- POST /api/webhooks/mercadopago implementado — verifica firma HMAC-SHA256
- Webhook actualiza orders.status y payments.status, descuenta stock al confirmar approved
- /orden/[id] y /orden/[id]/error operativas
- Checkout conectado — flujo completo: carrito → orden → MP → confirmación
- Pendiente operativo: configurar MERCADOPAGO_WEBHOOK_SECRET real en dashboard MP
- Pendiente operativo: exponer con ngrok para prueba end-to-end en sandbox
- Siguiente: Email de confirmación (Resend) — último item del Sprint 1