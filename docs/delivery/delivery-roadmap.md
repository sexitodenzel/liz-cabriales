# Roadmap — Liz Cabriales

> Hoja de ruta por fases. Cada fase tiene objetivo, entregables y sprints definidos. Última actualización: marzo 2026

---

## Resumen de fases

```
FASE 1           FASE 2                  FASE 3
Ecommerce   →    Operación del salón  →  Crecimiento
[Abr 2026]       [May–Jun 2026]          [Jul 2026+]
$8,000 MXN       $8,000 MXN              Retainer mensual TBD
```

---

## Fase 1 — Ecommerce completo

**Objetivo:** Que Liz pueda recibir pedidos de productos en línea con pago integrado y ver el inventario actualizado.

**Fecha límite:** Fin de abril 2026 (1 mes acordado) **Precio:** $8,000 MXN (- $2,000 de anticipo = $6,000 restantes) **Cobro:** $3,000 MXN a la mitad del sprint 2 + $3,000 MXN al entregar

### Sprint 1 — semanas 1-2 (actual)

**Objetivo del sprint:** Checkout funcional con MercadoPago

|Tarea|Estado|
|---|---|
|Flujo de checkout — dirección, resumen, confirmación|⏳ Pendiente|
|Integración MercadoPago — tarjeta, OXXO, SPEI|⏳ Pendiente|
|Tabla `orders` y `order_items` en Supabase|⏳ Pendiente|
|Email de confirmación al comprador|⏳ Pendiente|
|Vista de orden confirmada `/orden/[id]`|⏳ Pendiente|

**Bloqueador activo:** Confirmar credenciales de MercadoPago con Liz

---

### Sprint 2 — semanas 3-4

**Objetivo del sprint:** Admin de órdenes + productos reales + inventario sincronizado

|Tarea|Estado|
|---|---|
|Panel admin — lista de órdenes con estado|⏳ Pendiente|
|Cambio de estado de orden (pendiente → enviado → entregado)|⏳ Pendiente|
|Importar base de datos real de productos de Liz|⏳ Bloqueado — esperando datos|
|Descuento de stock automático al confirmar orden|⏳ Pendiente|
|Alerta de stock bajo en admin|⏳ Pendiente|

**Bloqueador activo:** Recibir base de datos de productos de Liz

---

### Entregables de Fase 1

- [ ] Tienda `/tienda` con catálogo real de productos
- [ ] Carrito + checkout completo
- [ ] Pago vía MercadoPago (tarjeta, OXXO, SPEI)
- [ ] Email de confirmación de compra
- [ ] Panel admin con gestión de órdenes e inventario
- [ ] Inventario sincronizado (ventas locales y online)

---

## Fase 2 — Operación del salón

**Objetivo:** Sistema de citas + inscripción a cursos + admin multi-rol funcionando.

**Fecha estimada:** Mayo–Junio 2026 (~6 semanas) **Precio:** $8,000 MXN — cobro 50/50 al iniciar y al entregar **Estado:** 🟡 Acordado verbalmente — pendiente formalizar

### Sprint 3 — Sistema de citas

|Tarea|Estado|
|---|---|
|Tabla `appointments`, `services`, `staff` en Supabase|⏳ Pendiente|
|Página `/citas` — seleccionar servicio, fecha y hora|⏳ Pendiente|
|Panel recepcionista — agendar cita manualmente|⏳ Pendiente|
|Recordatorio automático (WhatsApp o email)|⏳ Pendiente|
|Vista de agenda del salón en admin|⏳ Pendiente|

**Bloqueador:** Recibir lista de servicios con precios y duración de Liz

---

### Sprint 4 — Módulo de cursos

|Tarea|Estado|
|---|---|
|Tabla `courses`, `enrollments` en Supabase|⏳ Pendiente|
|Página `/cursos` — listado y detalle de cada curso|⏳ Pendiente|
|Inscripción con apartado mínimo ($200–$1,000)|⏳ Pendiente|
|Panel admin — gestión de cursos y lista de inscritos|⏳ Pendiente|
|Control de cupo por curso|⏳ Pendiente|

**Bloqueador:** Recibir lista de cursos activos con fechas, precio y cupo

---

### Sprint 5 — Admin multi-rol y pulido

|Tarea|Estado|
|---|---|
|Sistema de permisos — admin completo vs recepcionista|⏳ Pendiente|
|Recepcionista solo ve: citas, clientes, agenda|⏳ Pendiente|
|Admin ve: todo + finanzas + productos + cursos|⏳ Pendiente|
|Flujo de CFDI — registro de solicitud y % adicional|⏳ Pendiente|
|QA general y corrección de bugs|⏳ Pendiente|

---

### Entregables de Fase 2

- [ ] Sistema de citas desde app y desde panel admin
- [ ] Módulo de cursos con inscripción y pago de apartado
- [ ] Admin multi-rol (admin completo + recepcionista)
- [ ] Registro de solicitud CFDI con % adicional
- [ ] Sistema estable, probado y listo para producción

---

## Fase 3 — Crecimiento con IA

**Objetivo:** Campañas de Google Ads y Meta Ads gestionadas con apoyo de IA.

**Formato:** Retainer mensual (monto a definir) **Estado:** 🔵 En conversación — no iniciada

### Qué incluiría

- Estrategia de campañas pagadas (Google + Meta)
- Copy de anuncios generado y optimizado con IA
- Reporte mensual de resultados
- Ajuste de presupuesto y segmentación
- Creación de audiencias personalizadas

**Siguiente paso:** Reunión dedicada para definir presupuesto de medios, objetivos y precio del retainer.

---

## Reuniones programadas

|Fecha|Tipo|Estado|
|---|---|---|
|16 mar 2026|Reunión inicial — definición de alcance|✅ Realizada|
|TBD|Sprint review — Fase 1, Sprint 1|⏳ Agendar|
|TBD|Sprint review — Fase 1, Sprint 2 + entrega Fase 1|⏳ Agendar|
|TBD|Kickoff Fase 2|⏳ Agendar|

---

## Señales de riesgo

|Riesgo|Probabilidad|Mitigación|
|---|---|---|
|Liz no entrega insumos a tiempo|Alta|Recordatorio semanal, bloquear sprint si aplica|
|MercadoPago rechaza cuenta|Media|Tener BBVA Clip como alternativa|
|Cambio de alcance sin costo adicional|Media|Documentar todo en decisions-log.md|
|Inventario desincronizado al importar datos|Media|Script de importación con validación previa|