# Backlog — Liz Cabriales

> Todo lo que falta por construir, priorizado por fase y sprint. Lo que está en "Bloqueadores" no puede avanzar sin insumos externos.

---

## 🚨 Bloqueadores activos

Cosas que Liz o terceros deben entregar para desbloquear el desarrollo:

| Insumo                                                  | Bloqueado por         | Impacto                                           |
| ------------------------------------------------------- | --------------------- | ------------------------------------------------- |
| Credenciales de MercadoPago (producción)                | Liz                   | Sin esto no hay checkout real con dinero real     |
| Base de datos de productos reales (precios + fotos)     | Liz / visita en sitio | Sin esto Sprint 2 de ecommerce no cierra completo |
| Lista de servicios del salón (nombre, precio, duración) | Liz                   | Sin esto no hay módulo de citas                   |
| Lista de cursos activos (fechas, precio, cupo)          | Liz                   | Sin esto no hay módulo de cursos                  |
| Logos de marcas en PNG/SVG                              | Liz                   | Sin esto el slider usa placeholders               |
| Fotos reales del negocio y productos                    | Liz                   | Sin esto las imágenes son de picsum               |
| % adicional para CFDI                                   | Contadora de Liz      | Sin esto no hay flujo de facturación              |
|                                                         |                       |                                                   |

---

## ⚠️ Bloqueadores técnicos

| Bloqueo técnico                                  | Responsable       | Impacto                                        |
| ------------------------------------------------ | ----------------- | ---------------------------------------------- |
| No hay transacción SQL real en creación de orden | Equipo desarrollo | ✅ Resuelto — `create_order_atomic` Sprint 2 \| |
| Typecheck/lint global con errores fuera de scope | Equipo desarrollo | Reduce confianza de validación global del repo |
|                                                  |                   |                                                |

---

## ⚠️ Pendientes de testing — requieren credenciales de producción

| Pendiente | Contexto |
|---|---|
| ✅ Configurar webhook MP con URL real | Resuelto — MERCADOPAGO_WEBHOOK_SECRET configurado |
| ✅ NEXT_PUBLIC_APP_URL actualizado | Resuelto |
| ✅ Webhook responde 200 con firma válida | Verificado con simulación MP |
| Probar flujo end-to-end con pago real aprobado | Bloqueado por credenciales producción de Liz |
| Limpiar carrito post-pago confirmado desde webhook | Sprint 2 |
| Idempotencia del email — MP puede reintentar webhook y mandar el email dos veces | Solución: campo `email_sent` en tabla `payments` — Sprint 2 |
| Verificar dominio remitente en Resend cuando Liz tenga dominio propio | Cambiar `from` de `onboarding@resend.dev` a `pedidos@[dominio].com` |

---

## ⚠️ Mejoras de UX detectadas en producción — pre-launch

| Mejora | Prioridad |
|---|---|
| Email de Supabase Auth feo y con límite de envíos — configurar Resend como SMTP de Auth | Alta |
| Google OAuth como opción de login/registro | Media |
| Checkout — validaciones de dirección, autocomplete con CP, combos estado/ciudad | Alta |
| Pantallas de login/registro — validaciones y UX mejorada | Media |
| Dirección con búsqueda en mapa o autocompletado | Baja |

---

## Fase 1 — Ecommerce

### Sprint 1 ✅ CERRADO — 9 abril 2026

- [x] Tabla `orders` y `order_items` en Supabase — verificadas en schema real
- [x] API Route `POST /api/orders` — crear orden `pending` desde carrito activo
- [x] Corregir drift del módulo carrito contra el schema real
- [x] Página `/checkout` — formulario de dirección y resumen de orden
- [x] Integración MercadoPago Checkout Pro (preferencia de pago)
- [x] Webhook MercadoPago — confirmar pago y actualizar orden
- [x] Página `/orden/[id]` — confirmación de compra
- [x] Página `/orden/[id]/error` — manejo de pago fallido o cancelado
- [x] Email de confirmación al comprador (Resend)
- [x] MERCADOPAGO_WEBHOOK_SECRET real configurado en Vercel
- [x] Bug producción resuelto — NEXT_PUBLIC_SUPABASE_URL corregido (.com → .co)
- [x] Políticas RLS creadas para todas las tablas del proyecto
- [x] force-dynamic en /tienda — resuelve caché de Vercel

