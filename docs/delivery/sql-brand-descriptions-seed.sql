-- Seed de descripciones para las marcas que distribuye Liz Cabriales.
-- Origen mixto: algunas descripciones son copy OFICIAL proporcionado por Liz/las marcas
-- (marcadas con "-- [oficial]") y el resto se recopilaron vía búsquedas web (Google) en junio 2026.
-- Las marcas sin descripción aquí se editan manualmente desde el admin cuando se
-- cuente con información oficial.
--
-- Requiere primero: docs/delivery/sql-brand-description.sql (agrega la columna).
-- Idempotente: corre cuantas veces quieras. Sobrescribe cualquier descripción
-- existente — si tienes descripciones editadas a mano que quieras conservar,
-- comenta los UPDATE correspondientes.

UPDATE brands SET description = 'Marca mexicana especializada en instrumentos profesionales para manicura y pedicura — alicates para cutícula, pedicura y podología — fabricados con acero inoxidable de origen Pakistán y garantía de un año.' WHERE name = 'aashta';

-- [oficial]
UPDATE brands SET description = 'Acry Love es una marca profesional especializada en productos de alta calidad para el cuidado y estilismo de uñas, que incluye polvos acrílicos, monómeros, geles, geles de construcción (rubber) y herramientas de manicura. Se enfoca en ofrecer insumos duraderos y de fácil aplicación para manicuristas profesionales.' WHERE name = 'Acry Love';

-- [oficial]
UPDATE brands SET description = 'Alfatech + es una marca dedicada a la fabricación y comercialización de geles semipermanentes y diferentes productos profesionales para las uñas, como esmaltes en gel, herramientas, artículos de cuidado y limpieza, efectos, entre otros. Su misión es proporcionar productos de la más alta calidad que permitan a los profesionales de la belleza crear obras de arte en cada uña, garantizando durabilidad, brillo y satisfacción total.' WHERE name = 'Alfatech';

UPDATE brands SET description = 'Línea de acrílicos, geles semipermanentes y monómero formulada para profesionales del nail art. Destaca por sus colecciones de color de alta pigmentación, bond sin ácido y tips dual system, distribuida por Studio Nails.' WHERE name = 'Alondra';

UPDATE brands SET description = 'Marca creada por el nail stylist mexicano Cardone, originario de Ciudad Juárez. Especializada en productos para nail art maximalista, brillos, geles de relieve y elementos 3D — la tendencia "uñas Cardone" suma decenas de millones de vistas en TikTok.' WHERE name = 'Cardone';

-- [oficial]
UPDATE brands SET description = 'Clear Zal es una marca de grado clínico especializada en el desarrollo de soluciones avanzadas para el tratamiento, prevención y cuidado integral de las uñas y los pies. La marca se dedica a la fabricación y comercialización de tratamientos antimicrobianos y antifúngicos de amplio espectro, soluciones tópicas concentradas para combatir la onicomicosis, geles queratolíticos para la eliminación de hiperqueratosis y una línea avanzada de higiene diaria que incluye jabones y desodorantes con tecnología de absorción en crema-talco. Su misión es ofrecer fórmulas terapéuticas de la más alta calidad y rápida acción, garantizando la eliminación efectiva de hongos, virus y bacterias para restaurar la salud, fuerza y vitalidad de los pies y las uñas más vulnerables. Combinando potentes activos clínicos como la urea y el ácido salicílico con el poder purificante del aceite de árbol de té y el aloe vera, Clear Zal se ha consolidado como una marca referente, confiable y en constante crecimiento, recomendada por especialistas para el cuidado correctivo y preventivo.' WHERE name = 'Clear Zal';

UPDATE brands SET description = 'Marca mexicana de productos profesionales para uñas con base en Ciudad de México. Ofrece pinturas y stamping gel, materiales para nail art e impartición de talleres de capacitación.' WHERE name = 'Covett';

