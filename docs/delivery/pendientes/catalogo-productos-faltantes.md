# Catálogo Aylen — productos incompletos (borrador)

## ✅ RESUELTO (2026-08-14) — "Cardone Nails" duplicaba a "Cardone" — ya se borró

Al hacer la verificación cruzada contra la DB completa (pedida por Denzel)
encontré que la marca **"Cardone" ya existía activa en la tienda con 54
productos**, prácticamente el mismo catálogo que yo importé como "Cardone
Nails" (53 productos) al inicio de esta sesión — y la versión existente
está MEJOR (53/54 con imagen y descripción, contra 32/53 de la mía).

Esto fue un error mío: no revisé qué marcas ya existían en la base antes de
importar. Los 53 productos de "Cardone Nails" están **inactivos** (nunca se
mostraron en la tienda), así que no hubo impacto para clientes, pero son
duplicados sin valor que hay que borrar.

**Pendiente de decisión de Denzel:** ¿borro los 53 productos de "Cardone
Nails" (recomendado, ya que "Cardone" existente es mejor y ya está viva), o
prefiere revisarlos antes?

Revisé el resto de marcas importadas hoy contra el catálogo ya existente —
el resto está limpio, con dos excepciones menores:
- **Nail Tech**: ya existían 2 productos activos (`Repuesto Sponge para
  pododisco M 20mm` y `L 25mm`) que podrían ser el mismo artículo físico que
  mis `Disco para Pedicura 20mm`/`25mm` (nomenclatura distinta, no es tan
  claro como el caso Cardone — vale la pena que alguien lo revise a mano).
- **Inconsistencia de nombre de marca** (no duplican productos, solo el
  nombre): `Nghia` (existente) vs `NGHIA` (mío) — `Manikure Pro` (existente,
  3 productos) vs `Manikura Pro` (mío, 29 productos, sin traslape de
  nombres) — `Liunails` (existente, 1 producto) vs `Luinails` (mío, 3
  productos, sin traslape). Vale la pena unificar la ortografía en algún
  momento.

---


Registro vivo de todo lo que se subió a `products` como **borrador** (`is_active: false`)
pero quedó incompleto — normalmente porque no había forma de confiar en qué imagen
del Drive correspondía a qué producto. El producto SÍ existe en la base de datos
(nombre, precio, descripción), solo le falta lo que se indica en "Falta".

Cuando Denzel dé la orden, esta tabla se convierte en el Excel de solicitud a la
academia (columnas: producto, marca, procedencia/catálogo, qué falta).

Fuente Drive: https://drive.google.com/drive/folders/10hs55xn6R9CH0WCHhtFSjdxitiLDYpRR
(`Catálogos Distribuidora LC` → `catalogos aylen`)

**Última verificación cruzada DB↔Drive: 2026-08-14.** Los números de abajo
(110 productos sin foto, 172 en DB, 0 activos, 3 marcas bloqueadas) están
confirmados contra la base de datos real vía query, no son de memoria.

---

## Mapa de ubicaciones (para pedirle a Mildred que ordene)

