-- Seed de descripciones para las 42 marcas que distribuye Liz Cabriales.
-- Descripciones recopiladas vía búsquedas web (Google) en junio 2026.
-- Las marcas marcadas como "Descripción pendiente" no se encontraron con suficiente
-- detalle en búsqueda web pública; editar manualmente desde el admin cuando se
-- cuente con información oficial.
--
-- Requiere primero: docs/delivery/sql-brand-description.sql (agrega la columna).
-- Idempotente: corre cuantas veces quieras. Sobrescribe cualquier descripción
-- existente — si tienes descripciones editadas a mano que quieras conservar,
-- comenta los UPDATE correspondientes.

UPDATE brands SET description = 'Marca mexicana especializada en instrumentos profesionales para manicura y pedicura — alicates para cutícula, pedicura y podología — fabricados con acero inoxidable de origen Pakistán y garantía de un año.' WHERE name = 'aashta';

UPDATE brands SET description = 'Marca mexicana con presencia internacional especializada en productos para la aplicación de uñas: polvos acrílicos, geles, esmaltes en gel, polygel, lámparas LED/UV, herramientas eléctricas, pinceles y accesorios. Productos elaborados en EE. UU.' WHERE name = 'Acry Love';

UPDATE brands SET description = 'Empresa mexicana con más de cuatro años de experiencia en productos profesionales para uñas. Conocida por su esmalte en gel de 1 paso de hasta 21 días de duración, polygel y una gama amplia de bases, tops y herramientas.' WHERE name = 'Alfatech';

UPDATE brands SET description = 'Línea de acrílicos, geles semipermanentes y monómero formulada para profesionales del nail art. Destaca por sus colecciones de color de alta pigmentación, bond sin ácido y tips dual system, distribuida por Studio Nails.' WHERE name = 'Alondra';

UPDATE brands SET description = 'Marca creada por el nail stylist mexicano Cardone, originario de Ciudad Juárez. Especializada en productos para nail art maximalista, brillos, geles de relieve y elementos 3D — la tendencia "uñas Cardone" suma decenas de millones de vistas en TikTok.' WHERE name = 'Cardone';

UPDATE brands SET description = 'Línea de productos sanitizantes y desinfectantes pensados para el cuidado de uñas y pies. Reconocida en el sector profesional para higienizar piezas de mano, herramientas y superficies en salones y centros de podología.' WHERE name = 'Clear Zal';

UPDATE brands SET description = 'Marca mexicana de productos profesionales para uñas con base en Ciudad de México. Ofrece pinturas y stamping gel, materiales para nail art e impartición de talleres de capacitación.' WHERE name = 'Covett';

UPDATE brands SET description = 'Marca de productos para uñas que ofrece sistemas de gel, esmaltes semipermanentes y accesorios para nail technicians, distribuida por nail shops en México.' WHERE name = 'DNS';

UPDATE brands SET description = 'Solución ácida electrolizada de flujo controlado (SAEFC), dispositivo médico Clase II utilizado por podólogos para limpieza, desinfección y manejo de heridas. Antiséptico y antibiofilm con mínima citotoxicidad a células humanas.' WHERE name = 'Electrobioral';

UPDATE brands SET description = 'Marca reconocida por su catálogo amplio de productos profesionales para la aplicación de uñas: acrílicos, geles, cuidado de cutícula, pinceles, decoración y gel para adherir cristales y pedrería.' WHERE name = 'Exotic';

UPDATE brands SET description = 'Marca mexicana con sede en Culiacán, Sinaloa. Ofrece acrílicos de tonos únicos, geles semipermanentes de brillo intenso, polvos, tips, pinceles y herramientas. Tiene presencia nacional y proyección internacional en Brasil, Colombia, Estados Unidos y Nicaragua.' WHERE name = 'Fantasy Nails';

UPDATE brands SET description = 'Marca especializada en herramientas y materiales para manicuristas, dirigida por Gabo Castro. Tiene presencia en Matamoros, Reynosa, San Luis Potosí, Guanajuato, Puebla y Ciudad de México, entre otros.' WHERE name = 'Gabo Expert Nail System';

