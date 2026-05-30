
## Contexto previo

Los cursos/talleres son impartidos de manera presencial en el salón de Liz Cabriales o en lugares designados por ella. Se publican en Instagram o Facebook como anuncio previo al evento, similar a un concierto. Tienen cupo limitado, fechas programadas y pueden contar con invitados especiales.

Por privacidad y control operativo, el modelo base de inscripción es por WhatsApp. Desde el admin, Liz puede habilitar por curso la inscripción y pago en línea; cuando esta opción está apagada, el botón público cambia a "Pedir información por WhatsApp" y no permite crear inscripciones/pagos desde API.

El admin también decide si el precio se muestra al público y si se muestra la disponibilidad del curso. Nunca se muestra lista de nombres de asistentes; como máximo se muestra conteo o porcentaje de lugares cuando `show_capacity_public` está activo. Liz puede usar los datos reales o capturar manualmente los números públicos de inscritos y cupo (`public_registered_count`, `public_capacity`). La publicación incluye: título del taller, descripción breve, instructor/invitado especial, fecha, y datos de contacto o botón de registro/WhatsApp.

Los cursos son un pilar secundario del negocio — el fuerte es el ecommerce de productos — pero son importantes para posicionar la marca como academia y generar comunidad.

---

## Decisión implementada

- Inscripción base: WhatsApp.
- Inscripción/pago en línea: opcional por curso desde admin.
- Precio público: visible u oculto por curso.
- Disponibilidad pública: visible u oculta por curso.
- Números de disponibilidad: datos reales por defecto; Liz puede capturar inscritos/cupo públicos manuales.
- Privacidad: nunca se muestran nombres o listas de alumnos inscritos.
- SQL ejecutado: `docs/delivery/sql-course-display-settings.sql`.

---

## To-do (pendiente confirmar con Liz)

- [ ]  ¿Los cursos siempre se pagan 100% adelantado o se aceptan apartados?
- [ ]  ¿Cuántos cupos tiene un curso típico?
- [ ]  ¿Hay política de cancelación o reembolso para cursos?
- [ ]  ¿Los cursos tienen materiales incluidos o el alumno los compra por separado?
- [ ]  ¿La duración de los cursos es fija o varía por tipo?
- [ ]  ¿Quién puede crear/publicar un curso en el admin? ¿Solo Liz o también staff?
- [ ]  ¿Se venden certificados o constancias al terminar el curso?
- [ ]  ¿Hay niveles de curso (principiante, intermedio, avanzado)?
- [ ]  ¿Un mismo usuario puede inscribirse a múltiples cursos?
- [ ]  ¿Cómo se notifica a los inscritos si el curso se cancela o cambia de fecha?

---

## Preguntas para la reunión con Liz

1. ¿Los cursos siempre se pagan completos al momento de inscribirse, o puedes apartar un lugar con un depósito parcial?
2. ¿Cuántos lugares tiene normalmente un taller? ¿Varía por tipo de curso?
3. Si alguien se inscribe y no puede asistir, ¿hay reembolso o el pago es definitivo como en el caso de las citas?
4. ¿Los materiales del curso están incluidos en el precio o el alumno los compra aparte?
5. ¿Cuánto dura normalmente un taller? ¿Hay talleres de varios días?
6. ¿Quién sube los cursos al sistema, solo tú o también alguien de tu equipo?
7. ¿Entregas algún tipo de certificado o constancia al terminar?
8. ¿Manejas niveles o categorías de curso (principiantes, avanzado, técnica específica)?
9. Confirmado: por privacidad no se muestran nombres de inscritos; Liz solo decide si mostrar u ocultar conteo/porcentaje de lugares.
10. Si cancelas o cambias la fecha de un curso, ¿cómo avisas actualmente a los inscritos?