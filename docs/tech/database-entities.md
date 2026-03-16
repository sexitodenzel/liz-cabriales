# database-entities.md

## Contexto previo

### Entidades identificadas

Las siguientes entidades se derivan de los tres pilares del negocio y los flujos documentados:

**Usuarios y autenticación**
- `users` — clientes registrados

**Ecommerce**
- `products` — catálogo de productos
- `orders` — pedidos realizados
- `order_items` — productos dentro de cada pedido

**Citas**
- `services` — servicios disponibles (manicure, pedicure, etc.)
- `appointments` — citas agendadas
- `appointment_services` — servicios incluidos en cada cita

**Cursos**
- `courses` — cursos y talleres publicados
- `course_registrations` — inscripciones de alumnos a cursos

**Administración**
- `professionals` — técnicas del salón con sus agendas

---

## To-do (pendiente definir)

- [ ] ¿Habrá entidad separada para `categories` de productos?
- [ ] ¿Habrá entidad para `instructors` de cursos o va dentro de `courses`?
- [ ] ¿Habrá entidad para `payments` o el estado de pago vive dentro de `orders`, `appointments` y `course_registrations`?
- [ ] ¿Habrá entidad para `availability` o los horarios disponibles se calculan dinámicamente?
- [ ] ¿Habrá entidad para `blocked_slots` (días/horas bloqueados por el admin)?
- [ ] ¿Habrá entidad para `notifications` o los correos se mandan sin persistir?
- [ ] ¿Habrá entidad para `reviews` o calificaciones?
- [ ] Confirmar si `professionals` es necesaria según cuántas técnicas trabajan con Liz

---

## Entidades probables no confirmadas

Estas entidades se anticipan según los flujos pero requieren validación:

- `categories` — categorías de productos
- `payments` — registro de transacciones
- `availability` — horarios disponibles por profesional
- `blocked_slots` — horarios bloqueados por el admin
- `instructors` — instructores invitados de cursos