UPDATE brands SET description = 'Marca mexicana de productos para uñas con base en Cuernavaca. Ofrece geles de construcción, placas de stamping, accesorios para nail art y productos spa con calidad, precio e innovación como bandera.' WHERE name = 'GMI';

UPDATE brands SET description = 'Marca premium lanzada en 2019, enfocada en colecciones de acrílicos vibrantes y productos completos para profesionales del arte en uñas. Cuenta con amplia presencia en distribuidoras y redes sociales en México.' WHERE name = 'Golden Nails';

UPDATE brands SET description = 'Línea spa para manicura y pedicura con énfasis en productos naturales para el cuidado y nutrición de manos y pies — exfoliantes, mascarillas, cremas y aceites para ritual spa profesional.' WHERE name = 'Hadria Natural Spa';

UPDATE brands SET description = 'Fabricante internacional con más de 14 años de experiencia en esmaltes en gel UV/LED sin HEMA ni TPO. Más de 5,000 colores en catálogo, productos veganos y libres de crueldad animal, distribuidos en más de 30 países.' WHERE name = 'Ice Nova';

UPDATE brands SET description = 'Marca internacional fundada en Ucrania en 2005, distribuida en más de 160 países. Sus esmaltes en gel hipoalergénicos cumplen estándares internacionales (ISO) y fue reconocida en 2020-2021 como Nº 1 mundial en manicura por IPSOS.' WHERE name = 'Kodi';

UPDATE brands SET description = 'Marca dirigida por Liubov Parkhomenko que combina técnicas internacionales de Ucrania con el mercado mexicano. Línea propia y curaduría de marcas premium en alicates, tijeras, empujadores, limas, bases, pigmentos y productos de bioseguridad.' WHERE name = 'Liu Nails';

UPDATE brands SET description = 'Marca de materiales profesionales para diseño de uñas y pedicura, enfocada en proveer al sector materiales de alta calidad y seguros con presencia internacional.' WHERE name = 'Lovely Nails';

UPDATE brands SET description = 'Marca mexicana enfocada en productos premium para nail art profesional: gel paste clear, rubber base en varias tonalidades y materiales para uñas esculturales.' WHERE name = 'Lúa';

UPDATE brands SET description = 'Marca mexicana de productos para uñas con presencia en tiendas online especializadas. Distribuye material profesional para nail tech y busca distribuidores oficiales en territorio nacional.' WHERE name = 'Mahir';

UPDATE brands SET description = 'Línea de productos profesionales para manicura y pedicura — esmaltes semipermanentes, herramientas, geles, acrílicos y accesorios pensados para salones y nail techs.' WHERE name = 'Manikura Pro';

UPDATE brands SET description = 'Marca mexicana premium con kits de polygel, acrílico y esmaltes semipermanentes. Ofrece esmaltes, monómero, cristales, limas y lámparas, además de Academia MC para capacitación profesional.' WHERE name = 'MC';

UPDATE brands SET description = 'Marca mexicana de productos para uñas y servicios profesionales — uñas acrílicas esculturales, press on, polygel semipermanente, nail art y stamping — con presencia en Ciudad de México y Puebla.' WHERE name = 'Mely Nails';

UPDATE brands SET description = 'Marca dedicada a productos profesionales para nail art y técnicos profesionales. Línea de gel shine polish con alta pigmentación, formulada en Francia y fabricada en India, libre de 15 químicos tóxicos y cruelty-free.' WHERE name = 'Miss Nails';

UPDATE brands SET description = 'Marca de gel semipermanente con extensa variedad de colores organizados en gamas alfabéticas (A-Z) y temáticas. Geles UV de 3 pasos con duración de 15-21 días, alta pigmentación y compatibles con uñas naturales, acrílicas o de gel — cruelty free.' WHERE name = 'Mussa';

