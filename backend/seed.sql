-- Carga inicial de restaurantes Montevideo
INSERT INTO restaurants (name, description, phone, email, address, latitude, longitude, seats_total)
VALUES
--Carrasco
('Alquimista', 'Restaurante de cocina contemporánea con productos locales', ' 2604 6060', 'reservations.montevideo@sofitel.com', 'Rbla. República de México 6451, Carrasco', -34.89442013073417, -56.062978943054446, 80),
('Café Misterio', 'Restaurante de cocina internacional y sushi', ' 2604 0323', 'info@cafemisterio.com.uy', 'Arocena 1660, Carrasco', -34.88576123675539, -56.05679681046946, 60),
('Charo', 'Restaurante de cocina de autor y café de especialidad', ' 097 096 409', 'reservas@charo.com.uy', 'Rambla República de México 6363, Carrasco', -34.8923800872613, -56.05774817079288, 60),
('Casa Magnum', 'Restaurante de especialidad en sushi, parrilla y tragos de autor', ' 093 771 234', 'casacarrasco@bemagnum.com', 'Av. Alfredo Arocena 2098, Carrasco', -34.87980623700574, -56.062954460560135, 300),
('La Casa Violeta', 'Cocina multicultural con énfasis en parrilla, pescados y mariscos', ' 2603 0367', 'lacasavioletacarrasco@gmail.com', 'Av. Bolivia 1271, Carrasco', -34.89516527647504, -56.06059598445258, 100),
('García Carrasco', 'Parrilla clásica con amplia selección de vinos', ' 2600 2703', 'reservas@garcia.com.uy', 'Av. Alfredo Arocena 1587, Carrasco', -34.889386130286155, -56.05712371563873, 120),
('Tintos & Rubias Carrasco', 'Parrillada tradicional con opciones de pastas y comida rápida', ' 2600 1514', 'tintosyrubiascarrasco@gmail.com', 'Av. Bolivia 1505 esq. Pablo Podestá, Carrasco', -34.892457478324914, -56.068667582846, 80),
('Manzanar', 'Restaurante de productos locales y técnicas de fuego', ' 095 121 925', 'reservas@manzanar.com.uy', 'Carlos Federico Sáez 6463, Carrasco', -34.88990682418309, -56.055942293926904, 70),
('La Panera Rosa', 'Cafetería y restaurante con opciones de brunch y pastelería', ' 2600 5678', 'reservas@lapanerarosa.com.uy', 'Av. Alfredo Arocena 1600, Carrasco', -34.88884729466731, -56.05741136600162, 60),
('El Puesto', 'Restaurante con enfoque en productos locales', ' 2600 7890', 'contacto@elpuesto.com.uy', 'Av. Alfredo Arocena 1700, Carrasco', -34.88725366066948, -56.058858643095235, 50),
('Cantina Rostand', 'Restaurante de cocina tradicional', ' 2600 3456', 'reservas@cantinarostand.com.uy', 'Av. Alfredo Arocena 1800, Carrasco', -34.88978378521479, -56.05568537122473, 70),
('Lo de Marcos', 'Restaurante de cocina internacional', ' 2600 2345', 'contacto@lodemarcos.com.uy', 'Av. Alfredo Arocena 1900, Carrasco', -34.88127289174737, -56.061001228764646, 65),
('Lombardía', 'Restaurante italiano con especialidad en pastas caseras', ' 2600 4567', 'reservas@lombardia.com.uy', 'Av. Alfredo Arocena 2000, Carrasco', -34.88416917390879, -56.05933189430872, 80),
('RIO Café Restaurant', 'Restaurante de cocina contemporánea', ' 2600 6789', 'contacto@riocafe.com.uy', 'Carlos Federico Sáez 6430, Carrasco', -34.890599994594254, -56.05693737855821, 75),


--Cordón