-- [oficial] DNS / DNF = Dorty Nature Spa
UPDATE brands SET description = 'Dorty Nature Spa es una marca especializada en el desarrollo de sistemas profesionales de pedicure spa, cuidado podológico y bienestar cutáneo, diseñada para salones, cabinas y especialistas que buscan fusionar la alta eficacia técnica con una experiencia sensorial única. Su misión es ofrecer productos y tratamientos de la más alta calidad, garantizando un equilibrio perfecto entre la relajación profunda y la restauración integral de la piel de los pies y las uñas, logrando que cada servicio se convierta en un ritual de salud y confort. Con un enfoque que combina activos botánicos purificantes como el árbol de té con potentes herramientas de pulido y bioseguridad, Dorty Nature Spa se ha consolidado como una marca indispensable y en constante crecimiento para los profesionales que desean elevar el valor de sus servicios de pedicura.' WHERE name = 'DNS';

-- [oficial]
UPDATE brands SET description = 'Electrobioral es una marca de vanguardia clínica especializada en el desarrollo de soluciones antisépticas avanzadas de flujo controlado y mínima citotoxicidad para células humanas. Su misión es ofrecer soluciones biocidas de la más alta calidad y bioseguridad, garantizando una potente acción antibiopelícula que elimina microorganismos patógenos sin dañar los tejidos vivos, facilitando protocolos avanzados como la terapia de irrigación por presión negativa en heridas infectadas. Con un perfil estrictamente clínico y de grado hospitalario, Electrobioral se ha consolidado como una marca indispensable y en constante crecimiento para los especialistas médicos y podológicos que buscan máxima precisión y seguridad en el cuidado de sus pacientes.' WHERE name = 'Electrobioral';

-- [oficial]
UPDATE brands SET description = 'Exotic Nails es una marca de prestigio internacional especializada en el desarrollo de productos e insumos de alta calidad para el esculpido profesional, la decoración avanzada y el acabado de uñas de salón. Su misión es ofrecer herramientas y materiales de rendimiento superior que garantizan una adherencia óptima, facilidad de moldeado y acabados espectaculares, permitiendo a las manicuristas desarrollar estructuras firmes, precisas y diseños con relieves y destellos tridimensionales únicos en mesa. Exotic Nails se ha consolidado como una marca indispensable, versátil y en constante crecimiento para los salones que buscan lujo y vanguardia en cada servicio.' WHERE name = 'Exotic';

-- [oficial]
UPDATE brands SET description = 'Fantasy Nails es una marca profesional de productos para uñas reconocida por su alta calidad y su amplia variedad de insumos para manicure, pedicure y nail art. Es destacada por su excelente pigmentación, adherencia y tecnología. Su misión es hacer que la industria de las uñas sea una profesión más fácil, inspiradora y gratificante, brindando herramientas y productos de la más alta calidad para elevar el nivel y el arte de los técnicos en uñas.' WHERE name = 'Fantasy Nails';

-- [oficial]
UPDATE brands SET description = 'Gabo Expert Nail System es una marca de alta especialidad diseñada estratégicamente para los profesionales exigentes del nail art y la manicura avanzada de salón. Su misión es ofrecer herramientas de la más alta calidad y diseño ergonómico, garantizando la optimización de los tiempos en mesa, el cuidado absoluto de la salud de la uña natural y una total estabilidad en el esculpido tridimensional y estructural. Con un enfoque centrado en la excelencia técnica y el perfeccionamiento de los detalles, Gabo Expert Nail System se ha consolidado como una marca de gran prestigio y en constante crecimiento, convirtiéndose en el aliado indispensable de las manicuristas que buscan elevar sus servicios al estándar de maestría.' WHERE name = 'Gabo Expert Nail System';

UPDATE brands SET description = 'Marca mexicana de productos para uñas con base en Cuernavaca. Ofrece geles de construcción, placas de stamping, accesorios para nail art y productos spa con calidad, precio e innovación como bandera.' WHERE name = 'GMI';

UPDATE brands SET description = 'Marca premium lanzada en 2019, enfocada en colecciones de acrílicos vibrantes y productos completos para profesionales del arte en uñas. Cuenta con amplia presencia en distribuidoras y redes sociales en México.' WHERE name = 'Golden Nails';

