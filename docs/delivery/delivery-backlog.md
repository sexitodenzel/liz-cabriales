# Backlog — Liz Cabriales

> Todo lo que falta por construir, priorizado por fase y sprint. Lo que está en "Bloqueadores" no puede avanzar sin insumos externos.

---

## 🚨 Bloqueadores activos

Cosas que Liz o terceros deben entregar para desbloquear el desarrollo:

|Insumo|Bloqueado por|Impacto|
|---|---|---|
|Credenciales de MercadoPago (producción)|Liz|Sin esto no hay checkout real|
|Base de datos de productos reales (precios + fotos)|Liz / visita en sitio|Sin esto Sprint 2 de ecommerce no cierra completo|
|Lista de servicios del salón (nombre, precio, duración)|Liz|Sin esto no hay módulo de citas|
|Lista de cursos activos (fechas, precio, cupo)|Liz|Sin esto no hay módulo de cursos|
|Logos de marcas en PNG/SVG|Liz|Sin esto el slider usa placeholders|
|Fotos reales del negocio y productos|Liz|Sin esto las imágenes son de picsum|
|% adicional para CFDI|Contadora de Liz|Sin esto no hay flujo de facturación|

## ⚠️ Bloqueadores técnicos inmediatos

| Bloqueo técnico                                  | Responsable       | Impacto                                                      |
| ------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| No hay transacción SQL real en creación de orden | Equipo desarrollo | Riesgo controlado; no bloquea Sprint 1 pero sí pagos/webhook |
| Typecheck/lint global con errores fuera de scope | Equipo desarrollo | Reduce confianza de validación global del repo               |
|                                                  |                   |                                                              |


## ⚠️ Pendientes de testing — requieren deploy

| Pendiente | Contexto |
|---|---|
| Configurar webhook en dashboard de MercadoPago con URL real del deploy | `MERCADOPAGO_WEBHOOK_SECRET` actual es placeholder |
| Actualizar `NEXT_PUBLIC_APP_URL` con dominio real de Vercel | Afecta `notification_url` del checkout |
| Probar flujo end-to-end en sandbox con tarjeta de prueba MP | Requiere servidor público — ngrok o Vercel preview |
| Credenciales de producción de Liz — cambiar `MERCADOPAGO_ACCESS_TOKEN` | Bloqueado por Liz |
| Limpiar carrito post-pago confirmado desde el webhook | Sprint 2 |
| Idempotencia del email — MP puede reintentar webhook y mandar el email dos veces | Solución: campo `email_sent` en tabla `payments` — Sprint 2 |
| Verificar dominio remitente en Resend cuando Liz tenga dominio propio | Cambiar `from` de `onboarding@resend.dev` a `pedidos@[dominio].com` |
---

## Fase 1 — Ecommerce (Sprint actual)

### Sprint 1 ← AQUÍ ESTAMOS

- [x] Tabla `orders` y `order_items` en Supabase — verificadas en schema real
- [x] API Route `POST /api/orders` — crear orden `pending` desde carrito activo
- [x] Corregir drift del módulo carrito contra el schema real
- [x] Página `/checkout` — formulario de dirección y resumen de orden
- [x] Integración MercadoPago Checkout Pro (preferencia de pago)
- [x] Webhook MercadoPago — confirmar pago y actualizar orden
- [x] Página `/orden/[id]` — confirmación de compra
- [x] Página `/orden/[id]/error` — manejo de pago fallido o cancelado
- [ ] Email de confirmación al comprador (Resend o similar)
- [ ] Manejo de estados de orden: `pending` → `paid` → `shipped` → `delivered`

> Orden recomendado ahora:
> 1. corregir drift del carrito
> 2. conectar `/checkout` con `POST /api/orders`
> 3. luego integrar MercadoPago

### Sprint 2

- [ ] Panel admin `/admin/orders` — lista de órdenes con filtros
- [ ] Detalle de orden — dirección, productos, estado, cliente
- [ ] Cambio manual de estado de orden en admin
- [ ] Importar base de datos de productos reales ← BLOQUEADO
- [ ] Script de migración con validación previa a importación
- [x] Descuento automático de stock al confirmar pago
- [ ] Alerta de stock bajo en panel admin
- [ ] Sincronización de inventario — ventas locales actualizan el mismo stock

---

## Fase 2 — Operación del salón

### Sprint 3 — Citas

- [ ] Tablas `services`, `staff`, `appointments` en Supabase
- [ ] Página `/citas` — seleccionar servicio, estilista, fecha y hora
- [ ] Bloqueo de horarios ya reservados
- [ ] Panel recepcionista — agendar cita manualmente para cliente presencial
- [ ] Vista de agenda del día/semana en admin
- [ ] Notificación de confirmación de cita (WhatsApp o email)
- [ ] Recordatorio automático 24h antes

### Sprint 4 — Cursos

- [ ] Tablas `courses`, `enrollments` en Supabase
- [ ] Página `/cursos` — listado y detalle de cada curso
- [ ] Sistema de apartado — pago mínimo para reservar lugar
- [ ] Pago del resto antes del curso
- [ ] Control de cupo — cerrar inscripción al llenarse
- [ ] Panel admin — crear/editar cursos y ver inscritos
- [ ] Lista de asistencia en admin

### Sprint 5 — Admin multi-rol y cierre

- [ ] Tabla `admin_roles` con permisos granulares
- [ ] Rol recepcionista — acceso solo a: citas, agenda, clientes
- [ ] Rol admin completo — acceso total
- [ ] Flujo CFDI — checkbox en checkout, % adicional, registro en orden
- [ ] QA general en dispositivos móviles
- [ ] Pruebas de flujo completo con Liz (UAT)
- [ ] Deploy final a producción
- [ ] Capacitación a Liz y recepcionista

---

## Fase 3 — Crecimiento (TBD)

- [ ] Definir alcance y precio de retainer mensual
- [ ] Estrategia de campañas Google Ads + Meta Ads
- [ ] Flujo de creación de anuncios con IA
- [ ] Dashboard de resultados de campañas
- [ ] Integración con píxel de Meta y Google Tag Manager

---

## Mejoras futuras (no comprometidas)

- Google OAuth (login con Google)
- Programa de referidos
- Página de inspiración con galería real
- Reviews y calificaciones de productos
- App móvil nativa
- Integración con sistema contable externo