# Entrega a domicilio local (repartidor)

Tercer método de entrega para clientes locales, además de **Envío nacional** y **Recoger en tienda**.

## Qué es

`delivery_type = "local_delivery"` — entrega a domicilio con repartidor en **Tampico, Cd. Madero y Altamira**.

- En el sitio se cobran **solo los productos** (`shipping_cost = 0`, sin cotización de guía, no pasa por `awaiting_shipping_payment`).
- El **costo del envío lo paga el cliente directamente al repartidor** al recibir el pedido.
- El admin coordina y le comparte al cliente el número del repartidor por WhatsApp (manual — los repartidores varían).

## Flujo

1. **Checkout** → tab **"Local"** con dos opciones: *Recoger en tienda* (`pickup`) o *Envío a domicilio* (`local_delivery`). Al elegir a domicilio, el cliente llena dirección (Ciudad limitada a las 3 ciudades por menú fijo + validación en backend) y paga solo productos.
2. **Pago aprobado** → orden queda `paid`. Correo al cliente + correo/WhatsApp a Liz (WhatsApp admin requiere `ADMIN_WHATSAPP_PHONE`).
3. **Panel admin** → orden con etiqueta "A domicilio (local)", dirección y **WhatsApp del cliente clickeable** (link `wa.me`). No aparece el formulario de guía.
4. Liz contacta al cliente, coordina repartidor. Al entregar, marca **"Entregado"** (avisa al cliente).

## Alcance / decisiones

- **Zona auto-declarada**: no se valida C.P. ni ubicación real (se descartó el candado de C.P.). Riesgo bajo: el envío no se cobra online, así que si un no-local se cuela, admin lo maneja (convertir a retiro/paquetería o reembolsar).
- El teléfono capturado en el checkout local se guarda al perfil para que el admin siempre lo vea.

## Migración requerida

`docs/delivery/sql-local-delivery.sql` — amplía el CHECK de `orders.delivery_type` para aceptar `local_delivery`. **Ya ejecutado en Supabase** (jul 2026).

## Archivos principales

- `types/index.ts`, `lib/constants/contact.ts` — tipo + ciudades
- `lib/validations/orders.ts` — validación
- `lib/supabase/orders.ts`, `lib/supabase/adminOrders.ts` — creación de orden + teléfono cliente
- `app/checkout/CheckoutClient.tsx` — UI de 2 niveles
- Etiquetas/dirección: admin (lista y detalle), `DigitalTicket`, emails (confirmación, admin), notificación WhatsApp
- Horarios de tienda actualizados a Lun–Sáb 10–19h / Dom 10–14h (días de curso) en `orderInfo`, `Footer`, `MobileDrawer`, `contact.ts`