-- [oficial]
UPDATE brands SET description = 'Hadria Natural Spa es una marca innovadora especializada en el desarrollo de soluciones profesionales para el cuidado podológico avanzado, la bioseguridad de cabina y el bienestar terapéutico muscular. La marca se dedica a la fabricación y comercialización de bálsamos y geles altamente hidratantes adicionados con urea para el control de la hiperqueratosis, exfoliantes plantares reparadores con parafina de fórmula sin enjuague, auxiliares relajantes de hielo mineral, así como una avanzada línea de soluciones antisépticas y espumas limpiadoras formuladas con tecnología de superoxidación, plata ionizada y extractos herbales como el árbol de té. Su misión es ofrecer productos de alto rendimiento que garanticen una desinfección y esterilización de espectro clínico sin descuidar la regeneración y el confort de las pieles extremadamente secas o agrietadas. Combinando el poder protector de la plata ionizada con activos humectantes y reblandecedores de última generación, Hadria Natural Spa se ha consolidado como una marca referente y en constante crecimiento para los especialistas que buscan elevar el estándar de higiene, salud y suavidad en cada tratamiento.' WHERE name = 'Hadria Natural Spa';

UPDATE brands SET description = 'Fabricante internacional con más de 14 años de experiencia en esmaltes en gel UV/LED sin HEMA ni TPO. Más de 5,000 colores en catálogo, productos veganos y libres de crueldad animal, distribuidos en más de 30 países.' WHERE name = 'Ice Nova';

UPDATE brands SET description = 'Marca internacional fundada en Ucrania en 2005, distribuida en más de 160 países. Sus esmaltes en gel hipoalergénicos cumplen estándares internacionales (ISO) y fue reconocida en 2020-2021 como Nº 1 mundial en manicura por IPSOS.' WHERE name = 'Kodi';

UPDATE brands SET description = 'Marca dirigida por Liubov Parkhomenko que combina técnicas internacionales de Ucrania con el mercado mexicano. Línea propia y curaduría de marcas premium en alicates, tijeras, empujadores, limas, bases, pigmentos y productos de bioseguridad.' WHERE name = 'Liu Nails';

-- [oficial]
UPDATE brands SET description = 'Lovely es una marca de productos para uñas reconocida por su calidad premium. Su catálogo está diseñado para manicuristas y salones que buscan materiales confiables, duraderos y de alto desempeño en cada aplicación.' WHERE name = 'Lovely Nails';

-- [oficial]
UPDATE brands SET description = 'Lúa by Jennifer Preciado es una marca de alta gama especializada en el desarrollo de geles de arte avanzado, herramientas de precisión y sistemas de decoración para el nail art de alta definición. Su misión es ofrecer insumos artísticos de la más alta calidad y fidelidad de color, garantizando una cobertura excelente desde la primera capa y una total estabilidad en los trazos para que las manicuristas y salones puedan plasmar diseños de mano alzada con total libertad y un acabado impecable. Con un catálogo minuciosamente diseñado bajo el respaldo de una firma experta, Lúa by Jennifer Preciado se ha consolidado como una marca de gran prestigio y en constante crecimiento, convirtiéndose en la aliada indispensable de las artistas de las uñas que buscan la excelencia en el detalle.' WHERE name = 'Lúa';

UPDATE brands SET description = 'Marca mexicana de productos para uñas con presencia en tiendas online especializadas. Distribuye material profesional para nail tech y busca distribuidores oficiales en territorio nacional.' WHERE name = 'Mahir';

UPDATE brands SET description = 'Línea de productos profesionales para manicura y pedicura — esmaltes semipermanentes, herramientas, geles, acrílicos y accesorios pensados para salones y nail techs.' WHERE name = 'Manikura Pro';

UPDATE brands SET description = 'Marca mexicana premium con kits de polygel, acrílico y esmaltes semipermanentes. Ofrece esmaltes, monómero, cristales, limas y lámparas, además de Academia MC para capacitación profesional.' WHERE name = 'MC';

UPDATE brands SET description = 'Marca mexicana de productos para uñas y servicios profesionales — uñas acrílicas esculturales, press on, polygel semipermanente, nail art y stamping — con presencia en Ciudad de México y Puebla.' WHERE name = 'Mely Nails';