('Café Gourmand', 'Café francés con panadería y brunch', ' 2411 2796', 'info@cafegourmand.com.uy', 'Constituyente 1869, Cordón', -34.90792187207235, -56.17257292323629, 40),
('Escaramuza', 'Café-librería con cocina de autor', ' 2400 4771', 'contacto@escaramuza.com.uy', 'Dr. Pablo de María 1185, Cordón', -34.90652951460496, -56.17100344760287, 50),
('Bakers Bar', 'Bar de cócteles y tapas', ' 2400 1234', 'info@bakersbar.com.uy', 'Pablo de María 1198, Cordón', -34.90629246860633, -56.17076642737618, 35),
('Obrador Social Club', 'Café y panadería artesanal', ' 097 654 321', 'obrador@socialclub.com.uy', 'Pablo de María 1151, Cordón', -34.91271509204677, -56.17040403139753, 40),
('SU Bar', 'Bar con cocina en constante movimiento', ' 090 987 654', 'reservas@subar.com.uy', 'Pablo de María 1151, Cordón', -34.908266715226475, -56.17319719470077, 45),
('La Guinda', 'Restaurante con platos innovadores y coctelería', ' 099 123 456', 'contacto@laguinda.com.uy', 'Maldonado 1234, Cordón', -34.90819944255477, -56.17230755320048, 45),
('Plaza de Chueca', 'Bar de tapas', ' 098 765 432', 'info@plazachueca.com.uy', 'Maldonado 2051, Cordón', -34.90805052514096, -56.17037585156764, 50),
('El Rastro Parrillita', 'Parrillada tradicional uruguaya', ' 096 543 210', 'reservas@elrastro.com.uy', 'Colonia 1758, Cordón', -34.90553613597807, -56.17448024291532, 60),
('Uno Catorce Café', 'Cafetería con opciones de brunch y pastelería', ' 095 432 109', 'contacto@114cafe.com.uy', 'Constituyente 1866, Cordón', -34.90596120749226, -56.1697796721142, 35),
('Paraíso Café', 'Cafetería con ambiente estético y sabores únicos', ' 094 321 098', 'hola@paraisocafe.com.uy', 'Constituyente 1866, Cordón', -34.907043053761484, -56.176066897224466, 30),
('Acevedo', 'Panadería y dulcería artesanal', ' 091 098 765', 'hola@acevedo.com.uy', 'Durazno 1914, Cordón', -34.90978076179937, -56.17376427456933, 25),


--Buceo

('El Tío Bistró', 'Restaurante bistronómico con cocina gourmet', ' 092 070 792', 'reservas@eltiobistro.com.uy', 'Rizal 3764, Buceo', -34.901238534969494, -56.13201270213392, 60),
('Hard Rock Café Montevideo', 'Restaurante temático de cocina americana', ' 2628 1234', 'info@hardrockcafe.com.uy', 'Rambla Armenia 1624, Buceo', -34.90989691004047, -56.133437849823345, 120),
('Ramona WTC', 'Cafetería libre de gluten, opciones vegetarianas y veganas', ' 2623 6228', 'contacto@ramonacafe.com.uy', 'Luis Alberto de Herrera 1196, Buceo', -34.905903638016255, -56.13658930752051, 40),
('La Vaca Parrilla', 'Parrillada tradicional uruguaya', ' 2622 4567', 'contacto@lavacaparrilla.com.uy', 'Blvr. 26 de Marzo 3572, Buceo', -34.90557556729951, -56.135133012264795, 80),
('Yacht Club Uruguayo', 'Restaurante especializado en cocina marina', ' 2622 1234', 'restaurante@ycu.org.uy', 'Edificio del Yacht Club, Avenida, Buceo', -34.909869482160566, -56.1310346494953, 70),
('El Italiano', 'Restaurante de cocina italiana', ' 2623 4567', 'info@elitaliano.com.uy', 'Av. Prof. Dr. Euclides Peluffo, Buceo', -34.91052048469728, -56.1332165349616, 90),
('Sudestada', 'Restaurante de cocina internacional', ' 2622 7890', 'reservas@sudestada.com.uy', '3VW7+PR4, Dr. Luis Bonavita 1315, Buceo', -34.90317111967197, -56.135329609301294, 85),
('La Fonda del Buceo', 'Restaurante con opciones vegetarianas', ' 2622 6789', 'info@lafondadelbuceo.com.uy', 'Av. Luis Alberto de Herrera 1132, Buceo', -34.907246680043485, -56.13612292480013, 50),


--Malvin

('Soprano Malvín', 'Parrillada y pizzería tradicional', ' 2619 4691', 'sopranosmalvin@gmail.com', 'Río de la Plata 1395, Malvín', -34.89588365487287, -56.102172707653104, 80),
('La Trillada', 'Parrillada con opciones variadas', ' 2614 1171', 'latrillada@gmail.com', 'Orinoco 5088, Malvín', -34.89597737158844, -56.09877659001324, 60),
('Decano Restaurante', 'Parrillada y pizzería', ' 2614 1171', 'decanorestaurante@gmail.com', 'Orinoco 5041, Malvín', -34.895757698038096, -56.09984645778727, 70),
('Bar Michigan', 'Parrillada, pizza y platos de cocina internacional', ' 2613 6945', 'barmichigan@gmail.com', 'Amazonas 1407 esquina Orinoco, Malvín', -34.8956256829962, -56.10108419532909, 75),
('Salmuera Café Bistró', 'Café bistró, especializado en carnes y pescados', ' 2619 1234', 'contacto@salmuera.com.uy', 'Rambla O Higgins 1234, Malvín', -34.896474316845406, -56.10442217567472, 50),
('Hong Kong Malvín', 'Restaurante de cocina asiática', ' 2619 6168', 'hongkongmalvin@gmail.com', 'Río de la Plata 11400, Malvín', -34.895567299245755, -56.10218500820843, 60),
('La Nueva Pascale', 'Parrillada y pizzería', ' 2619 6789', 'lanuevapascale@gmail.com', '4V5M+X7R, Dalmiro Costa, Malvín', -34.89000910957944, -56.11695197481631, 65),
('Club La Isla', 'Restaurante con menú variado y parrilla', ' 2619 7890', 'clublaisla@gmail.com', 'Michigan 1359, Malvín', -34.89693933578369, -56.10010594024407, 70),

