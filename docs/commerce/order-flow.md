# order-flow.md

## Contexto previo

### Flujo del pedido
1. Usuario agrega productos al carrito
2. Procede al checkout
3. El pedido se crea después de confirmar el pago
4. Usuario recibe confirmación por correo

### Estados de un pedido
- `pending` — pago en proceso
- `paid` — pago confirmado
- `shipped` — enviado
- `delivered` — entregado

### Entrega
El checkout ofrece dos opciones según la ubicación del comprador:
- **Envío a domicilio** — disponible a toda la república mexicana
- **Retiro en local** — para clientes locales

El cálculo del costo de envío y la paquetería a usar están sin definir.

---

## To-do (pendiente confirmar con Liz)

- [ ] ¿Qué paquetería usa o prefiere (Estafeta, FedEx, DHL, Correos de México)?
- [ ] ¿Cómo se calcula el envío — precio fijo, por peso, por zona?
- [ ] ¿Quién gestiona el envío — Liz lo lleva a paquetería o usa pickup?
- [ ] ¿Hay tiempo estimado de envío que mostrar al cliente?
- [ ] ¿Hay estado adicional `cancelled`?
- [ ] ¿El admin puede modificar el estado del pedido manualmente?
- [ ] ¿Se notifica al cliente por correo en cada cambio de estado?
- [ ] ¿Hay política de devolución para productos dañados o incorrectos?
- [ ] ¿El retiro en local requiere confirmación previa o es inmediato?

---

## Preguntas para la reunión con Liz

1. ¿Qué paquetería usas o quieres usar para los envíos?
2. ¿Cómo calculas el costo de envío — precio fijo, por peso, por estado?
3. ¿Tú llevas los paquetes a la paquetería o pasan a recogerlos?
4. ¿Quieres que el cliente reciba un correo cada vez que cambia el estado de su pedido?
5. ¿Qué pasa si un producto llega dañado — aceptas devolución o cambio?
6. ¿El cliente que elige retiro en local puede pasar en cualquier momento o necesita confirmar horario?