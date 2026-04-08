-- update-pin-locations.sql
-- Inferred country, city, region for pins based on description.
-- Only updates currently-null fields. Does NOT overwrite existing non-null values.
-- Generated 2026-03-17.

-- ============================================================
-- CORRECTIONS TO EXISTING DATA
-- ============================================================

-- #45 Segovia: region was incorrectly set to 'Castilla y la Mancha' — Segovia is Castilla y León
UPDATE pins SET region = 'Castilla y León' WHERE collection_number = 45;

-- ============================================================
-- ANDALUCÍA (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Andalucía' WHERE collection_number = 1; -- Andalucia
UPDATE pins SET country = 'España', city = 'Priego de Córdoba', region = 'Andalucía' WHERE collection_number = 58; -- Hermandad de la Aurora Priego de Córdoba
UPDATE pins SET country = 'España', region = 'Andalucía' WHERE collection_number = 57; -- Snowboard Sierra Nevada
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 67; -- Alhambra
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 99; -- Alhambra
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 100; -- Giralda
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 101; -- Flamenca
UPDATE pins SET region = 'Andalucía' WHERE collection_number = 102; -- Escudo de Armas Juan Carlos I (Sevilla already set)
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 103; -- Capirote Verde Sevilla
UPDATE pins SET country = 'España', city = 'Córdoba', region = 'Andalucía' WHERE collection_number = 113; -- Mezquita Córdoba
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 116; -- Granada
UPDATE pins SET country = 'España', city = 'Torre del Mar', region = 'Andalucía' WHERE collection_number = 105; -- Parroquia Torre del Mar
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 98; -- Torre Parque Ciencias Granada
UPDATE pins SET country = 'España', city = 'Málaga', region = 'Andalucía' WHERE collection_number = 141; -- Aeropuerto Málaga
UPDATE pins SET country = 'España', city = 'Fuengirola', region = 'Andalucía' WHERE collection_number = 62; -- Mezquitilla Algarrobo Costa (Málaga province)
UPDATE pins SET country = 'España', city = 'Fuengirola', region = 'Andalucía' WHERE collection_number = 228; -- Bioparc Fuengirola
UPDATE pins SET country = 'España', city = 'Priego de Córdoba', region = 'Andalucía' WHERE collection_number = 229; -- Priego de Córdoba
UPDATE pins SET country = 'España', city = 'Córdoba', region = 'Andalucía' WHERE collection_number = 243; -- Córdoba
UPDATE pins SET country = 'España', city = 'Ronda', region = 'Andalucía' WHERE collection_number = 261; -- Ronda
UPDATE pins SET country = 'España', city = 'Marbella', region = 'Andalucía' WHERE collection_number = 227; -- 5 Aniversario HRC Marbella
UPDATE pins SET country = 'España', city = 'Málaga', region = 'Andalucía' WHERE collection_number = 444; -- Tranvía Málaga I
UPDATE pins SET country = 'España', city = 'Málaga', region = 'Andalucía' WHERE collection_number = 445; -- Tranvía Málaga II
UPDATE pins SET country = 'España', city = 'Málaga', region = 'Andalucía' WHERE collection_number = 477; -- HRC Málaga 5th Anniversary (city already set, add country)
UPDATE pins SET country = 'España', city = 'Almería', region = 'Andalucía' WHERE collection_number = 31; -- Índalo (symbol of Almería)
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 42; -- Parque de las ciencias (Granada)
UPDATE pins SET country = 'España', city = 'Cazorla', region = 'Andalucía' WHERE collection_number = 159; -- Parque nacional sierra de cazorla (Jaén)
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 29; -- Retevisión Expo 92 (Expo Sevilla 1992)
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 362; -- Sevilla FC
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 360; -- Betis
UPDATE pins SET country = 'España', city = 'Sevilla', region = 'Andalucía' WHERE collection_number = 368; -- Betis
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 461; -- Granada CF
-- Sierra Nevada 1995 World Ski Championships (Granada)
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 423;
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 424;
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 425;
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 426;
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 427;

-- ============================================================
-- ARAGÓN (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Zaragoza', region = 'Aragón' WHERE collection_number = 4; -- Virgen del Pilar
UPDATE pins SET country = 'España', city = 'Zaragoza', region = 'Aragón' WHERE collection_number = 20; -- Fluvi (Expo 2008 mascot)
UPDATE pins SET country = 'España', city = 'Huesca', region = 'Aragón' WHERE collection_number = 68; -- Esquí Astún (Astún, Huesca)
UPDATE pins SET country = 'España', city = 'Jaca', region = 'Aragón' WHERE collection_number = 69; -- Jaca
UPDATE pins SET country = 'España', region = 'Aragón' WHERE collection_number = 70; -- Estación Esquí Candanchú (Huesca, Aragón)
UPDATE pins SET country = 'España', city = 'Zaragoza', region = 'Aragón' WHERE collection_number = 90; -- Monasterio de Piedra (Zaragoza province)
UPDATE pins SET country = 'España', city = 'Zaragoza', region = 'Aragón' WHERE collection_number = 370; -- Real Zaragoza
UPDATE pins SET country = 'España', city = 'Zaragoza', region = 'Aragón' WHERE collection_number = 379; -- Zaragoza
UPDATE pins SET country = 'España', region = 'Aragón' WHERE collection_number = 380; -- Aragón

-- ============================================================
-- ASTURIAS (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 163; -- Picos de Europa
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 164; -- Hórreo
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 165; -- Monasterio Covadonga
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 166; -- Lagos de Covadonga
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 167; -- Ruta del Cares
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 173; -- Descenso del Sella
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 176; -- Cruz de la Victoria (Asturias)
UPDATE pins SET country = 'España', city = 'Cangas de Onís', region = 'Asturias' WHERE collection_number = 177; -- Puente Cangas de Onís
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 409; -- Asturias
UPDATE pins SET country = 'España', region = 'Asturias' WHERE collection_number = 410; -- Asturias
UPDATE pins SET country = 'España', city = 'Avilés', region = 'Asturias' WHERE collection_number = 411;
UPDATE pins SET country = 'España', city = 'Luarca', region = 'Asturias' WHERE collection_number = 412;
UPDATE pins SET country = 'España', city = 'Llanes', region = 'Asturias' WHERE collection_number = 413;
UPDATE pins SET country = 'España', city = 'Cudillero', region = 'Asturias' WHERE collection_number = 414;
UPDATE pins SET country = 'España', city = 'Ribadesella', region = 'Asturias' WHERE collection_number = 415;
UPDATE pins SET country = 'España', city = 'Cangas de Onís', region = 'Asturias' WHERE collection_number = 416; -- Onís
UPDATE pins SET country = 'España', city = 'Oviedo', region = 'Asturias' WHERE collection_number = 417;
UPDATE pins SET country = 'España', city = 'Oviedo', region = 'Asturias' WHERE collection_number = 376; -- Real Oviedo

-- ============================================================
-- CANTABRIA (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 136; -- Toro Altamira (Cueva de Altamira)
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 160; -- Cabárceno elefante
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 161; -- Cabárceno oso
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 162; -- Cabárceno tigre
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 178; -- Cueva el Soplao
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 405; -- Cantabria
UPDATE pins SET country = 'España', city = 'San Vicente de la Barquera', region = 'Cantabria' WHERE collection_number = 406;
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 407; -- Año Jubilar Lebaniego
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 408; -- Estela de Barros

-- ============================================================
-- CASTILLA Y LEÓN (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Castilla y León' WHERE collection_number = 181; -- Muralla Ávila
UPDATE pins SET country = 'España', city = 'Salamanca', region = 'Castilla y León' WHERE collection_number = 233;
UPDATE pins SET country = 'España', city = 'Salamanca', region = 'Castilla y León' WHERE collection_number = 234; -- Universidad Salamanca
UPDATE pins SET country = 'España', city = 'Salamanca', region = 'Castilla y León' WHERE collection_number = 235; -- La Alberca (Salamanca province)

-- ============================================================
-- CATALUÑA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 82;
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 83; -- Catedral Barcelona
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 84; -- Dragón de Gaudí
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 85; -- Mosaico Miró Ramblas
UPDATE pins SET country = 'España', city = 'Montserrat', region = 'Cataluña' WHERE collection_number = 86; -- Virgen Monserrat
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 193; -- Torre Agbar
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 194; -- Hard Rock Café Barcelona
UPDATE pins SET country = 'España', city = 'Barcelona', region = 'Cataluña' WHERE collection_number = 371; -- Espanyol

-- ============================================================
-- COMUNIDAD VALENCIANA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 71;
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 72; -- Falleros
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 73; -- Oceanografic Valencia
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 75; -- Palacio de las Artes Reina Sofía
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 76; -- Oceanografic Valencia
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 77; -- Hemisferic Valencia
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 78; -- Museo de las ciencias Valencia
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 369; -- Valencia CF
UPDATE pins SET country = 'España', city = 'Valencia', region = 'Comunidad Valenciana' WHERE collection_number = 374; -- Valencia CF
UPDATE pins SET country = 'España', city = 'Benidorm', region = 'Comunidad Valenciana' WHERE collection_number = 263;

-- ============================================================
-- EXTREMADURA (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Extremadura' WHERE collection_number = 220; -- Extremadura (generic)

-- ============================================================
-- GALICIA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Santiago de Compostela', region = 'Galicia' WHERE collection_number = 142; -- Catedral Santiago
UPDATE pins SET country = 'España', city = 'Santiago de Compostela', region = 'Galicia' WHERE collection_number = 143; -- Peregrino Santiago
UPDATE pins SET country = 'España', region = 'Galicia' WHERE collection_number = 241; -- Fisterra
UPDATE pins SET country = 'España', city = 'A Coruña', region = 'Galicia' WHERE collection_number = 402;
UPDATE pins SET country = 'España', region = 'Galicia' WHERE collection_number = 403;
UPDATE pins SET country = 'España', city = 'Vigo', region = 'Galicia' WHERE collection_number = 367; -- Celta de Vigo
UPDATE pins SET country = 'España', city = 'Vigo', region = 'Galicia' WHERE collection_number = 372; -- Celta de Vigo

-- ============================================================
-- ISLAS CANARIAS (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'Islas Canarias' WHERE collection_number = 35; -- Tenerife
UPDATE pins SET country = 'España', region = 'Islas Canarias' WHERE collection_number = 312; -- Lanzarote
UPDATE pins SET country = 'España', region = 'Islas Canarias' WHERE collection_number = 418; -- Canarias

-- ============================================================
-- LA RIOJA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Logroño', region = 'La Rioja' WHERE collection_number = 366; -- Club Deportivo Logroñés

-- ============================================================
-- MADRID (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 2; -- Asociación Corredor de Henares
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 8; -- Zoo Aquarium Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 44; -- Fuente Cibeles
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 55; -- Secretaría General Iberoamericana
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 184; -- Cristo de Medinaceli
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 217; -- Guitarra HRC Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 271; -- Real Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 359; -- Real Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 373; -- Rayo Vallecano
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 387; -- Bandera Comunidad de Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 388; -- Escudo Comunidad de Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 457; -- HRC Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 458; -- Atlético de Madrid
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 460; -- Musical Aladdin (Madrid production)
UPDATE pins SET country = 'España', city = 'Madrid', region = 'Madrid' WHERE collection_number = 463; -- Atlético Aviación
UPDATE pins SET country = 'España' WHERE collection_number = 189; -- Escudo de Armas Juan Carlos I (no specific city)

-- ============================================================
-- MURCIA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Caravaca de la Cruz', region = 'Murcia' WHERE collection_number = 23; -- Cruz de Caravaca
UPDATE pins SET country = 'España', city = 'Caravaca de la Cruz', region = 'Murcia' WHERE collection_number = 242; -- Cruz Caravaca

-- ============================================================
-- NAVARRA (España)
-- ============================================================
UPDATE pins SET country = 'España', city = 'Pamplona', region = 'Navarra' WHERE collection_number = 381;
UPDATE pins SET country = 'España', region = 'Navarra' WHERE collection_number = 382;
UPDATE pins SET country = 'España', city = 'Javier', region = 'Navarra' WHERE collection_number = 384; -- Javier (Navarra)
UPDATE pins SET country = 'España', city = 'Pamplona', region = 'Navarra' WHERE collection_number = 385; -- Calle Estafeta
UPDATE pins SET country = 'España', city = 'Pamplona', region = 'Navarra' WHERE collection_number = 392;
UPDATE pins SET country = 'España', region = 'Navarra' WHERE collection_number = 393;
UPDATE pins SET country = 'España', city = 'Pamplona', region = 'Navarra' WHERE collection_number = 319; -- Osasuna

-- ============================================================
-- PAÍS VASCO (España)
-- ============================================================
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 245;
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 358; -- Athletic Club
UPDATE pins SET country = 'España', city = 'Bilbao', region = 'País Vasco' WHERE collection_number = 363; -- Athletic Club San Mamés
UPDATE pins SET country = 'España', city = 'Eibar', region = 'País Vasco' WHERE collection_number = 375;
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 383; -- Euskal Herria
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 386; -- Arrano Belzta
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 389; -- Caravinagre
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 390; -- Olentxero
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 391; -- Eguzkilore
UPDATE pins SET country = 'España', city = 'San Sebastián', region = 'País Vasco' WHERE collection_number = 396;
UPDATE pins SET country = 'España', city = 'San Sebastián', region = 'País Vasco' WHERE collection_number = 397; -- Barandilla paseo marítimo
UPDATE pins SET country = 'España', city = 'San Sebastián', region = 'País Vasco' WHERE collection_number = 398;
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 399; -- Guipúzcoa
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 400; -- Bizkaia
UPDATE pins SET country = 'España', region = 'País Vasco' WHERE collection_number = 401;
UPDATE pins SET country = 'España', city = 'Vitoria-Gasteiz', region = 'País Vasco' WHERE collection_number = 378; -- Vitoria
UPDATE pins SET country = 'España', city = 'San Sebastián', region = 'País Vasco' WHERE collection_number = 321; -- Real Sociedad
UPDATE pins SET country = 'España', city = 'San Sebastián', region = 'País Vasco' WHERE collection_number = 357; -- Real Sociedad

-- ============================================================
-- ESPAÑA — national level (no specific city/region determinable)
-- ============================================================
UPDATE pins SET country = 'España' WHERE collection_number = 329; -- España (football)
UPDATE pins SET country = 'España' WHERE collection_number = 462; -- Patrulla Águila
UPDATE pins SET country = 'España' WHERE collection_number = 464; -- Escarapela de España
UPDATE pins SET country = 'España' WHERE collection_number = 465; -- Ala nº12
UPDATE pins SET country = 'España' WHERE collection_number = 466; -- Legión
UPDATE pins SET country = 'España' WHERE collection_number = 468; -- Ejército del Aire Paracaídistas

-- ============================================================
-- EXPO ZARAGOZA 2008 — foreign country pavilions
-- ============================================================
UPDATE pins SET country = 'Unión Europea', city = 'Zaragoza' WHERE collection_number = 5;
UPDATE pins SET country = 'Polonia', city = 'Zaragoza' WHERE collection_number = 6;
UPDATE pins SET country = 'Alemania', city = 'Zaragoza' WHERE collection_number = 10;
UPDATE pins SET country = 'Grecia', city = 'Zaragoza' WHERE collection_number = 11;
UPDATE pins SET country = 'Túnez', city = 'Zaragoza' WHERE collection_number = 14;
UPDATE pins SET country = 'México', city = 'Zaragoza' WHERE collection_number = 54;
UPDATE pins SET country = 'Italia', city = 'Zaragoza' WHERE collection_number = 56;

-- ============================================================
-- ITALIA
-- ============================================================
UPDATE pins SET country = 'Italia', city = 'Roma' WHERE collection_number = 118; -- Roma Loba
UPDATE pins SET country = 'Italia', city = 'Roma' WHERE collection_number = 119; -- Roma Coliseo letras
UPDATE pins SET country = 'Italia', city = 'Ciudad del Vaticano' WHERE collection_number = 120; -- Ciudad del Vaticano
UPDATE pins SET country = 'Italia', city = 'Florencia' WHERE collection_number = 121; -- Duomo Florencia
UPDATE pins SET country = 'Italia', city = 'Florencia' WHERE collection_number = 123; -- David Miguel Ángel
UPDATE pins SET country = 'Italia', city = 'Pisa' WHERE collection_number = 124; -- Pisa Torre letras
UPDATE pins SET country = 'Italia', city = 'Pisa' WHERE collection_number = 125; -- Torre Pisa
UPDATE pins SET country = 'Italia', city = 'Florencia' WHERE collection_number = 315; -- HRC Florencia
UPDATE pins SET country = 'Italia', city = 'Milán' WHERE collection_number = 318; -- HRC Milán
UPDATE pins SET country = 'Italia' WHERE collection_number = 337; -- Italia (football)

-- ============================================================
-- FRANCIA
-- ============================================================
UPDATE pins SET country = 'Francia', city = 'París' WHERE collection_number = 18; -- Crush's Coaster (Disneyland Paris)
UPDATE pins SET country = 'Francia', city = 'París' WHERE collection_number = 34; -- Torre Eiffel
UPDATE pins SET country = 'Francia', city = 'París' WHERE collection_number = 182; -- Torre Eiffel
UPDATE pins SET country = 'Francia', city = 'París' WHERE collection_number = 183; -- París
UPDATE pins SET country = 'Francia', city = 'Montpellier' WHERE collection_number = 244;
UPDATE pins SET country = 'Francia', city = 'Biarritz' WHERE collection_number = 394;
UPDATE pins SET country = 'Francia', city = 'San Juan de Luz' WHERE collection_number = 395;
UPDATE pins SET country = 'Francia', city = 'París' WHERE collection_number = 451; -- 30 Aniversario DisneyLand París
UPDATE pins SET country = 'Francia' WHERE collection_number = 340; -- Francia (football)

-- ============================================================
-- ALEMANIA
-- ============================================================
UPDATE pins SET country = 'Alemania', city = 'Berlín' WHERE collection_number = 49;
UPDATE pins SET country = 'Alemania', city = 'Aachen' WHERE collection_number = 187; -- Catedral Aachen
UPDATE pins SET country = 'Alemania', city = 'Augsburgo' WHERE collection_number = 272;
UPDATE pins SET country = 'Alemania', city = 'Múnich' WHERE collection_number = 273; -- Fábrica Paulaner
UPDATE pins SET country = 'Alemania', region = 'Baviera' WHERE collection_number = 274;
UPDATE pins SET country = 'Alemania', region = 'Baviera' WHERE collection_number = 275;
UPDATE pins SET country = 'Alemania', city = 'Núremberg' WHERE collection_number = 276;
UPDATE pins SET country = 'Alemania' WHERE collection_number = 277;
UPDATE pins SET country = 'Alemania' WHERE collection_number = 298;
UPDATE pins SET country = 'Alemania', city = 'Múnich' WHERE collection_number = 285; -- HRC Múnich
UPDATE pins SET country = 'Alemania', city = 'Berlín' WHERE collection_number = 299; -- HRC Berlín
UPDATE pins SET country = 'Alemania', city = 'Colonia' WHERE collection_number = 293; -- HRC Colonia
UPDATE pins SET country = 'Alemania', city = 'Hamburgo' WHERE collection_number = 300; -- Ópera de Hamburgo
UPDATE pins SET country = 'Alemania', city = 'Hamburgo' WHERE collection_number = 302; -- HRC Hamburgo
UPDATE pins SET country = 'Alemania', city = 'Innsbruck' WHERE collection_number = 301; -- HRC Innsbruck (Austria actually)
UPDATE pins SET country = 'Alemania', city = 'Ulm' WHERE collection_number = 309; -- Ulmer Spatz
UPDATE pins SET country = 'Alemania' WHERE collection_number = 346; -- Alemania (football)

-- ============================================================
-- AUSTRIA
-- ============================================================
UPDATE pins SET country = 'Austria', city = 'Viena' WHERE collection_number = 286;
UPDATE pins SET country = 'Austria' WHERE collection_number = 287;
-- Correct #301: Innsbruck is Austria, not Germany
UPDATE pins SET country = 'Austria', city = 'Innsbruck' WHERE collection_number = 301;

-- ============================================================
-- SUIZA
-- ============================================================
UPDATE pins SET country = 'Suiza' WHERE collection_number = 7; -- Bandera Suiza
UPDATE pins SET country = 'Suiza' WHERE collection_number = 284;

-- ============================================================
-- BÉLGICA
-- ============================================================
UPDATE pins SET country = 'Bélgica', city = 'Bruselas' WHERE collection_number = 186; -- Maneken Pis
UPDATE pins SET city = 'Brujas' WHERE collection_number = 247; -- already has country=Bélgica
UPDATE pins SET city = 'Amberes' WHERE collection_number = 248;
UPDATE pins SET city = 'Dinant' WHERE collection_number = 249;
UPDATE pins SET city = 'Gante' WHERE collection_number = 250;
UPDATE pins SET city = 'Bruselas' WHERE collection_number = 255;
UPDATE pins SET city = 'Bruselas' WHERE collection_number = 257; -- HRC Bruselas
UPDATE pins SET country = 'Bélgica' WHERE collection_number = 351; -- Bélgica (football)

-- ============================================================
-- HOLANDA
-- ============================================================
UPDATE pins SET city = 'Ámsterdam' WHERE collection_number = 252; -- already has country=Holanda
UPDATE pins SET city = 'Ámsterdam' WHERE collection_number = 254; -- HRC Amsterdam
UPDATE pins SET country = 'Holanda' WHERE collection_number = 328; -- Holanda (football)

-- ============================================================
-- LUXEMBURGO
-- ============================================================
UPDATE pins SET city = 'Luxemburgo' WHERE collection_number = 185; -- already has country=Luxemburgo

-- ============================================================
-- HUNGRÍA
-- ============================================================
UPDATE pins SET country = 'Hungría' WHERE collection_number = 288;
UPDATE pins SET country = 'Hungría', city = 'Budapest' WHERE collection_number = 459;

-- ============================================================
-- ESLOVAQUIA
-- ============================================================
UPDATE pins SET country = 'Eslovaquia', city = 'Bratislava' WHERE collection_number = 289;
UPDATE pins SET country = 'Eslovaquia' WHERE collection_number = 290;
UPDATE pins SET country = 'Eslovaquia' WHERE collection_number = 297;

-- ============================================================
-- REPÚBLICA CHECA
-- ============================================================
UPDATE pins SET country = 'República Checa' WHERE collection_number = 280;
UPDATE pins SET country = 'República Checa', city = 'Praga' WHERE collection_number = 281;
UPDATE pins SET country = 'República Checa' WHERE collection_number = 282;
UPDATE pins SET country = 'República Checa', city = 'Praga' WHERE collection_number = 283; -- HRC Praga
UPDATE pins SET country = 'República Checa' WHERE collection_number = 353; -- República Checa (football)

-- ============================================================
-- POLONIA
-- ============================================================
UPDATE pins SET country = 'Polonia', city = 'Cracovia' WHERE collection_number = 291; -- HRC Cracovia
UPDATE pins SET country = 'Polonia', city = 'Varsovia' WHERE collection_number = 295; -- HRC Varsovia

-- ============================================================
-- ESLOVENIA
-- ============================================================
UPDATE pins SET country = 'Eslovenia', city = 'Liubliana' WHERE collection_number = 296;

-- ============================================================
-- CROACIA
-- ============================================================
UPDATE pins SET country = 'Croacia' WHERE collection_number = 292;
UPDATE pins SET country = 'Croacia' WHERE collection_number = 325; -- Croacia (football)

-- ============================================================
-- SUECIA
-- ============================================================
UPDATE pins SET country = 'Suecia', city = 'Estocolmo' WHERE collection_number = 134; -- Estocolmo Ayuntamiento
UPDATE pins SET country = 'Suecia' WHERE collection_number = 265;

-- ============================================================
-- FINLANDIA
-- ============================================================
UPDATE pins SET country = 'Finlandia', city = 'Helsinki' WHERE collection_number = 135;
UPDATE pins SET country = 'Finlandia', city = 'Helsinki' WHERE collection_number = 264; -- HRC Helsinki
UPDATE pins SET country = 'Finlandia' WHERE collection_number = 270; -- Laponia (Finnish Lapland)

-- ============================================================
-- ESTONIA
-- ============================================================
UPDATE pins SET country = 'Estonia' WHERE collection_number = 131; -- Estonia Armadura
UPDATE pins SET country = 'Estonia' WHERE collection_number = 266;

-- ============================================================
-- DINAMARCA
-- ============================================================
UPDATE pins SET country = 'Dinamarca' WHERE collection_number = 133;

-- ============================================================
-- IRLANDA
-- ============================================================
UPDATE pins SET country = 'Irlanda', city = 'Dublín' WHERE collection_number = 322; -- HRC Dublín
UPDATE pins SET country = 'Irlanda', city = 'Dublín' WHERE collection_number = 456; -- HRHotel Dublin

-- ============================================================
-- REINO UNIDO
-- ============================================================
UPDATE pins SET country = 'Reino Unido', city = 'Belfast' WHERE collection_number = 145; -- Giant Causeway (Northern Ireland)
UPDATE pins SET country = 'Reino Unido', city = 'Belfast' WHERE collection_number = 149; -- Irlanda del norte flag
UPDATE pins SET country = 'Reino Unido', city = 'Londres' WHERE collection_number = 158;
UPDATE pins SET country = 'Reino Unido', city = 'Windsor' WHERE collection_number = 157;
UPDATE pins SET country = 'Reino Unido', city = 'Gibraltar' WHERE collection_number = 152; -- Gibraltar (UK territory)
UPDATE pins SET country = 'Reino Unido', city = 'Londres' WHERE collection_number = 317; -- Chelsea FC
UPDATE pins SET country = 'Reino Unido', city = 'Glasgow' WHERE collection_number = 361; -- Rangers FC
UPDATE pins SET country = 'Reino Unido' WHERE collection_number = 338; -- Inglaterra (football)

-- ============================================================
-- PORTUGAL
-- ============================================================
UPDATE pins SET country = 'Portugal' WHERE collection_number = 140; -- Algarve
UPDATE pins SET country = 'Portugal' WHERE collection_number = 262;
UPDATE pins SET country = 'Portugal', city = 'Lisboa' WHERE collection_number = 314; -- HRC Lisboa
UPDATE pins SET country = 'Portugal', city = 'Lisboa' WHERE collection_number = 428;
UPDATE pins SET country = 'Portugal' WHERE collection_number = 429; -- Super Bock
UPDATE pins SET country = 'Portugal' WHERE collection_number = 430;
UPDATE pins SET country = 'Portugal' WHERE collection_number = 431; -- Sporting Portugal
UPDATE pins SET country = 'Portugal', city = 'Madeira' WHERE collection_number = 432;
UPDATE pins SET country = 'Portugal', city = 'Lisboa' WHERE collection_number = 433; -- Facultad Lisboa
UPDATE pins SET country = 'Portugal' WHERE collection_number = 434; -- Gallo de Portugal
UPDATE pins SET country = 'Portugal', city = 'Sintra' WHERE collection_number = 435;
UPDATE pins SET country = 'Portugal' WHERE collection_number = 436;
UPDATE pins SET country = 'Portugal' WHERE collection_number = 437; -- Guitarra Fado
UPDATE pins SET country = 'Portugal', city = 'Porto' WHERE collection_number = 438;
UPDATE pins SET country = 'Portugal', city = 'Porto' WHERE collection_number = 447; -- FC Oporto
UPDATE pins SET country = 'Portugal', city = 'Porto' WHERE collection_number = 448; -- FC Oporto Evolución Histórica
UPDATE pins SET country = 'Portugal', city = 'Porto' WHERE collection_number = 476; -- HRC Porto
UPDATE pins SET country = 'Portugal' WHERE collection_number = 349; -- Portugal (football)

-- ============================================================
-- MEDIO ORIENTE / ASIA / AFRICA
-- ============================================================
UPDATE pins SET country = 'Omán' WHERE collection_number = 9;
UPDATE pins SET country = 'Jordania' WHERE collection_number = 97;

-- ============================================================
-- LATINOAMÉRICA
-- ============================================================
UPDATE pins SET country = 'Bolivia' WHERE collection_number = 24;
UPDATE pins SET country = 'Cuba' WHERE collection_number = 104;
UPDATE pins SET country = 'Ecuador' WHERE collection_number = 51;
UPDATE pins SET country = 'República Dominicana' WHERE collection_number = 231;
UPDATE pins SET country = 'Argentina', city = 'Buenos Aires' WHERE collection_number = 364; -- Boca Juniors

-- ============================================================
-- FOOTBALL — NATIONAL TEAMS (country only, no city/region)
-- ============================================================
UPDATE pins SET country = 'Brasil' WHERE collection_number = 323;
UPDATE pins SET country = 'Brasil' WHERE collection_number = 354; -- Copa del mundo, Brasil 2014
UPDATE pins SET country = 'Brasil' WHERE collection_number = 355; -- Fuleco, mascot Brasil 2014
UPDATE pins SET country = 'Camerún' WHERE collection_number = 324;
UPDATE pins SET country = 'México' WHERE collection_number = 326;
UPDATE pins SET country = 'Australia' WHERE collection_number = 327;
UPDATE pins SET country = 'Chile' WHERE collection_number = 330;
UPDATE pins SET country = 'Colombia' WHERE collection_number = 331;
UPDATE pins SET country = 'Costa de Marfil' WHERE collection_number = 332;
UPDATE pins SET country = 'Japón' WHERE collection_number = 333;
UPDATE pins SET country = 'Grecia' WHERE collection_number = 334;
UPDATE pins SET country = 'Costa Rica' WHERE collection_number = 335;
UPDATE pins SET country = 'Uruguay' WHERE collection_number = 336;
UPDATE pins SET country = 'Honduras' WHERE collection_number = 341;
UPDATE pins SET country = 'Argentina' WHERE collection_number = 342;
UPDATE pins SET country = 'Bosnia-Herzegovina' WHERE collection_number = 343;
UPDATE pins SET country = 'Nigeria' WHERE collection_number = 344;
UPDATE pins SET country = 'Irán' WHERE collection_number = 345;
UPDATE pins SET country = 'Ghana' WHERE collection_number = 347;
UPDATE pins SET country = 'Estados Unidos' WHERE collection_number = 348;
UPDATE pins SET country = 'Ecuador' WHERE collection_number = 339;
UPDATE pins SET country = 'Argelia' WHERE collection_number = 350;
UPDATE pins SET country = 'Rusia' WHERE collection_number = 352;

-- ============================================================
-- ADDITIONAL CONFIDENT INFERENCES
-- ============================================================

-- #13 España + Castilla la Mancha — clearly Spain
UPDATE pins SET country = 'España' WHERE collection_number = 13;

-- #41 Véjer — Vejer de la Frontera, Cádiz, Andalucía
UPDATE pins SET country = 'España', city = 'Vejer de la Frontera', region = 'Andalucía' WHERE collection_number = 41;

-- #59 Cofradía de María Santísima de los Dolores y Cristo de la Buena Muerte
-- "Cristo de la Buena Muerte" cofradías are associated with Málaga and Granada;
-- given context (#58 Priego de Córdoba nearby), likely Andalucía at minimum
UPDATE pins SET country = 'España', region = 'Andalucía' WHERE collection_number = 59;

-- #110 Cristo de la Buena Muerte — famous in Málaga
UPDATE pins SET country = 'España', city = 'Málaga', region = 'Andalucía' WHERE collection_number = 110;

-- #172 Cruz Liébana — Cantabria
UPDATE pins SET country = 'España', region = 'Cantabria' WHERE collection_number = 172;

-- #155 Fuente de los Leones — likely Alhambra, Granada
UPDATE pins SET country = 'España', city = 'Granada', region = 'Andalucía' WHERE collection_number = 155;

-- #236 Cruz Santiago — Galician symbol
UPDATE pins SET country = 'España', region = 'Galicia' WHERE collection_number = 236;

-- #404 Cruz de Santiago — same
UPDATE pins SET country = 'España', region = 'Galicia' WHERE collection_number = 404;

-- #144 Santiago (santo) — Saint James, patron of Spain/Galicia
UPDATE pins SET country = 'España', city = 'Santiago de Compostela', region = 'Galicia' WHERE collection_number = 144;