--Punta Carretas

('La Chingada Cantina', 'Restaurante de cocina mexicana y española', ' 2710 5678', 'reservas@lachingada.com.uy', 'Coronel Mora 549, Punta Carretas', -34.91966854591986, -56.158565384497656, 50),
('Pellegrin', 'Restaurante de cocina italiana', ' 2711 6789', 'info@pellegrin.com.uy', 'Gregorio Suárez 2734, Punta Carretas', -34.91844643066701, -56.15978850113118, 60),
('Bar Tabaré', 'Restaurante de cocina uruguaya con parrilla', ' 2712 3456', 'contacto@bartabare.com.uy', 'Zorrilla de San Martín 93, Punta Carretas', -34.926842996379385, -56.15985080674639, 70),
('Casa Magnum Punta Carretas', 'Restaurante con especialidad en sushi, ceviches y hamburguesas', ' 093 771 234', 'puntacarretas@bemagnum.com', 'García Cortinas 2466, Punta Carretas', -34.92548471133678, -56.158253384905926, 80),
('García Punta Carretas', 'Parrilla clásica rioplatense', ' 2712 0080', 'reservas@garcia.com.uy', 'Guipúzcoa 331, Punta Carretas', -34.92488802692423, -56.15713436716594, 100),
('Francis Punta Carretas', 'Restaurante de cocina internacional', ' 2711 8603', 'reservas@francis.com.uy', 'Luis de la Torre 502, Punta Carretas', -34.919423495870205, -56.159930132715346, 90),
('La Perdiz', 'Parrillada y restaurante de cocina uruguaya', ' 2711 8963', 'info@laperdiz.com.uy', 'Guipúzcoa 350, Punta Carretas', -34.92491038648935, -56.156891094687005, 85),
('La Estacada', 'Restaurante de cocina uruguaya con parrilla', ' 2712 3457', 'reservas@laestacada.com.uy', 'Vehicular Peatonal, Punta Carretas', -34.93359935820077, -56.160981520095284, 70),
('Bar Seven', 'Bar con menú variado y especialidad en tragos', ' 2712 4567', 'contacto@barseven.com.uy', 'Bonpland 503, Punta Carretas', -34.91823927175164, -56.16179089089971, 60),


--Pocitos

('Fellini Pocitos', 'Restaurante de cocina italiana e internacional', ' 2706 9252', 'reservas@fellinipocitos.com.uy', 'José Martí 3408 esq. Benito Blanco, Pocitos', -34.91331258143119, -56.14840599415937, 70),
('Carbonada', 'Restaurante de cocina uruguaya con enfoque en carnes', ' 2711 5678', 'info@carbonada.com.uy', 'Francisco Muñoz 3100 esq. Lorenzo Pérez, Pocitos', -34.90547252078274, -56.14765801147474, 60),
('Tandory', 'Restaurante de cocina fusión asiática y europea', ' 2709 6616', 'contacto@tandory.com.uy', 'Libertad 2851 esq. Ramón Masini, Pocitos', -34.90762266329964, -56.152354199982895, 50),
('Tintos & Rubias Pocitos', 'Parrillada tradicional con opciones de pastas y comida rápida', ' 2712 3193', 'tintosyrubiaspocitos@gmail.com', 'Pedro Berro 797 esq. Jaime Zudañez, Pocitos', -34.91639559546051, -56.15330634339343, 70),
('Expreso Pocitos', 'Café y bar tradicional', ' 2711 2345', 'expresopocitos@gmail.com', 'Benito Blanco 1051, Pocitos', -34.91400642788302, -56.14915312101253, 40),
('La Commedia', 'Restaurante de cocina italiana', ' 2710 6789', 'info@lacommédia.com.uy', 'El Viejo Pancho 2414, Pocitos', -34.91037744989042, -56.161376313054156, 60),
('Bruta', 'Restaurante de cocina uruguaya contemporánea', ' 2712 3456', 'reservas@bruta.com.uy', 'Luis de la Torre 818, Pocitos', -34.91586299431301, -56.155990224116074, 55),
('Milajó', 'Restaurante de cocina mediterránea con opciones vegetarianas', ' 2711 7890', 'contacto@milajo.com.uy', 'Libertad 2919, Pocitos', -34.907040007771336, -56.15102453507612, 50),
('La Giraldita', 'Restaurante de cocina uruguaya', ' 2710 4567', 'lagiraldita@gmail.com', 'José Benito Lamas 2745, Pocitos', -34.91183043284615, -56.157429508495014, 45),
('Pistatxofusión', 'Restaurante de cocina vasca', ' 2712 8901', 'info@pistatxofusion.com.uy', 'Juan Pablo Laguna 3351, Pocitos', -34.90347896698802, -56.14177498220773, 50),


