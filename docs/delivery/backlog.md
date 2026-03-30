# Backlog — Liz Cabriales

> Todo lo que falta por construir, priorizado por fase y sprint. Lo que está en "Bloqueadores" no puede avanzar sin insumos externos.

---

## 🚨 Bloqueadores activos

Cosas que Liz o terceros deben entregar para desbloquear el desarrollo:

|Insumo|Bloqueado por|Impacto|
|---|---|---|
|Credenciales de MercadoPago (producción)|Liz|Sin esto no hay checkout real|
|Base de datos de productos (precios + fotos)|~~Bloqueado~~ ✅|Se captura en visita al negocio — **agendar fecha**|
|Lista de servicios del salón (nombre, precio, duración)|Liz|Sin esto no hay módulo de citas|
|Lista de cursos activos (fechas, precio, cupo)|Liz|Sin esto no hay módulo de cursos|
|Logos de marcas en PNG/SVG|Liz|Sin esto el slider usa placeholders|
|Fotos reales del negocio y productos|Liz|Sin esto las imágenes son de picsum|
|% adicional para CFDI|Contadora de Liz|Sin esto no hay flujo de facturación|

---

## Fase 1 — Ecommerce (Sprint actual)

### Sprint 1 ← AQUÍ ESTAMOS

- [ ] Página `/checkout` — formulario de dirección y resumen de orden
- [ ] Integración MercadoPago Checkout Pro (preferencia de pago)
- [ ] Webhook MercadoPago — confirmar pago y actualizar orden
- [ ] Tabla `orders` y `order_items` en Supabase
- [ ] Lógica de creación de orden al confirmar pago
- [ ] Página `/orden/[id]` — confirmación de compra
- [ ] Email de confirmación al comprador (Resend o similar)
- [ ] Manejo de estados de orden: `pending` → `paid` → `shipped` → `delivered`

### Sprint 2

- [ ] Panel admin `/admin/orders` — lista de órdenes con filtros
- [ ] Detalle de orden — dirección, productos, estado, cliente
- [ ] Cambio manual de estado de orden en admin
- [ ] Importar base de datos de productos reales ← BLOQUEADO
- [ ] Script de migración con validación previa a importación
- [ ] Descuento automático de stock al confirmar pago
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