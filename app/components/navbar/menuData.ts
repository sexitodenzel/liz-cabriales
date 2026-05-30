/* =========================================
   DATOS DEL MENU
   ========================================= */

export type MenuItem = {
  label: string
  href: string
}

export const menuData = {
  Tienda: {
    col1: {
      title: "Categoría",
      items: [
        { label: "Kits", href: "/tienda?categoria=kits" },
        { label: "Acrílicos", href: "/tienda?categoria=acrilicos" },
        { label: "Gel UV", href: "/tienda?categoria=gel-uv" },
        { label: "Ver todo", href: "/tienda" },
      ],
    },
    col2: {
      title: "Explorar",
      items: [
        { label: "Nuevos productos", href: "/tienda" },
        { label: "Más vendidos", href: "/tienda" },
        { label: "Ofertas", href: "/tienda" },
      ],
    },
    col3: {
      title: "Comprar",
      items: [
        { label: "Carrito", href: "/carrito" },
        { label: "Mi cuenta", href: "/perfil" },
      ],
    },
  },
  Academia: {
    col1: {
      title: "Academia",
      items: [
        { label: "Próximos eventos", href: "/academia" },
        { label: "Cómo inscribirme", href: "/academia#como-inscribirme" },
      ],
    },
    col2: {
      title: "Cursos",
      items: [
        { label: "Todos los cursos", href: "/academia" },
        { label: "Curso básico", href: "/academia" },
        { label: "Masterclass", href: "/academia" },
      ],
    },
    col3: {
      title: "Acciones",
      items: [
        { label: "Agendar cita", href: "/citas" },
        { label: "Iniciar sesión", href: "/login" },
      ],
    },
  },
}