# Notas para explicar en la entrega final

Cosas que hay que demostrar y explicar a Liz en la reunión de entrega. Agregar aquí todo lo que vayamos desarrollando que necesite walk-through.

---

## Flujo de facturación CFDI

### Cómo funciona desde el lado de la clienta

1. **En el checkout**, la clienta activa la casilla "Requiero factura (CFDI)".
2. Llena su **RFC**, **razón social** y el **correo donde quiere recibir la factura** (se pre-llena con el correo de su cuenta, pero puede cambiarlo).
3. Opcionalmente sube su **constancia de situación fiscal** en ese momento (PDF, JPG o PNG, máx. 10 MB). Si no la tiene a la mano, la puede subir después.
4. Paga normalmente con MercadoPago. El total incluye el **16% adicional** por CFDI.
5. Una vez pagada la orden, en su página de orden (`/orden/[id]`) aparece un uploader para que **suba la foto o PDF de su comprobante de pago (ticket)**. Esto es lo que Liz necesita para emitir la factura.
6. Cuando Liz emite la factura (ver abajo), la clienta recibe un **correo de confirmación** en el correo que registró para la factura.

### Cómo funciona desde el panel de admin (lo que Liz ve)

1. Liz entra a cualquier orden en `/admin/orders/[id]`.
2. Si la orden requiere factura, aparece la sección **"Facturación CFDI"** con:
   - RFC de la clienta
   - Razón social
   - Correo de factura
   - Estado de la factura (Pendiente / Emitida)
   - Botón **"Ver constancia fiscal"** (si ya la subió) → abre el documento
   - Botón **"Ver ticket de pago"** (si ya lo subió) → abre el comprobante
3. Cuando Liz tiene los documentos y emite la factura en su sistema de facturación, da clic en **"Marcar factura como emitida"**.
4. Esto le manda automáticamente un **correo a la clienta** avisándole que ya está lista su factura.

### Correos automáticos involucrados

| Evento | Destinatario | Cuándo se manda |
|--------|-------------|-----------------|
| Solicitud de factura recibida | **Liz** (admin) | Cuando la clienta sube su constancia fiscal en el checkout |
| Factura emitida | **Clienta** (correo de factura) | Cuando Liz da clic en "Marcar como emitida" |

### Importante aclarar a Liz

- El sitio **no emite la factura automáticamente**. Solo avisa y organiza los datos. Liz sigue usando su sistema de facturación (SAT / su contadora) para emitir el CFDI y mandárselo a la clienta.
- El **16% ya está incluido en el total del pedido** — no es algo que Liz cobre por separado después.
- Los documentos (constancia y ticket) se guardan en un área privada de almacenamiento — nadie los puede ver si no está en el panel de admin.
- Si una clienta no sube la constancia antes de pagar, el correo de notificación a Liz lo indica claramente. La clienta puede subirla en cualquier momento desde su página de orden.

---

<!-- Agregar más secciones aquí conforme se vayan desarrollando features que necesiten explicación en entrega -->