--Centro

('El Fogón', 'Parrillada tradicional uruguaya, mariscos y pastas artesanales', ' 2900 0900', 'reservas@elfogon.com.uy', 'San José 1080, Centro', -34.907042404979215, -56.19282122796968, 110),
('Bar Facal', 'Café y restaurante histórico con espectáculos de tango', ' 2908 7741', 'contacto@facal.com.uy', 'Av. 18 de Julio 1249, Centro', -34.90565004950859, -56.18924975625233, 80),
('TANNAT Restaurant', 'Restaurante de cocina contemporánea, pastas caseras y mariscos', ' 2903 4806', 'contacto@tannat.com.uy', 'San José 1065, Centro', -34.90695240206136, -56.193153823478994, 60),
('Danubio Azul', 'Restaurante de cocina internacional', ' 2901 2345', 'info@danubioazul.com.uy', 'Colonia 1234, Centro', -34.90540192356247, -56.1986977789137, 70),
('Verne Business Café', 'Café moderno con opciones de brunch', ' 2902 3456', 'contacto@vernebusinesscafe.com.uy', 'Río Negro 1246, Centro', -34.90810040621714, -56.19325135670782, 40),
('Pacharán', 'Taberna vasca con platos tradicionales', ' 2902 3456', 'reservas@pacharan.com.uy', 'San José 1168 primer piso, Centro', -34.90694081842288, -56.190867465186464, 60),
('Oro del Rhin Café', 'Confitería especializada en repostería alemana', ' 2900 4567', 'contacto@orodelrhin.com.uy', 'Colonia 897, Centro', -34.90528324840127, -56.19722305785148, 40),
('Flora', 'Café y brunch con opciones vegetarianas', ' 092 109 876', 'contacto@flora.com.uy', 'Canelones 892, Centro', -34.90922738218145, -56.196788175915316, 50),

--Ciudad Vieja

('Álvarez Bar', 'Restaurante de cocina casera, pizzas al horno de leña', ' 2901 2345', 'contacto@alvarezbar.com.uy', 'Calle Perez Castellano 1404, Ciudad Vieja', -34.90818738526739, -56.21013131419311, 50),
('Primuseum', 'Restaurante de cocina latina e internacional', ' 2916 1234', 'reservas@primuseum.com.uy', 'Pérez Castellano 1385, Ciudad Vieja', -34.908496620876456, -56.21022036666324, 90),
('El Palenque', 'Parrillada clásica uruguaya', ' 2917 0190', 'info@elpalenque.com.uy', 'Pérez Castellano 1579, Ciudad Vieja', -34.9056519949191, -56.211475843831074, 120),
('Jacinto', 'Restaurante y café con panadería propia', ' 2915 1234', 'contacto@jacinto.com.uy', 'Sarandí 349, Ciudad Vieja', -34.90840672541783, -56.207954588618506, 70),
('Es Mercat', 'Restaurante especializado en pescados y mariscos', ' 2915 1235', 'contacto@esmercat.com.uy', 'Colón 1550, Ciudad Vieja', -34.90556492808442, -56.2101718887297, 60),
('El Chipirón', 'Marisquería con enfoque en pescados a la plancha', ' 2915 1236', 'info@elchipiron.com.uy', 'Piedras 206, Ciudad Vieja', -34.906407214121714, -56.21200605374478, 50),
('La Fonda', 'Restaurante de cocina casera, opciones vegetarianas y veganas', ' 2915 1237', 'reservas@lafonda.com.uy', 'Calle Perez Castellano 1422, Ciudad Vieja', -34.907923471212385, -56.210312328809465, 45),
('Estrecho', 'Restaurante de cocina contemporánea', ' 2915 1238', 'contacto@estrecho.com.uy', 'Sarandí 460, Ciudad Vieja', -34.90802190129123, -56.20660272313175, 40),
('El Otro Es Mercat', 'Bar de tapas con énfasis en productos del mar', ' 2914 7078', 'info@elotroesmercat.com.uy', 'Pérez Castellano 1526, Ciudad Vieja', -34.906328619887, -56.21108999880836, 55),
('Cabaña Verónica', 'Parrillada tradicional uruguaya', ' 2915 1901', 'reservas@cabanaveronica.com.uy', 'Mercado del Puerto, local 038, Ciudad Vieja', -34.90569072870049, -56.21192089068591, 100),
('Café Brasilero', 'Café histórico fundado en 1877', ' 2915 1239', 'info@cafebrasilero.com.uy', 'Ituzaingó 1447, Ciudad Vieja', -34.90568816837643, -56.20466898196364, 35),
('Las Misiones', 'Restaurante clásico', ' 2915 1240', 'contacto@lasmisiones.com.uy', '25 de Mayo 449, Ciudad Vieja', -34.90620746427034, -56.206881541669226, 60),


