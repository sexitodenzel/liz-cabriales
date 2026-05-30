# Pendiente: Datos de negocio y contenido real

**Bloquea:** que el sitio tenga información real en lugar de placeholders; requerido antes de publicar  
**Responsable:** Liz (define y entrega) + Dev (implementa en código/admin)

---

## Información que Liz debe confirmar y entregar

### 1. Datos de contacto del salón

Estos aparecen en los emails transaccionales y posiblemente en la landing:

- **Dirección física completa** del salón (calle, número, colonia, ciudad, CP)
- **Número de WhatsApp oficial** del negocio (en formato E.164: `5218331234567`)
- **Instagram** del salón (ej. `@lizcabriales`)
- **Facebook** del salón (URL completa si aplica)

> El Dev actualiza `lib/email/templates/_shared.ts` con la dirección y contacto reales.

---

### 2. Política de CFDI (facturación)

El sistema ya tiene implementado el cargo del 4% por factura fiscal (CFDI).  
Sin embargo, **Liz debe confirmar este porcentaje con su contadora** antes del lanzamiento.

- [ ] ¿El 4% es correcto según su régimen fiscal?
- [ ] ¿Hay IVA adicional que deba contemplarse?
- [ ] ¿Se emiten facturas a nombre de qué razón social?

> El Dev actualiza `lib/constants/cfdi.ts` (`CFDI_SURCHARGE_PERCENT`) si el porcentaje cambia.

---

### 3. Política de cancelaciones y reembolsos

Debe estar definida y publicada antes del lanzamiento para cumplimiento legal (PROFECO):

- [ ] ¿Cuántos días antes puede cancelar una cita sin cargo?
- [ ] ¿Se ofrecen reembolsos o solo créditos/reagendados?
- [ ] ¿Política diferente para cursos vs. servicios vs. productos?

---

### 4. Catálogo y fotos reales

- [ ] Importar productos reales con precio, descripción y fotos.
- [ ] Al menos 1 curso publicado con fecha, capacidad y precio reales.
- [ ] Servicios con precios reales (no de ejemplo).
- [ ] Fotos de productos (sin placeholders tipo `picsum.photos`).

---

### 5. Textos de la landing

- [ ] Revisar y aprobar textos de bienvenida, hero, secciones de servicios.
- [ ] Sin placeholders de texto (Lorem Ipsum o texto genérico).
- [ ] Aprobar diseño final en staging antes del go-live.

---

## Prueba de aceptación

- [ ] Emails de confirmación muestran dirección real del salón.
- [ ] No hay imágenes de `picsum.photos` en producción.
- [ ] Al menos 1 producto real disponible en la tienda.
- [ ] Al menos 1 curso real publicado.
- [ ] Política de cancelaciones accesible en el sitio.

---

## Referencias

- RACI sección 7 — Operación y contenido
- Owner Checklist sección D — Datos de negocio
- Checklist pre-lanzamiento → Contenido y Operativo
