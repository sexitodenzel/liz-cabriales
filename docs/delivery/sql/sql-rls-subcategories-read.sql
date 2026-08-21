-- subcategories tiene RLS habilitado pero 0 políticas, así que queda bloqueada
-- para la anon key. El buscador (app/api/products/search-suggestions/route.ts)
-- la consulta con el cliente anónimo, por lo que hoy las sugerencias de
-- subcategoría nunca aparecen. Agregar lectura pública (mismo patrón que
-- categories → "Lectura pública de categorías"). Es catálogo público, sin riesgo.
-- Las escrituras siguen solo por el service role (admin), que ignora RLS.

CREATE POLICY subcategories_public_read
  ON subcategories
  FOR SELECT
  USING (true);