UPDATE brands SET description = 'Marca de productos para manicura y nail tech con disponibilidad en distribuidoras del sector profesional de uñas en México.' WHERE name = 'Nadigo';

UPDATE brands SET description = 'Línea de productos para uñas pensada para nail technicians profesionales — geles, esmaltes, herramientas y accesorios para salones.' WHERE name = 'Nail Fit';

UPDATE brands SET description = 'Marca mexicana con tienda online en nailtech.mx especializada en herramientas y equipo profesional para manicura y pedicura — pinceles, limas eléctricas, brocas, lámparas y accesorios para nail techs.' WHERE name = 'Nail Tech';

UPDATE brands SET description = 'Fabricante vietnamita de herramientas profesionales para manicura y pedicura — alicates de cutícula, tijeras y pinzas — fabricadas con acero inoxidable grado quirúrgico y afilado manual, reconocidas mundialmente por su calidad y durabilidad.' WHERE name = 'NGHIA';

UPDATE brands SET description = 'Marca alemana líder mundial en cuidado de la piel con más de 100 años de trayectoria. Sus cremas para manos, pies y cutículas son referente para hidratación profunda y cuidado intensivo en spa y uso diario.' WHERE name = 'Nivea';

UPDATE brands SET description = 'Marca mexicana líder en productos y capacitación para aplicación de uñas, con más de 25 años de experiencia. Ofrece geles polimerizados de nueva generación, polvos acrílicos, gel de color, tips, pinceles y monómeros — catálogo desarrollado con conciencia de la salud del aplicador y del cliente.' WHERE name = 'Organic';

UPDATE brands SET description = 'Línea de instrumental podológico para tratamiento profesional de uñas encarnadas, callos y patologías de los pies. Herramientas de acero inoxidable quirúrgico para podología clínica y pedicura especializada.' WHERE name = 'Ortopod';

UPDATE brands SET description = 'Marca de productos para uñas y manicura disponible a través de distribuidoras del sector profesional.' WHERE name = 'Peyco';

UPDATE brands SET description = 'Línea profesional para el cuidado de los pies y podología clínica — productos enfocados en prevención y tratamiento podológico, incluyendo cuidado especializado para pie diabético y problemas dermatológicos comunes.' WHERE name = 'Podocare';

UPDATE brands SET description = 'Marca de productos para uñas y manicura, distribuida por tiendas especializadas del sector profesional.' WHERE name = 'Samia';

UPDATE brands SET description = 'Marca global líder en herramientas profesionales para manicura, pedicura y podología, presente en 90 países. Fabricación con acero inoxidable grado médico y afilado manual que garantiza durabilidad excepcional — operan instalación propia con maquinaria de EE. UU., Alemania, Italia y Japón.' WHERE name = 'Staleks Pro';

UPDATE brands SET description = 'Marca 100% mexicana líder en material para uñas. Outlet más grande de México en productos para nail art — gel pasta para diseños 3D, geles cat eye, polygel, polvos acrílicos, tips, bases y top coats.' WHERE name = 'Studio Nails';

UPDATE brands SET description = 'Empresa mexicana de productos para uñas, microblading, lifting de cejas, pestañas mink, pedicura y maquillaje. Ofrece venta al mayoreo y menudeo con productos demandados a precio competitivo.' WHERE name = 'Sweet';

UPDATE brands SET description = 'Línea de productos especializados en cuidado y salud de los pies recomendada para pie diabético — exfoliantes, hidratantes, cremas antihongos, inhibidores de micosis y productos para combatir mal olor y sudoración excesiva.' WHERE name = 'Tecnipie';

UPDATE brands SET description = 'Marca de puntas y brocas de diamante para limas eléctricas, utilizadas por profesionales para tratamiento de cutículas, retiro de gel/acrílico y trabajo de podología.' WHERE name = 'Timantti';

UPDATE brands SET description = 'Marca mexicana especializada en nail art decorativo — moños, charms, mariposas y formas para uñas esculturales en variedad de colores y diseños.' WHERE name = 'Tuttimani';