--Parque Rodo

('Club del Pan', 'Panadería artesanal y cafetería', ' 2400 5678', 'contacto@clubdelpan.com.uy', 'Av. Gonzalo Ramírez 1485, Parque Rodó', -34.91249591428441, -56.183057142673036, 30),
('De Morondanga', 'Restaurante de cocina casera y vegetariana', ' 2401 2345', 'info@demorondanga.com.uy', 'Charrúa 2295, Parque Rodó', -34.90564073776856, -56.16517893216621, 45),
('La Milpa Taquería', 'Restaurante mexicano especializado en tacos', ' 2403 9845', 'contacto@lataqueria.com.uy', 'Chaná 2120, Parque Rodó', -34.904205595870685, -56.17069284949281, 40),
('Casa Fauno', 'Restaurante de tapas y cocina de autor', ' 94 620 925', 'info@casafauno.com.uy', 'Luis Piera 2031, Parque Rodó', -34.913135517193034, -56.17071523320299, 50),
('Oriundo', 'Wine bar contemporáneo con cocina de autor', ' 2418 5404', 'contacto@oriundo.uy', 'Pablo de María 1013, Parque Rodó', -34.910464033012005, -56.17055442822713, 60),
('Francachela', 'Parrilla y restaurante', ' 093 456 789', 'francachela@gmail.com', 'Acevedo Díaz 1055, Parque Rodó', -34.90901580211379, -56.166091014312755, 70),
('PyG Bar', 'Restaurante con vista al mar', ' 091 234 567', 'reservas@pygbar.com.uy', 'Rambla Wilson 2133, Parque Rodó', -34.91741586656045, -56.16881626169806, 80),
('Puesta del Sol', 'Restaurante con especialidad en pescados y mariscos', ' 093 389 549', 'info@puestadelsol.com.uy', 'Rambla Wilson 426, Parque Rodó', -34.92024435200398, -56.17211543053861, 90),
('Sucré Salé', 'Restaurante de cocina francesa', ' 2401 4284', 'contacto@sucre-sale.com.uy', 'Bulevar Artigas 1271, Parque Rodó', -34.905089766132754, -56.16409065743549, 40),
('La Guinda', 'Restaurante de cocina de autor y coctelería', ' 099 123 456', 'contacto@laguinda.com.uy', 'Maldonado 1983, Parque Rodó', -34.90820687405976, -56.172306900207744, 45);

-- Add example restaurant users
INSERT INTO users (email, password, name, role, restaurant_id) VALUES
('restaurant1@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Alquimista', 'restaurant', 1),
('restaurant2@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Café Misterio', 'restaurant', 2),
('restaurant3@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Charo', 'restaurant', 3);

-- Add example customer users
INSERT INTO users (email, password, name, role) VALUES
('cliente1@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Cliente Uno', 'customer'),
('cliente2@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Cliente Dos', 'customer'),
('cliente3@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Cliente Tres', 'customer'),
('cliente4@example.com', '$2b$10$IyzmsvWiKGPZTuzFUmMcbeiDg1O7QmmW54nUgacDfqd4hKMcbWtHm', 'Cliente Cuatro', 'customer');

-- Add example reservations
-- Assuming restaurant users are IDs 1, 2, 3
-- Assuming new customer users will get IDs 4, 5, 6, 7
INSERT INTO reservations (user_id, restaurant_id, reservation_at, requested_guests, guests, status) VALUES
(4, 1, NOW() + INTERVAL '1 day', 4, 4, 'pending'),       -- Cliente Uno en Alquimista
(5, 1, NOW() + INTERVAL '2 days', 2, 2, 'pending'),       -- Cliente Dos en Alquimista
(6, 2, NOW() + INTERVAL '1 day', 6, 6, 'pending'),       -- Cliente Tres en Café Misterio
(7, 3, NOW() + INTERVAL '3 days', 4, 4, 'pending');      -- Cliente Cuatro en Charo

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurant_tags (
    restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, tag_id)
);


