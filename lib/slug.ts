/**
 * Slugify canónico del sitio. Translitera acentos (í→i, ó→o, ñ→n) ANTES de
 * quitar lo no-alfanumérico; si no, `[^a-z0-9-]` borra la letra acentuada
 * completa y genera slugs rotos ("lquidos", "monmero").
 *
 * Es la MISMA lógica en cliente y servidor: el filtro `?subcategoria=` de la
 * tienda compara slugify(product.subcategory) contra el slug de la URL, y el
 * admin genera slugs de categorías/subcategorías/marcas con esta función.
 * Si esto diverge, los filtros dejan de encontrar productos.
 */
export function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita los diacríticos ya separados
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
