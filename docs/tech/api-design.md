# api-design.md

> Contratos de todos los endpoints del sistema. Antes de crear cualquier API Route, verificar que no exista aquí. Al crear un endpoint nuevo, documentarlo aquí.

---

## Convenciones globales

- Base: `/api/`
- Método en el nombre de la función handler: `GET`, `POST`, `PATCH`, `DELETE`
- Autenticación: header de sesión de Supabase (manejado por middleware)
- Validación: Zod antes de cualquier lógica
- Respuesta siempre:
    
    ```typescript
    // éxito{ data: T, error: null }// error{ data: null, error: { message: string, code?: string } }
    ```
    
- Códigos de error propios: `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`, `PAYMENT_ERROR`, `OUT_OF_STOCK`

---

## Módulo: Órdenes

### `POST /api/orders`

Crea una orden nueva a partir del carrito activo del usuario.

**Auth requerida:** Sí (cliente autenticado)

**Body (Zod):**

```typescript
{
  delivery_type: 'shipping' | 'pickup',
  shipping_address?: string,   // requerido si delivery_type = 'shipping'
  shipping_state?: string,
  shipping_city?: string,
}
```

**Lógica:**

1. Obtener carrito activo del usuario con sus items
2. Validar que todos los `product_variants` tienen stock suficiente
3. Calcular total (sum de quantity × unit_price) + shipping_cost
4. Crear registro en `orders` con status `'pending'`
5. Crear registros en `order_items` con `unit_price` snapshot
6. Retornar `order.id` para continuar al pago

**Respuesta exitosa:**

```typescript
{ data: { order_id: string, total: number }, error: null }
```

**Errores posibles:**

- `OUT_OF_STOCK` — algún producto ya no tiene stock
- `CART_EMPTY` — el carrito está vacío
- `VALIDATION_ERROR` — dirección faltante en envío

---

### `GET /api/orders`

Lista las órdenes del usuario autenticado.

**Auth requerida:** Sí

**Query params:**

```
status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
```

**Respuesta:**

```typescript
{ data: Order[], error: null }
```

---

### `GET /api/orders/[id]`

Detalle de una orden. El cliente solo puede ver sus propias órdenes.

**Auth requerida:** Sí

**Respuesta:**

```typescript
{
  data: {
    order: Order,
    items: OrderItem[],
    payment: Payment | null
  },
  error: null
}
```

---

### `PATCH /api/orders/[id]/status` _(solo admin)_

Actualiza el estado de una orden.

**Auth requerida:** Sí, rol admin

**Body:**

```typescript
{ status: 'shipped' | 'delivered' | 'cancelled' }
```

---

## Módulo: Pagos (MercadoPago)

### `POST /api/payments/mercadopago`

Genera una preferencia de pago en MercadoPago y retorna la URL de pago.

**Auth requerida:** Sí

**Body:**

```typescript
{ order_id: string }
```

**Lógica:**

1. Verificar que la orden existe, pertenece al usuario y está en `'pending'`
2. Construir preference con items, payer, back_urls y notification_url
3. Llamar a MercadoPago SDK → crear preferencia
4. Crear registro en `payments` con status `'pending'` y `provider_ref` = preference id
5. Retornar `init_point` (URL de pago de MercadoPago)

**Respuesta exitosa:**

```typescript
{ data: { payment_url: string, payment_id: string }, error: null }
```

**Back URLs de MercadoPago:**

```
success → /orden/[id]?status=success
failure → /orden/[id]/error?status=failure
pending → /orden/[id]?status=pending
```

---

### `POST /api/webhooks/mercadopago`

Recibe notificaciones de MercadoPago sobre cambios en el pago.

**Auth requerida:** No (es un webhook externo) **Seguridad:** Verificar header `x-signature` de MercadoPago

**Lógica:**

1. Validar firma del webhook
2. Obtener el pago por `provider_ref` desde MercadoPago API
3. Según el status recibido:
    - `approved` → actualizar `payments.status = 'approved'`, `orders.status = 'paid'`, descontar stock
    - `rejected` → actualizar `payments.status = 'rejected'`, `orders.status = 'cancelled'`
    - `pending` → sin cambios, esperar siguiente notificación
4. Retornar `200 OK` siempre (MercadoPago reintenta si no recibe 200)

**Descuento de stock al confirmar pago:**

- Para cada `order_item`: `UPDATE product_variants SET stock = stock - quantity WHERE id = variant_id`
- Si algún stock queda negativo → loggear alerta (no revertir el pago)

---

## Módulo: Carrito

### `GET /api/cart`

Obtiene el carrito activo del usuario con sus items.

**Auth requerida:** Sí

**Respuesta:**

```typescript
{
  data: {
    cart_id: string,
    items: CartItemWithProduct[],
    total: number
  },
  error: null
}
```

---

### `POST /api/cart/items`

Agrega un item al carrito o incrementa cantidad si ya existe.

**Auth requerida:** Sí

**Body:**

```typescript
{ variant_id: string, quantity: number }
```

---

### `PATCH /api/cart/items/[id]`

Actualiza la cantidad de un item del carrito.

**Body:** `{ quantity: number }` (0 = eliminar)

---

### `DELETE /api/cart/items/[id]`

Elimina un item del carrito.

---

### `POST /api/cart/merge`

Fusiona el carrito de guest (localStorage) con el carrito del usuario al hacer login.

**Auth requerida:** Sí

**Body:**

```typescript
{
  items: Array<{ variant_id: string, quantity: number }>
}
```

---

## Módulo: Productos _(admin)_

### `GET /api/admin/products`

Lista todos los productos incluyendo eliminados (soft delete).

**Auth requerida:** Sí, rol admin

### `POST /api/admin/products`

Crea un producto nuevo con sus variantes.

### `PATCH /api/admin/products/[id]`

Actualiza datos de un producto.

### `DELETE /api/admin/products/[id]`

Soft delete — setea `deleted_at = now()`.

---

## Módulo: Citas _(Fase 2)_

Pendiente de definición. Tablas: `appointments`, `appointment_services`, `blocked_slots`, `professionals`.

Endpoints previstos:

- `GET /api/availability?date=&professional_id=` — slots disponibles
- `POST /api/appointments` — crear cita
- `PATCH /api/appointments/[id]/status`
- `GET /api/admin/appointments?date=` — agenda del día (admin/recepcionista)

---

## Módulo: Cursos _(Fase 2)_

Pendiente de definición. Tablas: `courses`, `course_registrations`, `instructors`.

Endpoints previstos:

- `GET /api/courses` — listado público
- `POST /api/course-registrations` — inscribirse con apartado
- `GET /api/admin/courses` — gestión de cursos

---

## Módulo: Autenticación

Manejado directamente por Supabase Auth. No hay API Routes propias para login/registro — se usa el SDK de Supabase en el cliente.

El middleware de Next.js (`proxy.ts`) protege las rutas según el rol del usuario.

---

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      ← nunca exponer al cliente

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=       ← token de producción o sandbox
MERCADOPAGO_WEBHOOK_SECRET=     ← para verificar firma del webhook

# App
NEXT_PUBLIC_APP_URL=            ← usado en back_urls del checkout
```