--Filtro por barrios:
-- Carrasco
UPDATE restaurants SET neighborhood = 'Carrasco' WHERE name IN (
  'Alquimista', 'Café Misterio', 'Charo', 'Casa Magnum', 'La Casa Violeta',
  'García Carrasco', 'Tintos & Rubias Carrasco', 'Manzanar', 'La Panera Rosa',
  'El Puesto', 'Cantina Rostand', 'Lo de Marcos', 'Lombardía', 'RIO Café Restaurant'
);

-- Cordón
UPDATE restaurants SET neighborhood = 'Cordón' WHERE name IN (
  'Café Gourmand', 'Escaramuza', 'Bakers Bar', 'Obrador Social Club', 'SU Bar',
  'La Guinda', 'Plaza de Chueca', 'El Rastro Parrillita', 'Uno Catorce Café',
  'Paraíso Café', 'Acevedo'
);

-- Buceo
UPDATE restaurants SET neighborhood = 'Buceo' WHERE name IN (
  'El Tío Bistró', 'Hard Rock Café Montevideo', 'Ramona WTC', 'La Vaca Parrilla',
  'Yacht Club Uruguayo', 'El Italiano', 'Sudestada', 'La Fonda del Buceo'
);

-- Malvín
UPDATE restaurants SET neighborhood = 'Malvín' WHERE name IN (
  'Soprano Malvín', 'La Trillada', 'Decano Restaurante', 'Bar Michigan',
  'Salmuera Café Bistró', 'Hong Kong Malvín', 'La Nueva Pascale', 'Club La Isla'
);

-- Punta Carretas
UPDATE restaurants SET neighborhood = 'Punta Carretas' WHERE name IN (
  'La Chingada Cantina', 'Pellegrin', 'Bar Tabaré', 'Casa Magnum Punta Carretas',
  'García Punta Carretas', 'Francis Punta Carretas', 'La Perdiz',
  'La Estacada', 'Bar Seven'
);

-- Pocitos
UPDATE restaurants SET neighborhood = 'Pocitos' WHERE name IN (
  'Fellini Pocitos', 'Carbonada', 'Tandory', 'Tintos & Rubias Pocitos',
  'Expreso Pocitos', 'La Commedia', 'Bruta', 'Milajó', 'La Giraldita', 'Pistatxofusión'
);

-- Centro
UPDATE restaurants SET neighborhood = 'Centro' WHERE name IN (
  'El Fogón', 'Bar Facal', 'TANNAT Restaurant', 'Danubio Azul', 'Verne Business Café',
  'Pacharán', 'Oro del Rhin Café', 'Flora'
);

-- Ciudad Vieja
UPDATE restaurants SET neighborhood = 'Ciudad Vieja' WHERE name IN (
  'Álvarez Bar', 'Primuseum', 'El Palenque', 'Jacinto', 'Es Mercat', 'El Chipirón',
  'La Fonda', 'Estrecho', 'El Otro Es Mercat', 'Cabaña Verónica',
  'Café Brasilero', 'Las Misiones'
);

-- Parque Rodó
UPDATE restaurants SET neighborhood = 'Parque Rodó' WHERE name IN (
  'Club del Pan', 'De Morondanga', 'La Milpa Taquería', 'Casa Fauno', 'Oriundo',
  'Francachela', 'PyG Bar', 'Puesta del Sol', 'Sucré Salé', 'La Guinda'
);
-- Carrasco

-- Etiquetas
INSERT INTO tags (name) VALUES
('Parrilla'), ('Vegano'), ('Café'), ('Italiana'), ('Mariscos'), ('Bar'), ('Brunch');
-- 1 Parrilla
-- 2 Vegano
-- 3 Café
-- 4 Italiana
-- 5 Mariscos
-- 6 Bar
INSERT INTO restaurant_tags (restaurant_id, tag_id) VALUES
-- Alquimista (1): Parrilla, Café, Bar
(1, 1), (1, 3), (1, 6),
-- Café Misterio (2): Café, Italiana, Brunch, Mariscos
(2, 3), (2, 4), (2, 7), (2, 5),
-- Charo (3): Parrilla, Vegano, Café, Bar
(3, 1), (3, 2), (3, 3), (3, 6),
-- Casa Magnum (4): Parrilla, Italiana, Mariscos, Bar
(4, 1), (4, 4), (4, 5), (4, 6),
-- La Casa Violeta (5): Parrilla, Mariscos, Bar
(5, 1), (5, 5), (5, 6),
-- García Carrasco (6): Parrilla, Bar, Italiana
(6, 1), (6, 6), (6, 4),
-- Tintos & Rubias Carrasco (7): Parrilla, Italiana, Bar
(7, 1), (7, 4), (7, 6),
-- Manzanar (8): Parrilla, Vegano, Mariscos
(8, 1), (8, 2), (8, 5),
-- La Panera Rosa (9): Café, Brunch, Vegano
(9, 3), (9, 7), (9, 2),
-- El Puesto (10): Parrilla, Vegano, Mariscos
(10, 1), (10, 2), (10, 5),
-- Cantina Rostand (11): Parrilla, Italiana, Café
(11, 1), (11, 4), (11, 3),
-- Lo de Marcos (12): Vegano, Italiana, Parrilla
(12, 2), (12, 4), (12, 1),
-- Lombardía (13): Parrilla, Italiana, Café
(13, 1), (13, 4), (13, 3),
-- RIO Café Restaurant (14): Café, Bar, Brunch
(14, 3), (14, 6), (14, 7),