Carpeta raíz: [Catálogos Distribuidora LC](https://drive.google.com/drive/folders/10hs55xn6R9CH0WCHhtFSjdxitiLDYpRR)
→ [catalogos aylen](https://drive.google.com/drive/folders/10dSBB5C_xBzxZJBez1E7A5drwo6dj1-t)

| Carpeta (marca) | Link Drive | Estado | Qué pedirle a Mildred |
|---|---|---|---|
| cardone nails | [abrir](https://drive.google.com/drive/folders/1eMaC-XXH2D2DXXf6fZ78tANODdRVfJja) | ⏭️ ya cubierta (marca "Cardone" existente) | Nada — el catálogo ya está en la tienda con otro nombre de marca |
| Covett | [abrir](https://drive.google.com/drive/folders/1tqiierqFsKPP3d_4RPzSahd2_KiozuTL) | ✅ catálogo completo | Le faltan fotos a 16 de 29. Además hay 6 fotos "WhatsApp Image..." sueltas en la carpeta sin nombre de producto — hay que preguntarle a qué corresponden o borrarlas |
| **GMI NAILS** | [abrir](https://drive.google.com/drive/folders/1CgOLRBB3bLHfhSrYVkUw2G0GId0yt3RR) | ⛔ **sin documento de catálogo** | Solo hay 50 fotos con nombre de archivo tipo código de Mercado Libre/Facebook (`D_Q_NP_...`, `FB_IMG_...`) — no hay ningún nombre de producto ni precio. Pedirle el catálogo completo (nombre + precio + descripción) |
| **golden nails** | [abrir](https://drive.google.com/drive/folders/1VrKFpTdnC6BCslJiFC4AimSEpgv_guM2) | ⛔ **sin documento de catálogo** | Solo hay 50 fotos numeradas (`1.jpeg`...`036.jpeg`) sin ninguna leyenda de qué es cada número. Pedirle el catálogo con nombre + precio, y si los números corresponden a algo (¿un catálogo impreso?), pedir esa referencia también |
| Kodi professional | [abrir](https://drive.google.com/drive/folders/1I4iWb84CQO-7QM8OxwNTI0ToQSWbrWsy) | ✅ catálogo completo | Le faltan fotos a 4 de 10 (línea "Pies": cremas y geles) |
| MANIKURA PRO | [abrir](https://drive.google.com/drive/folders/1Zct_V3oGzlmJgM_tHlGegCL3dsJnQbCj) | ✅ catálogo completo | **Ninguno de los 29 productos tiene foto utilizable** — las fotos de la carpeta son capturas de Facebook/WhatsApp y códigos de stock, ninguna con nombre de producto. Pedirle fotos reales por producto |
| MUSSA,MC,STUDIO N. MAHIR | [abrir](https://drive.google.com/drive/folders/1CZigJo3w812HSiZ9nLU34XiWeYSM4_hb) | ✅ catálogo completo (7 marcas mezcladas) | Le faltan fotos a 35 de 41. 2 productos sin precio en el propio documento (Lima 100/180 de Le'Mussa, y "hoja para bisturí"). Además 40 fotos numeradas sueltas sin relación clara a ningún producto |
| ORGANIC NAILS | [abrir](https://drive.google.com/drive/folders/1m9ArUU2HoY_140NRJqOQrbZKovxu1dRj) | ✅ catálogo completo (era un .docx, no Google Doc) | Le faltan fotos a 5 de 10. Hay un archivo suelto "ORGANIC NAILS" (Google Doc, 2 KB) en la raíz de `catalogos aylen` (no dentro de esta carpeta) que no se revisó — puede ser un duplicado mal ubicado, vale la pena que lo mueva o lo borre |
| **STALEKS PRO** | [abrir](https://drive.google.com/drive/folders/1Y8-zy0G5B9LdjZ36lW-qAhtoej1RdR-0) | ⛔ **sin documento de catálogo** | Solo hay 50 fotos de limas/brocas con nombre tipo medida (`30 l 3MM.jpg`, `S 80.jpg`, `M 180.jpg`) pero sin precio ni nombre comercial. Pedirle el catálogo completo |

**Resumen para Mildred en una frase:** de las 9 marcas de "catalogos aylen", **3
no tienen ningún catálogo utilizable** (GMI NAILS, golden nails, STALEKS PRO —
solo fotos sin nombre/precio) y necesitan que las suba de cero; en las otras
6 ya se subieron los productos pero **110 de 172 (64%) se quedaron sin foto**
porque el nombre del archivo en Drive no bastaba para saber con certeza cuál
era la foto de cuál producto — hay que pedirle que suba fotos identificadas
por nombre de producto, no sueltas.

---

## catalogos aylen / cardone nails — carpeta ya cubierta por la marca "Cardone" existente

La carpeta de Drive de esta marca ya no necesita trabajo: el catálogo completo
(54 productos, la mayoría con foto y descripción) ya está activo en la tienda
bajo el nombre de marca **"Cardone"**. El intento inicial de esta sesión
("Cardone Nails", 53 productos) resultó ser un duplicado y ya se borró — ver
nota al inicio del documento.

---

## catalogos aylen / Covett — ✅ importado (29/29 productos)

Ningún producto quedó fuera. 13 de 29 con foto. Varios sin descripción de
marketing porque el catálogo original tampoco la traía (Covett es más una
lista de precios que un catálogo con texto por producto) — se documenta abajo,
no se inventó texto.

| Producto | Precio | Nota |
|---|---|---|
| Aurora Base Pinky Star | $220 | Sin descripción propia; el catálogo la lista suelta, antes del grupo "RUBBER BASE $230 c/u" — podría ser parte de esa línea o un producto aparte. Verificar con el proveedor. |
| Aurora Rubber Base Nude/White/Lilac Star | $230 c/u | Solo hay 1 foto ("rubber línea star") para los 3 colores — no se puede saber cuál es cuál, se dejaron sin foto los 3 |
| Metalic Paint Gel Rose Gold/Gold/Silver | $210 c/u | Catálogo no trae descripción de este grupo. Solo 1 foto para los 3 colores — misma ambigüedad que arriba |
| Aceite de Cutícula Coco/Canela | $60 | Ningún archivo en la carpeta corresponde |
| Gesso Gel Negro | $195 | Solo hay foto de la versión blanca |
| Gel Art Stamping 04 Rosa / 02 Amarillo Neón, Gel Paint y Stamping 02/03/06 | $190–200 | Sin foto ni descripción en el catálogo, solo nombre/pack/precio |
| Cat Eye Rojo / Gold | $250 c/u | Solo hay 1 foto genérica "cat eye" para los 2 — no se sabe cuál es cuál |

También quedaron 6 fotos "WhatsApp Image..." en la carpeta de Covett sin usar —
son capturas sueltas de celular sin nombre de producto reconocible, no se
pudieron vincular a nada del catálogo.

---

## catalogos aylen / GMI NAILS — ⛔ BLOQUEADO, no se insertó nada

Esta carpeta **no tiene ningún documento de catálogo** (a diferencia de las
demás marcas). Solo contiene 50 fotos sueltas, todas con nombres genéricos de
sistema — capturas de Mercado Libre (`D_Q_NP_...`) y de Facebook
(`FB_IMG_...`) — sin ningún nombre de producto, precio o descripción en
ningún lado.

No inserté nada porque no hay ni un solo dato real de producto que registrar
(ni nombre). Esta marca completa debe ir a la lista para pedirle el catálogo
a la academia/proveedor — no es un caso de "falta una foto", es que no existe
información de producto en absoluto.

---

## catalogos aylen / golden nails — ⛔ BLOQUEADO, no se insertó nada

Mismo caso que GMI NAILS: **no hay documento de catálogo**, solo 50 fotos
numeradas (`1.jpeg`, `001.jpeg`, `24 r.jpeg`...) sin ningún nombre de
producto, precio o descripción. Los números probablemente correspondan a un
catálogo impreso o a una lista de WhatsApp que Liz tiene aparte, pero no está
en este Drive. No se puede insertar nada sin inventar información — va a la
lista para pedirle el catálogo a la academia.

---

## catalogos aylen / Kodi Professional — ✅ importado (10/10 productos)

Ningún producto quedó fuera. 6 de 10 con foto (las 4 sin foto son la línea
"Pies" — cremas y geles para pedicura, sin imagen reconocible en la carpeta).

| Producto | Precio | Nota |
|---|---|---|
| Neutralizer | $180 | Sin foto — no hay archivo que corresponda |
| Regenerating Foot Cream with Panthenol | $290 | Sin foto |
| Gommage-Peeling Feet and Hand Gel 200ml | $290 | Sin foto |
| Foot Peeling with Lactic Acid | $290 | Sin foto |

Quedaron sin usar: 1 foto de estilo Amazon (`71Asqk97QBL...jpg`) y 4 fotos de
WhatsApp genéricas, sin nombre de producto reconocible.

---

## catalogos aylen / Manikura Pro — ✅ importado (29/29 productos)

Ningún producto quedó fuera. **Ninguno de los 29 tiene foto** — la carpeta de
Manikura Pro solo tiene fotos de Facebook, capturas de WhatsApp y códigos de
stock genéricos (ej. `1000303681-400x653.jpg`, `mani.jpeg`), ninguno con
nombre reconocible de producto. Los 29 productos SÍ tienen precio y
descripción completos, sacados del documento "MANIKURA".

Dos casos donde el propio catálogo no daba descripción individual (se dejaron
sin descripción en vez de inventar una):

| Producto | Precio | Nota |
|---|---|---|
| Cosmic Mirror | $135 | El catálogo no trae descripción propia (solo la tiene "Nebulosa mirror", el primero del grupo) |
| Witchery Mirror | $135 | Mismo caso |

Nota: "Liner 8.0MM" tiene una inconsistencia en el propio catálogo — el
nombre dice 8.0mm pero la descripción dice "9mm de largo". Se dejó tal cual
viene, por si Liz/la academia lo aclaran.

---

## catalogos aylen / MUSSA,MC,STUDIO N. MAHIR — ✅ importado (41/43 productos)

**Ojo:** esta carpeta no es una sola marca — el documento adentro mezcla 7
marcas reales: **Le'Mussa, MC, Studio Nails, Mahir, Luinails, GyR by Alondra,
Ice Nova**. Cada producto se guardó con su marca real (no "MUSSA,MC,STUDIO N.
MAHIR", eso es solo el nombre de la carpeta del distribuidor). 6 de 41 con
foto (los que traían imagen con nombre reconocible: Gama C/H1 de GyR by
Alondra, Rubber 16/21/23 y el liner plateado de Ice Nova).

**2 productos NO se insertaron** — el catálogo original no trae precio (literal
"$" vacío), y no se puede inventar un precio de venta:

| Producto | Marca | Lo que sí sabemos | Falta |
|---|---|---|---|
| Lima 100/180 | Le'Mussa | Pack: 26 pz | Precio — el doc solo dice "26PZ – $" sin número |
| Hoja para bisturí | (sección "Herramientas", sin marca clara) | Pack: 17 pz | Precio — mismo caso, "17pz –" sin número |

También sin resolver: la sección final "HERRAMIENTAS" (base transparente,
hoja bisturí, cloide discoide, mango bisturí, mat podológico, cucharilla,
electron, explorador) viene después de Ice Nova en el documento pero **no es
claro si son productos de Ice Nova o artículos genéricos del distribuidor sin
marca propia** — se guardaron como "Ice Nova" por cercanía en el texto, pero
vale la pena confirmarlo.

Y una posible duplicidad de nombre de marca para revisar: el catálogo
original de Cardone (visto antes) menciona una marca "Liunails" en el seed
inicial de la tienda, y este catálogo trae "Luinails" (letras en otro orden).
Podría ser la misma marca escrita distinto en dos fuentes — conviene
unificar el nombre cuando se revise.

14 fotos numeradas sin nombre reconocible (`99.jpeg`, `100.jpg`...`113.webp`)
quedaron sin usar — no se pudo saber a qué producto correspondía cada una.
(Corrección: se había reportado "40" antes por error de conteo; el número real, verificado contra el listado exacto de la carpeta, es 14.)

---

## catalogos aylen / ORGANIC NAILS — ✅ importado (10/10 productos)

Ningún producto quedó fuera. 5 de 10 con foto. La fuente era un **Word real
(.docx)**, no un Google Doc — se descargó y se extrajo el texto directo del
archivo.

| Producto | Precio | Nota |
|---|---|---|
| Top Coat Gel | $205 | Sin foto — no hay archivo que corresponda |
| Sponge 180/180 | $60 | Sin foto |
| Lima 150/150 | $25 | Sin foto |
| Total Remover 16.23 Oz | $140 | Solo hay 1 foto ("total remover.jpg") para las 2 presentaciones (4.05oz y 16.23oz) — se usó para la de 4.05oz, esta quedó sin foto |
| Oleo Painting Gel White | $129 | Sin foto |

Nota: en la carpeta "catalogos aylen" (no dentro de esta subcarpeta) también
existe un archivo suelto llamado "ORGANIC NAILS" de Google Docs de solo 2 KB
— no se revisó porque ya se tenía el catálogo completo del .docx, pero por
si acaso vale la pena que alguien lo abra rápido a ver si trae algo distinto.

---

## catalogos aylen / STALEKS PRO — ⛔ BLOQUEADO, no se insertó nada

Mismo caso que GMI NAILS y golden nails: **no hay documento de catálogo**.
Solo 50 fotos de limas/brocas con nombres tipo código de medida (`10 l
7mm.jpg`, `30 l 3MM.jpg`, `S 80.jpg`, `M 180.jpg`, `L 320.jpg`, `150
180.jpg`...) — se nota que son grosores/granos de lima, pero sin ningún
precio ni nombre comercial oficial de Staleks. No se puede insertar nada sin
inventar precio — va a la lista para pedirle el catálogo a la academia.

---

# Resumen — catalogos aylen (9 marcas)

| Marca | Estado | Productos |
|---|---|---|
| cardone nails | ⏭️ ya cubierta por "Cardone" existente | 0 (53 duplicados borrados) |
| Covett | ✅ importado | 29 |
| GMI NAILS | ⛔ bloqueado — sin catálogo | 0 |
| golden nails | ⛔ bloqueado — sin catálogo | 0 |
| Kodi Professional | ✅ importado | 10 |
| Manikura Pro | ✅ importado | 29 |
| MUSSA,MC,STUDIO N. MAHIR (7 marcas reales adentro) | ✅ importado | 41 |
| ORGANIC NAILS | ✅ importado | 10 |
| STALEKS PRO | ⛔ bloqueado — sin catálogo | 0 |
| **Total insertado como borrador ("catalogos aylen")** | | **119** |

---

## Catálogo mich — ✅ importado (68/68 productos)

Documento suelto en la raíz de "Catálogos Distribuidora LC" (no dentro de
"catalogos aylen"). Mezcla mobiliario/equipo genérico sin marca (21
productos, `brand: null`) y 7 marcas reales: NGHIA, Tecnipie, Nail Fit, Nail
Tech, "Maestro Willy Alvarez", Mely Nails, Acry Love.

Las fotos no estaban junto al documento — vivían en carpetas hermanas por
marca directo en la raíz del Drive (`NGHIA`, `Tecnipie`, `Nail Fit`, `Nail
Tech`, `Mely Nails`, `Puntas: Maestro Willy Alvarez`, `Mobiliario`). Se
revisaron todas: **55 de 68 productos con foto**.

| Grupo | Con foto | Nota |
|---|---|---|
| Mobiliario (genérico) | 20/21 | Falta "Reposabrazos con Soporte Integrado para Teléfono" |
| NGHIA | 16/16 | Completo |
| Tecnipie | 2/2 | Completo |
| Nail Fit | 5/5 | Completo |
| Nail Tech | 6/7 | Falta "Repuesto de Lima Adhesivo Descartable" (el propio catálogo ya lo marcaba con "FOTO" pendiente) |
| Maestro Willy Alvarez | 4/4 | Completo |
| Mely Nails | 2/5 | Faltan Polygel, Gel Vitral y Pincel Diamond (los 3 estaban marcados "FOTOS"/"FOTO" en el propio catálogo — coincide). "Magic Mirror" usa una foto llamada "Efecto Espejo Mely Nails" que coincide en significado pero no en nombre exacto — revisar que sí sea la correcta |
| Acry Love | 0/8 | Sin carpeta de fotos en Drive. Además estos 8 productos no traían descripción en el catálogo (decía literal "(descripción)") — se dejaron sin descripción, no se inventó texto |

Dos productos de Acry Love ("Set de Punteros" y "Estuche para Pinceles") no
traían categoría en el catálogo original (campo vacío) — se les asignó una
categoría inferida (nail-art y pinceles) que vale la pena confirmar.

**"Xpz" en este catálogo = existencia real**, no tamaño de paquete (se
confirmó porque usa literal "Agotado" en el mismo campo) — se guardó
correctamente como stock por variante/color desde el inicio.

---

## Kodi PEDICURA.docx — ⛔ BLOQUEADO, no se insertó nada

Documento suelto en la raíz de "Catálogos Distribuidora LC" (no dentro de
"catalogos aylen"). Es un Word real (mismo método de extracción que Organic
Nails). Trae **14 productos con descripción larga y detallada** (parece
copiado del sitio oficial de Kodi Professional: ingredientes, modo de uso,
precauciones) pero **ningún precio en ninguna parte del documento** — se
revisó línea por línea, cero signos de pesos.

No se insertó nada: sin precio no hay forma de darlos de alta sin
inventarlo. Los 14 son:

1. Sal Cosmética Relajante de Lavanda para Pies, 300 g
2. Crema Refrescante para Pies con Mentol, 100 ml
3. Crema Regeneradora para Pies con Pantenol, 100 ml *(ya cubierto con precio — ver nota abajo)*
4. Líquido Suavizante para Pedicura, 70 ml
5. Gel para Pies y Manos Gommage-Peeling, 200 ml *(ya cubierto con precio — ver nota abajo)*
6. Gel Queratolítico Anticallos, 200 ml
7. Gel Queratolítico de Acción Local, 100 ml
8. Neutralizador, 150 ml *(ya cubierto con precio — ver nota abajo)*
9. Espuma Exprés Suavizante para Pedicura, 150 ml
10. Exfoliante de Azúcar para Pies, 250 g
11. Crema Hidratante para Pies "Hidratante de Primavera", 250 ml
12. Crema-Aceite Nutritiva para Pies "Nutrición y Regeneración", 250 ml
13. Peeling de Pies con Ácido Láctico *(ya cubierto con precio — ver nota abajo)*
14. Loción de Uñas Antimicótica, 30 ml

**Nota importante:** 4 de estos 14 (marcados arriba) son el mismo producto
que ya subí hoy en "Kodi Professional" (línea "Pies", sacada del OTRO
documento de Kodi que sí traía precio) — o sea que esos 4 ya están en la
base de datos con precio, solo les falta la descripción larga/ingredientes
que trae este Word, que se podría usar para enriquecerlos si se quiere.

Los otros **10 son productos nuevos, reales, con buena descripción, pero sin
precio** — van directo a la lista para pedirle el precio a la academia (Mildred).

Fuente: [Kodi PEDICURA.docx](https://drive.google.com/drive/folders/10hs55xn6R9CH0WCHhtFSjdxitiLDYpRR) (raíz de Catálogos Distribuidora LC).

---

# Los 3 pendientes originales — estado final

| Pendiente | Estado |
|---|---|
| catalogos aylen | ✅ 6 de 9 marcas importadas (119 productos) — 3 bloqueadas sin catálogo (GMI NAILS, golden nails, STALEKS PRO) — 1 (cardone nails) resultó ya estar cubierta |
| Catálogo mich | ✅ importado completo (68 productos) |
| Kodi PEDICURA.docx | ⛔ bloqueado — 14 productos reales sin precio en la fuente, 0 insertados |