-- [oficial]
UPDATE brands SET description = 'Miss Nails es una marca especializada en productos profesionales para uñas de última tendencia, diseñada para manicuristas y salones que buscan innovación y resultados de alto impacto. La marca se dedica a la fabricación y comercialización de acrílicos de cobertura absoluta, sistemas Rubber y polygeles, una impresionante variedad de efectos tridimensionales y geles magnéticos Cat Eye, además de pinceles de alta precisión, tips estructurales y artículos de bioseguridad. Su misión es ofrecer herramientas y productos de la más alta calidad, garantizando la máxima durabilidad, un brillo superior y la total libertad creativa para que cada aplicación se convierta en una verdadera obra de arte. Con un catálogo dinámico y soluciones de grado clínico para el cuidado de la piel, Miss Nails se ha consolidado como la marca aliada y en constante crecimiento para los profesionales del diseño de uñas más exigentes.' WHERE name = 'Miss Nails';

UPDATE brands SET description = 'Marca de gel semipermanente con extensa variedad de colores organizados en gamas alfabéticas (A-Z) y temáticas. Geles UV de 3 pasos con duración de 15-21 días, alta pigmentación y compatibles con uñas naturales, acrílicas o de gel — cruelty free.' WHERE name = 'Mussa';

-- [oficial]
UPDATE brands SET description = 'Nadigo es una marca de alta gama especializada en el diseño y desarrollo de sistemas de soporte estructural para el esculpido de uñas, respaldada por el Master Maximiliano Cortez. La marca se dedica a la comercialización de formas esculturales profesionales de calidad superior, creadas estratégicamente con la rigidez, adherencia y líneas de guía exactas que exigen las estructuras más vanguardistas del mercado. Con un enfoque centrado en el rendimiento técnico y los estándares de nivel de competencia, Nadigo se ha consolidado como una marca de gran exclusividad y en constante crecimiento, convirtiéndose en el aliado de alta gama indispensable para los profesionales que buscan la perfección en cada estructura.' WHERE name = 'Nadigo';

UPDATE brands SET description = 'Línea de productos para uñas pensada para nail technicians profesionales — geles, esmaltes, herramientas y accesorios para salones.' WHERE name = 'Nail Fit';

UPDATE brands SET description = 'Marca mexicana con tienda online en nailtech.mx especializada en herramientas y equipo profesional para manicura y pedicura — pinceles, limas eléctricas, brocas, lámparas y accesorios para nail techs.' WHERE name = 'Nail Tech';

-- [oficial]
UPDATE brands SET description = 'NGHIA es una marca reconocida internacionalmente por su precisión, durabilidad y diseño ergonómico. Ofrece herramientas de manicura y pedicura de alto rendimiento como alicates, cortaúñas, tijeras y accesorios especializados fabricados con acero inoxidable de primera calidad para garantizar cortes limpios, seguros y de larga vida útil. Su misión es ofrecer una gama de herramientas para uñas que cumplen y superan sistemáticamente los estándares internacionales.' WHERE name = 'NGHIA';

UPDATE brands SET description = 'Marca alemana líder mundial en cuidado de la piel con más de 100 años de trayectoria. Sus cremas para manos, pies y cutículas son referente para hidratación profunda y cuidado intensivo en spa y uso diario.' WHERE name = 'Nivea';

UPDATE brands SET description = 'Marca mexicana líder en productos y capacitación para aplicación de uñas, con más de 25 años de experiencia. Ofrece geles polimerizados de nueva generación, polvos acrílicos, gel de color, tips, pinceles y monómeros — catálogo desarrollado con conciencia de la salud del aplicador y del cliente.' WHERE name = 'Organic';

UPDATE brands SET description = 'Línea de instrumental podológico para tratamiento profesional de uñas encarnadas, callos y patologías de los pies. Herramientas de acero inoxidable quirúrgico para podología clínica y pedicura especializada.' WHERE name = 'Ortopod';

-- [oficial]
UPDATE brands SET description = 'Peyco es una marca especializada en el desarrollo de soluciones funcionales para el cuidado diario, la higiene y la protección de los pies, diseñada para profesionales y clientes que buscan una prevención efectiva y un confort inmediato. Su misión es ofrecer productos de la más alta calidad y uso práctico diario, garantizando una protección integral contra bacterias y hongos, el control efectivo de la sudoración y una hidratación profunda que devuelve la tersura a la piel. Con un enfoque centrado en la bioseguridad del día a día y el cuidado preventivo, Peyco se ha consolidado como una marca sumamente confiable y en constante crecimiento dentro del sector del bienestar y la salud podológica.' WHERE name = 'Peyco';