-- Cordón
-- Café Gourmand (15): Café, Brunch, Vegano
(15, 3), (15, 7), (15, 2),
-- Escaramuza (16): Café, Vegano, Brunch
(16, 3), (16, 2), (16, 7),
-- Bakers Bar (17): Bar, Vegano, Parrilla
(17, 6), (17, 2), (17, 1),
-- Obrador Social Club (18): Café, Vegano, Brunch
(18, 3), (18, 2), (18, 7),
-- SU Bar (19): Bar, Vegano, Parrilla
(19, 6), (19, 2), (19, 1),
-- La Guinda (20): Bar, Vegano, Café
(20, 6), (20, 2), (20, 3),
-- Plaza de Chueca (21): Bar, Vegano, Parrilla
(21, 6), (21, 2), (21, 1),
-- El Rastro Parrillita (22): Parrilla, Vegano, Bar
(22, 1), (22, 2), (22, 6),
-- Uno Catorce Café (23): Café, Brunch, Vegano
(23, 3), (23, 7), (23, 2),
-- Paraíso Café (24): Café, Vegano, Brunch
(24, 3), (24, 2), (24, 7),
-- Acevedo (25): Vegano, Café, Brunch
(25, 2), (25, 3), (25, 7),

-- Buceo
-- El Tío Bistró (26): Italiana, Vegano, Parrilla
(26, 4), (26, 2), (26, 1),
-- Hard Rock Café Montevideo (27): Bar, Parrilla, Italiana
(27, 6), (27, 1), (27, 4),
-- Ramona WTC (28): Vegano, Café, Brunch
(28, 2), (28, 3), (28, 7),
-- La Vaca Parrilla (29): Parrilla, Mariscos, Bar
(29, 1), (29, 5), (29, 6),
-- Yacht Club Uruguayo (30): Mariscos, Parrilla, Bar
(30, 5), (30, 1), (30, 6),
-- El Italiano (31): Italiana, Vegano, Café
(31, 4), (31, 2), (31, 3),
-- Sudestada (32): Vegano, Mariscos, Parrilla
(32, 2), (32, 5), (32, 1),
-- La Fonda del Buceo (33): Vegano, Café, Brunch
(33, 2), (33, 3), (33, 7),

-- Malvín
-- Soprano Malvín (34): Parrilla, Italiana, Bar
(34, 1), (34, 4), (34, 6),
-- La Trillada (35): Parrilla, Italiana, Bar
(35, 1), (35, 4), (35, 6),
-- Decano Restaurante (36): Parrilla, Italiana, Bar
(36, 1), (36, 4), (36, 6),
-- Bar Michigan (37): Bar, Parrilla, Italiana
(37, 6), (37, 1), (37, 4),
-- Salmuera Café Bistró (38): Café, Mariscos, Vegano
(38, 3), (38, 5), (38, 2),
-- Hong Kong Malvín (39): Vegano, Italiana, Café
(39, 2), (39, 4), (39, 3),
-- La Nueva Pascale (40): Parrilla, Italiana, Bar
(40, 1), (40, 4), (40, 6),
-- Club La Isla (41): Parrilla, Bar, Italiana
(41, 1), (41, 6), (41, 4),

-- Punta Carretas
-- La Chingada Cantina (42): Vegano, Italiana, Bar
(42, 2), (42, 4), (42, 6),
-- Pellegrin (43): Italiana, Vegano, Parrilla
(43, 4), (43, 2), (43, 1),
-- Bar Tabaré (44): Parrilla, Vegano, Bar
(44, 1), (44, 2), (44, 6),
-- Casa Magnum Punta Carretas (45): Italiana, Mariscos, Parrilla
(45, 4), (45, 5), (45, 1),
-- García Punta Carretas (46): Parrilla, Bar, Italiana
(46, 1), (46, 6), (46, 4),
-- Francis Punta Carretas (47): Mariscos, Vegano, Parrilla
(47, 5), (47, 2), (47, 1),
-- La Perdiz (48): Parrilla, Vegano, Bar
(48, 1), (48, 2), (48, 6),
-- La Estacada (49): Parrilla, Mariscos, Bar
(49, 1), (49, 5), (49, 6),
-- Bar Seven (50): Bar, Parrilla, Italiana
(50, 6), (50, 1), (50, 4),

