# Sprint 1 — Cerrado ✅

**Objetivo:** Un cliente puede agregar productos al carrito, ir al checkout, pagar con tarjeta/OXXO/SPEI vía MercadoPago, y recibir confirmación de su compra.

**Inicio:** 29 marzo 2026  
**Cierre:** 9 abril 2026  
**Semáforo final:** Verde

---

## Entregables completados

- [x] Tablas `orders` y `order_items` verificadas en Supabase
- [x] `POST /api/orders` — Auth, Zod, CART_EMPTY, OUT_OF_STOCK, snapshot de unit_price, status = pending
- [x] Drift del módulo carrito corregido — cart_items usa joins reales a products y product_variants
- [x] `/api/cart` alineado al schema activo
- [x] CartContext actualizado — hidrata desde /api/cart, sincroniza tras login
- [x] Página `/checkout` — formulario shipping/pickup, resumen real del carrito
- [x] `POST /api/payments/mercadopago` — genera preferencia real en MP sandbox
- [x] `POST /api/webhooks/mercadopago` — verifica firma HMAC-SHA256, actualiza orden y payments, descuenta stock
- [x] Página `/orden/[id]` — confirmación de compra exitosa
- [x] Página `/orden/[id]/error` — manejo de pago fallido o cancelado
- [x] Email de confirmación con Resend — template HTML con productos, total, tipo de entrega, enlace WhatsApp
- [x] MERCADOPAGO_WEBHOOK_SECRET real configurado en Vercel
- [x] Bug crítico resuelto — NEXT_PUBLIC_SUPABASE_URL corregido (.com → .co)
- [x] force-dynamic en /tienda — resuelve caché de Vercel
- [x] Políticas RLS creadas para todas las tablas del proyecto
- [x] Flujo checkout → MP sandbox verificado hasta redirect de pago

---

## Archivos creados

- `app/checkout/page.tsx`
- `app/orden/[id]/page.tsx`
- `app/orden/[id]/error/page.tsx`
- `app/api/orders/route.ts`
- `app/api/payments/mercadopago/route.ts`
- `app/api/webhooks/mercadopago/route.ts`
- `lib/supabase/orders.ts`
- `lib/email/resend.ts`
- `lib/email/templates/order-confirmation.ts`

---

## Decisiones técnicas tomadas en este sprint

- Resend como proveedor de email transaccional — `onboarding@resend.dev` en sandbox, cambiar cuando Liz tenga dominio
- Carrito se limpia al confirmar pago (webhook approved), no al crear la orden
- Build corregido para Next.js 16 — params como Promise en route handlers dinámicos
- 7 variables de entorno configuradas en Vercel

---

## Bloqueadores que quedaron vigentes al cerrar

- Credenciales MercadoPago producción — pendiente de Liz
- Prueba end-to-end con pago real — requiere credenciales de Liz
- Base de datos real de productos — visita acordada al negocio

---

## Notas de sesiones

### 29 marzo 2026
- Sprint definido y documentado, vault reorganizado

### 7 abril 2026
- `POST /api/orders` cerrado, drift de carrito detectado

### 8 abril 2026
- Drift corregido, checkout implementado, MercadoPago integrado, webhook operativo, email con Resend

### 9 abril 2026
- MERCADOPAGO_WEBHOOK_SECRET configurado, bug de Supabase URL resuelto, RLS completas, sprint cerrado