
## Contexto previo

### Catálogo de productos
El ecommerce maneja tres categorías de productos:
- Productos para uñas
- Ciertos productos para pestañas
- Productos de podología

### Funcionalidades del cliente

**Perfil de usuario:**
El perfil es básico, no editable más allá del registro inicial. Campos:
- Nombre(s)
- Apellidos
- Dirección / Estado / Municipio
- ID de usuario (generado por el sistema)

**Compras:**
- Comprar productos del catálogo
- Ver historial de pedidos pasados

**Citas:**
- Reservar citas para servicios de uñas
- Ver historial de citas pasadas

**Cursos:**
- Ver cursos disponibles
- Inscribirse a un curso (requiere pago previo a la confirmación)
- Ver cursos en los que está inscrito

**Búsqueda (navbar):**
- En móvil, ícono de lupa que abre un overlay full-screen con animación de fade
- Logo centrado entre el menú hamburguesa (izq) y los íconos de favoritos + carrito (der)
- En desktop, barra de búsqueda inline en el navbar
- Al enfocar la búsqueda sin texto, se muestra:
  - Chips de "Más buscados" (configurables por admin)
  - Grid de "Best Sellers" (productos marcados por admin)
- Al escribir 2+ caracteres se muestran sugerencias en vivo de productos y colecciones
- Tap en un chip de "Más buscados" navega al término o link configurado por admin

### Funcionalidades del administrador

**Productos:**
- Crear, editar y eliminar productos
- Marcar productos como `★ Destacado` (aparecen en "Nuevos lanzamientos" del home)
- Marcar productos como `♥ Best Seller` (aparecen en el overlay de búsqueda)

**Cursos:**
- Crear cursos y talleres
- Ver y gestionar lista de asistentes inscritos

**Citas:**
- Ver todas las citas agendadas con detalle: hora, día, costo y servicio solicitado

**Más buscados (navbar):**
- Gestionar la lista de chips que aparecen en el overlay de búsqueda (panel `/admin/top-searches`)
- Cada término permite: texto, link opcional (si se omite, busca por el texto), activar/desactivar, reordenar

---

## To-do (pendiente confirmar con Liz)

- [ ] ¿El cliente puede cancelar una cita desde su perfil o solo el admin?
- [ ] ¿El cliente puede cancelar su inscripción a un curso?
- [ ] ¿El admin puede editar o cancelar cursos ya publicados?
- [ ] ¿Los campos de perfil son editables después del registro o quedan fijos?
- [ ] ¿La dirección del perfil se usa como dirección de envío por defecto?
- [ ] ¿El admin puede ver el historial completo de un cliente específico?
- [ ] ¿Hay roles diferenciados dentro del admin (Liz vs staff)?

---

## Preguntas para la reunión con Liz

1. ¿Un cliente puede cancelar su propia cita desde el sitio o eso solo lo haces tú desde el admin?
2. Si alguien ya pagó un curso y quiere cancelar, ¿puede hacerlo desde el sitio?
3. ¿Los datos del perfil (nombre, dirección) los puede cambiar el usuario después de registrarse?
4. ¿La dirección que pone en su perfil se usa automáticamente para envíos o la captura al momento de comprar?
5. ¿Necesitas poder ver todo el historial de un cliente en particular (compras + citas + cursos) desde el admin?