-- Pocitos
-- Fellini Pocitos (51): Italiana, Parrilla, Bar
(51, 4), (51, 1), (51, 6),
-- Carbonada (52): Parrilla, Bar, Café
(52, 1), (52, 6), (52, 3),
-- Tandory (53): Vegano, Italiana, Mariscos
(53, 2), (53, 4), (53, 5),
-- Tintos & Rubias Pocitos (54): Parrilla, Italiana, Bar
(54, 1), (54, 4), (54, 6),
-- Expreso Pocitos (55): Café, Bar, Brunch
(55, 3), (55, 6), (55, 7),
-- La Commedia (56): Italiana, Bar, Café
(56, 4), (56, 6), (56, 3),
-- Bruta (57): Parrilla, Vegano, Bar
(57, 1), (57, 2), (57, 6),
-- Milajó (58): Vegano, Italiana, Café
(58, 2), (58, 4), (58, 3),
-- La Giraldita (59): Parrilla, Bar, Café
(59, 1), (59, 6), (59, 3),
-- Pistatxofusión (60): Vegano, Parrilla, Bar
(60, 2), (60, 1), (60, 6),

-- Centro
-- El Fogón (61): Parrilla, Mariscos, Italiana, Bar
(61, 1), (61, 5), (61, 4), (61, 6),
-- Bar Facal (62): Café, Bar, Brunch
(62, 3), (62, 6), (62, 7),
-- TANNAT Restaurant (63): Italiana, Mariscos, Bar
(63, 4), (63, 5), (63, 6),
-- Danubio Azul (64): Italiana, Bar, Café
(64, 4), (64, 6), (64, 3),
-- Verne Business Café (65): Café, Brunch, Vegano
(65, 3), (65, 7), (65, 2),
-- Pacharán (66): Bar, Parrilla, Italiana
(66, 6), (66, 1), (66, 4),
-- Oro del Rhin Café (67): Café, Brunch, Vegano
(67, 3), (67, 7), (67, 2),
-- Flora (68): Café, Vegano, Brunch
(68, 3), (68, 2), (68, 7),

-- Ciudad Vieja
-- Álvarez Bar (69): Bar, Parrilla, Italiana
(69, 6), (69, 1), (69, 4),
-- Primuseum (70): Italiana, Bar, Mariscos
(70, 4), (70, 6), (70, 5),
-- El Palenque (71): Parrilla, Bar, Café
(71, 1), (71, 6), (71, 3),
-- Jacinto (72): Café, Brunch, Vegano
(72, 3), (72, 7), (72, 2),
-- Es Mercat (73): Mariscos, Bar, Italiana
(73, 5), (73, 6), (73, 4),
-- El Chipirón (74): Mariscos, Bar, Parrilla
(74, 5), (74, 6), (74, 1),
-- La Fonda (75): Vegano, Café, Brunch
(75, 2), (75, 3), (75, 7),
-- Estrecho (76): Bar, Italiana, Vegano
(76, 6), (76, 4), (76, 2),
-- El Otro Es Mercat (77): Mariscos, Bar, Italiana
(77, 5), (77, 6), (77, 4),
-- Cabaña Verónica (78): Parrilla, Bar, Café
(78, 1), (78, 6), (78, 3),
-- Café Brasilero (79): Café, Brunch, Vegano
(79, 3), (79, 7), (79, 2),
-- Las Misiones (80): Parrilla, Bar, Italiana
(80, 1), (80, 6), (80, 4),

-- Parque Rodo
-- Club del Pan (81): Café, Brunch, Vegano
(81, 3), (81, 7), (81, 2),
-- De Morondanga (82): Vegano, Café, Brunch
(82, 2), (82, 3), (82, 7),
-- La Milpa Taquería (83): Vegano, Bar, Café
(83, 2), (83, 6), (83, 3),
-- Casa Fauno (84): Bar, Italiana, Vegano
(84, 6), (84, 4), (84, 2),
-- Oriundo (85): Bar, Vegano, Italiana
(85, 6), (85, 2), (85, 4),
-- Francachela (86): Parrilla, Bar, Italiana
(86, 1), (86, 6), (86, 4),
-- PyG Bar (87): Bar, Mariscos, Parrilla
(87, 6), (87, 5), (87, 1),
-- Puesta del Sol (88): Mariscos, Bar, Parrilla
(88, 5), (88, 6), (88, 1),
-- Sucré Salé (89): Café, Brunch, Vegano
(89, 3), (89, 7), (89, 2),
-- La Guinda (90): Bar, Café, Vegano
(90, 6), (90, 3), (90, 2);