### Sprint 2 ← SIGUIENTE

- [x] Panel admin `/admin/orders` — lista de órdenes con filtros
- [x] Detalle de orden — dirección, productos, estado, cliente
- [x] Cambio manual de estado de orden en admin (pending → shipped → delivered)
- [ ] Importar base de datos de productos reales ← BLOQUEADO por visita a Liz
- [ ] Script de migración con validación previa a importación
- [x] Descuento automático de stock al confirmar pago
- [ ] Alerta de stock bajo en panel admin
- [ ] Limpiar carrito después de pago confirmado
- [ ] Idempotencia del email — campo `email_sent` en tabla `payments`
- [x] Transacción atómica en creación de orden — función `create_order_atomic` en PostgreSQL vía `rpc()`
- [x] Paginación en `GET /api/admin/orders` — `page`, `limit`, `count: 'exact'` desde el primer commit
- [x] Idempotencia del webhook — columna `email_sent` en tabla `payments` antes de enviar email y descontar stock
- [x] Limpiar `cart_items` tras pago confirmado — bloque `approved` del webhook

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

- Programa de referidos
- Página de inspiración con galería real
- Reviews y calificaciones de productos
- App móvil nativa
- Integración con sistema contable externo

---

## 🔜 Deuda técnica — backlog

| Ítem                                                                                                                            | Prioridad | Cuándo activar                         |
| ------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------- |
| Trigger OAuth — adaptar trigger `public.users` para separar `full_name` de Google en `first_name` / `last_name`                 | Media     | Antes de activar Google OAuth          |
| Carritos vencidos — job `pg_cron` diario que elimina `cart_items` y `carts` donde `expires_at < now()`                          | Baja      | Antes del launch                       |
| Onboarding Liz — crear `docs/delivery/onboarding-liz.md` con qué hacer si Vercel cae, variables de entorno, contacto de soporte | Media     | Antes de entrega Fase 1                |
| Filtros de stock bajo — mover filtros `deleted_at` / `is_active` de código a query PostgREST en `getLowStockVariants()`         | Baja      | Cuando haya productos reales cargados  |

---
## Pendientes para reunión con Liz

### Insumos que necesitamos de Liz

- [ ] Credenciales MercadoPago producción (Access Token + Public Key)
- [ ] Base de datos de productos — visita acordada al negocio
- [ ] Fotos reales del negocio, productos y cursos
- [ ] Logos de marcas en PNG/SVG
- [ ] Lista de servicios del salón con precio y duración
- [ ] Lista de cursos activos con fechas, precio y cupo
- [ ] % adicional para CFDI con su contadora
- [ ] Elección de dominio definitivo

### Costos recurrentes que Liz debe cubrir

| Concepto | Costo estimado | Frecuencia |
|---|---|---|
| Dominio | ~$200-400 MXN | Anual |
| Vercel Pro (si aplica al crecer) | ~$400 MXN | Mensual |
| Supabase (si supera plan gratuito) | ~$300 MXN | Mensual |
| Resend (plan gratuito cubre inicio) | $0 por ahora | — |
| MercadoPago comisiones | ~3.49% + IVA por transacción | Por venta |

### Agenda sugerida para reunión semanal

1. Review del sprint anterior — demo de lo construido
2. Validación de Liz — aprobación o feedback
3. Entrega de insumos pendientes
4. Definición del siguiente sprint
5. Resolución de dudas operativas