-- [oficial]
UPDATE brands SET description = 'Podocare es una marca líder y de grado clínico, desarrollada especialmente para cubrir las altas exigencias de podólogos, quiropodistas y especialistas en estética ungueal avanzada. Su catálogo destaca por fusionar de manera perfecta la salud médica con la estética, ofreciendo soluciones de alta eficacia para el trabajo diario en cabina. Desde potentes agentes químicos y queratolíticos de uso exclusivo en consultorio, hasta tratamientos estéticos con activos encapsulados y esmaltes adicionados con antifúngicos, cada producto de Podocare está formulado bajo los más estrictos estándares de calidad. Es la marca aliada indispensable para los profesionales que buscan garantizar procedimientos seguros, acelerar la recuperación de sus pacientes y ofrecer resultados impecables que combinan belleza, alivio y bienestar desde la primera aplicación.' WHERE name = 'Podocare';

-- [oficial]
UPDATE brands SET description = 'Samia es una marca prémium de alta especialidad en herramientas para el esculpido de uñas, respaldada por la experiencia y firma del reconocido Master Maximiliano Cortez. Su misión es ofrecer herramientas profesionales de la más alta gama, garantizando un control absoluto del producto, un manejo fluido del acrílico y la máxima durabilidad en el uso diario para que los salones y manicuristas logren estructuras perfectas y acabados de nivel de competencia. Con un enfoque en la excelencia de sus cerdas y el diseño ergonómico de su línea, Samia se ha consolidado como una marca de gran estatus y en constante crecimiento, convirtiéndose en el aliado imprescindible de las profesionales que buscan el estándar de calidad de un gran master.' WHERE name = 'Samia';

UPDATE brands SET description = 'Marca global líder en herramientas profesionales para manicura, pedicura y podología, presente en 90 países. Fabricación con acero inoxidable grado médico y afilado manual que garantiza durabilidad excepcional — operan instalación propia con maquinaria de EE. UU., Alemania, Italia y Japón.' WHERE name = 'Staleks Pro';

UPDATE brands SET description = 'Marca 100% mexicana líder en material para uñas. Outlet más grande de México en productos para nail art — gel pasta para diseños 3D, geles cat eye, polygel, polvos acrílicos, tips, bases y top coats.' WHERE name = 'Studio Nails';

UPDATE brands SET description = 'Empresa mexicana de productos para uñas, microblading, lifting de cejas, pestañas mink, pedicura y maquillaje. Ofrece venta al mayoreo y menudeo con productos demandados a precio competitivo.' WHERE name = 'Sweet';

UPDATE brands SET description = 'Línea de productos especializados en cuidado y salud de los pies recomendada para pie diabético — exfoliantes, hidratantes, cremas antihongos, inhibidores de micosis y productos para combatir mal olor y sudoración excesiva.' WHERE name = 'Tecnipie';

-- [oficial]
UPDATE brands SET description = 'Timantti Nail''s es una reconocida marca y academia especializada en productos de nail art y manicura premium. Es muy valorada por su estilo innovador, destacando por su amplia línea de productos de alta pigmentación, ideal para crear diseños detallados.' WHERE name = 'Timantti';

UPDATE brands SET description = 'Marca mexicana especializada en nail art decorativo — moños, charms, mariposas y formas para uñas esculturales en variedad de colores y diseños.' WHERE name = 'Tuttimani';

-- [oficial] Natyra Lab: marca aún pendiente de darse de alta ("Falta"). Si el brand
-- todavía no existe en la tabla, este UPDATE afecta 0 filas (no-op) — vuelve a correrlo
-- una vez creada la marca. Ajusta el name si se registra con otra variante.
UPDATE brands SET description = 'Natyra Lab está especializado en el desarrollo de soluciones dermatológicas y podológicas de alta eficacia. Diseñada para cubrir las exigencias de la cabina profesional y el cuidado diario en casa, la marca combina la potencia de activos clínicos con el cuidado regenerador del colágeno, la elastina y el ácido hialurónico. Desde potentes geles queratolíticos para tratamientos correctivos, hasta espumas limpiadoras y cremas reparadoras para pieles con tendencia atópica, Natyra Lab es el aliado perfecto para los especialistas que buscan resultados visibles, bioseguridad y el máximo confort para sus pacientes.' WHERE name = 'Natyra Lab';
