## Estado actual
- Último estado confirmado: Sprint 1 cerrado al 100% — producción estable
- Sprint actual: Sprint 2
- Estado de continuidad: Cerrado

## Última tarea cerrada
- MERCADOPAGO_WEBHOOK_SECRET real configurado en Vercel
- Webhook MP respondiendo 200 con firma válida
- Tienda /tienda corregida en producción (bug: supabase.com → supabase.co)
- force-dynamic agregado en /tienda
- Políticas RLS creadas para todas las tablas: carts, cart_items, orders, order_items, payments, favorites, appointments, appointment_services, course_registrations, blocked_slots, services, professionals
- Flujo checkout → MP sandbox verificado hasta redirect

## Semáforo
- Verde

## Tarea abierta actual
- Ninguna — Sprint 1 cerrado

## Próxima tarea recomendada
- Arrancar Sprint 2: Panel admin /admin/orders
- Resolver RLS faltantes detectados en producción (ya resuelto esta sesión)
- Preparar documento de pendientes para reunión con Liz

## Bloqueadores vigentes
- Credenciales MercadoPago producción — pendiente de Liz
- Base de datos real de productos — visita acordada
- Prueba end-to-end completa con pago real — requiere credenciales de Liz