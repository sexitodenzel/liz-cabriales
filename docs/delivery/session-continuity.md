## Estado actual
- Último estado confirmado: flujo MercadoPago completo implementado
- Sprint actual: Sprint 1
- Estado de continuidad: Cerrado para esta entrega

## Última tarea cerrada
- POST /api/payments/mercadopago
- POST /api/webhooks/mercadopago
- /orden/[id] y /orden/[id]/error
- Checkout conectado end-to-end con MP

## Semáforo
- Verde

## Tarea abierta actual
Email de confirmación al comprador (Resend) — último item del Sprint 1

## Próxima tarea recomendada
1. Definir y confirmar Resend como proveedor de email
2. Implementar email de confirmación de compra
3. Disparar desde el webhook al confirmar approved

## Bloqueadores vigentes
- MERCADOPAGO_WEBHOOK_SECRET real (dashboard MP) — necesario para prueba real
- ngrok o deploy para probar webhook end-to-end
- Credenciales producción de Liz
- Proveedor de email transaccional sin confirmar (Resend recomendado)
- Base de datos real de productos (visita acordada)