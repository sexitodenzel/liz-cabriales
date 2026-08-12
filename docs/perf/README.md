# Rendimiento del sitio público

Registro de la campaña de optimización de agosto 2026 y, sobre todo, de las
**reglas que no hay que romper**. El detonante fue que una página de producto
tardaba minutos en cargar desde celular con datos.

El contexto que explica casi todas las decisiones: **Vercel y Supabase están en
plan gratuito y cerca del tope**. Por eso las transformaciones de imagen de
Vercel están apagadas (`images.unoptimized: true` en `next.config.ts`) y por eso
cachear en el CDN no es un lujo, es lo que mantiene el consumo abajo.

## Resultados medidos en producción

| | Antes | Después |
|---|---|---|
| `/api/products/by-category` (peor caso) | 31.6 s | 0.33 s (`X-Vercel-Cache: HIT`) |
| Llamadas a esa API por visita en móvil | 19 | 0 |
| HTML de `/tienda` | 4.89 MB | 1.35 MB |
| `public/images/logo.png` | 249 KB | 21 KB |
| Portadas del blog en el home | 1034 KB | 404 KB |
| Imágenes del blog en total | 1865 KB | 715 KB |
| Redirect de cada miniatura Nail Art | 0.6–1.6 s, sin caché | cacheado 5 min en CDN |

## Las cuatro causas

### 1. Los megamenús precargaban en móvil, donde ni existen

Los 6 megamenús son `hidden md:block`, pero React los monta igual y sus efectos
corrían en **todas** las visitas de celular: 19 llamadas a
`/api/products/by-category`, 6 más de otros menús, y ~76 imágenes de tiles que
nadie vería nunca — todo compitiendo por el ancho de banda con la página real.

**Regla:** cualquier precarga dentro de un megamenú va detrás de
`canPrefetchMegaMenu()` (`app/components/navbar/dropdowns/prefetchGate.ts`), que
exige `min-width: 768px` **y** puntero con hover. En móvil la ruta buena es el
`MobileDrawer`, que pide sus datos al abrirse, no al montar.

### 2. Rutas de API públicas sin caché

`/api/products/by-category` era `force-dynamic` + `Cache-Control: no-store`:
cada visitante disparaba una consulta a Supabase por cada categoría del menú.

**Regla:** una ruta de API que sirve catálogo público —sin nada por usuario— se
cachea en el CDN. Devuélvela con `s-maxage` + `stale-while-revalidate` y apoya la
consulta en `lib/supabase/cache.ts`. Es la palanca más grande que hay contra los
límites de Supabase: se pasó de ~19 consultas *por visitante* a ~19 *cada 5
minutos*.

Lo mismo aplicó a `/api/nail-art/image/[postId]`, que hacía consulta + firma +
redirect por cada miniatura y salía con `private`. Ahora las portadas aprobadas
(públicas) se cachean; las `pending`, que dependen de quién las pide, siguen con
`private, no-store`. **No mezclar esos dos casos.**

### 3. `/tienda` pintaba 940 productos de golpe

De los 4.89 MB: 3.58 MB eran el HTML de las 940 tarjetas y 1.31 MB los datos
serializados para hidratar.

La tienda carga el catálogo entero a propósito, para filtrar y ordenar en el
navegador sin ir al servidor. Eso se conservó; lo que cambió es cuántas tarjetas
existen a la vez: `PRODUCTS_PER_PAGE = 24` en `ProductGrid.tsx`, y el resto entra
al hacer scroll (con botón "Mostrar más" como respaldo accesible).

**Regla:** `app/tienda/page.tsx` vacía `description`, `long_description`,
`application_text`, `created_at` y `updated_at` antes de pasar los productos al
cliente. Solo los usa la página de producto; mandarlos son ~220 KB por visita.
Si agregas un campo de texto largo al catálogo, vacíalo ahí también.

### 4. Imágenes crudas

Con `unoptimized: true`, lo que está en el bucket es exactamente lo que baja el
visitante. No hay red de seguridad.

- El logo era un PNG de 1080×1080 (249 KB) que en pantalla nunca pasa de 140 px.
- Las 13 imágenes del blog eran los únicos JPEG del sitio: entraron con la carga
  masiva del Word, saltándose el compresor del panel.

**Regla:** todo lo que suba al bucket `images` pasa por `compressImage()`
(`lib/image-compress.ts`). El panel ya lo hace en todos sus formularios; el que
se lo salta es cualquier carga por script. Si vuelves a importar contenido en
bloque, comprime antes de subir.

## Herramientas

- `scripts/recompress-blog-images.mjs` — recomprime imágenes del blog. Corre con
  `--dry` primero. **No sobrescribe**: sube el WebP como objeto nuevo y reapunta
  la columna, así que revertir es reponer la URL vieja. El mapeo de cada corrida
  queda en `docs/perf/blog-images-<fecha>.json` y los originales siguen en el
  bucket.

## Invalidación de caché al editar en el panel

Las consultas de `lib/supabase/cache.ts` viven entre 2 y 5 min, así que toda
ruta del panel que **escriba** catálogo tiene que tirar su etiqueta o el cambio
no se ve en la tienda hasta que la entrada vence sola.

Usa `revalidateCatalogTags()` (`lib/cache/revalidate-catalog.ts`), que tumba
`categories`, `products` y `brands` de una vez. Van juntas a propósito: la
categoría viaja **embebida dentro de cada producto** (`PRODUCT_SELECT` trae
`categories(...)`), así que renombrarla sin invalidar `products` dejaba el
nombre viejo pegado en las tarjetas.

Ya lo hacían: productos, marcas y descuentos masivos. Se les agregó a las que
faltaban — **variantes** (son el precio y el stock que ve la tienda),
**categorías** y **subcategorías**.

## Decisiones tomadas a propósito

- **Las imágenes del hero NO se recomprimieron.** Ya son WebP; recomprimirlas a
  q78 solo ahorraba 8% (397→366 KB, 289→265 KB) y son el elemento LCP del home.
  No vale arriesgar calidad visible por eso. El caso del blog era distinto:
  JPEG crudo, 60–86% de ahorro.
- **Hay ~970 KB huérfanos en `landing/`**: dos PNG (`…6w1h9za53kd.png` y
  `…ndjapsnq99m.png`, ~500 KB cada uno) que no referencia ninguna tabla ni el
  código. No afectan la velocidad —nadie los descarga— pero ocupan
  almacenamiento. Se pueden borrar desde el panel de Supabase.

## Pendiente

- **Los originales del blog siguen ocupando espacio** (~1.9 MB). Cuando estés
  conforme con cómo se ven los posts, se pueden borrar del bucket usando el JSON
  de mapeo como lista.
- **Quedan ~1.1 MB de datos de catálogo** viajando en `/tienda`, inherente a
  filtrar en el cliente. Bajarlo más significa filtrar en el servidor: es un
  rediseño de la tienda, no un ajuste.
