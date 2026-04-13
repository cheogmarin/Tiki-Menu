-- Script SQL para Supabase (PostgreSQL)
-- Habilitar la extensión pgvector para búsquedas semánticas
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de Platillos/Bebidas
CREATE TABLE IF NOT EXISTS platillos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL, -- 'Coctelería', 'Sangrías', 'Burgers', 'Pizzas', etc.
  imagen_url TEXT,
  etiquetas TEXT[], -- Etiquetas para dieta, alergias o gusto
  disponible BOOLEAN DEFAULT TRUE,
  embedding vector(768), -- Para usar con Gemini Embeddings o similar
  created_at TIMESTAMPTZ DEFAULT NOW()
);-- Insertar algunos datos iniciales (Ejemplos del menú proporcionado)
INSERT INTO platillos (nombre, descripcion, precio, categoria, etiquetas, imagen_url) VALUES
-- Coctelería: Tiki Specials
('Zombie', 'Un auténtico "resucita muertos". Enérgica combinación de ron extra dry, añejo y oscuro, potenciada con Brandy Spicy, fruta de la pasión, zumo de piña, lima y un toque de Angostura y canela.', 12.00, 'Coctelería', ARRAY['Fuerte', 'Exótico', 'Frutal'], 'https://i.ibb.co/VWL5SyZw/Zobie-web.webp'),
('Tiki Electric Ice Beach Tea', 'Eléctrica y audaz. Ron Extra Dry, Vodka, Ginebra, Tequila, licor de melón, limonada y un toque vibrante de Blue Curaçao.', 12.00, 'Coctelería', ARRAY['Fuerte', 'Refrescante', 'Azul'], 'https://i.ibb.co/20k2WKqq/electric-tea.jpg'),
('Coco-Mango Loco', 'El Caribe en una copa. Mezcla espirituosa de Ron Batida de Coco, Vodka de Coco, Tequila, Tiki-Mix Falernum, puré de coco y mango.', 10.00, 'Coctelería', ARRAY['Tropical', 'Dulce', 'Frutal'], 'https://i.ibb.co/TBRKcqLQ/coco-mango-loco.avif'),
('Aku Aku', 'El balance perfecto. Ron Extra Dry, licor de melocotón, puré de maracuyá, zumo de lima, sirope de azúcar de caña y hierbabuena fresca.', 8.00, 'Coctelería', ARRAY['Ligero', 'Refrescante', 'Menta'], 'https://i.ibb.co/spsYKxQR/aku-aku.jpg'),
('Jasper''s Jamaica', 'Aroma especiado y carácter Tiki. Ron Oscuro de Jamaica, zumo de lima, pimienta Dram Syrup y sirope de agave.', 8.00, 'Coctelería', ARRAY['Especiado', 'Fuerte', 'Clásico'], 'https://picsum.photos/seed/dark-rum/600/400'),
('Mezcaliña', 'Inspirada en el Mezcal, "la única bebida del mundo a la que se le dan besos en lugar de tragos". Combina Mezcal, sirope de piña chili, Tiki-Mix Falernum, Frangelico y Bitters.', 8.00, 'Coctelería', ARRAY['Ahumado', 'Picante', 'Cítrico'], 'https://picsum.photos/seed/mezcal/600/400'),

-- Coctelería: Spritz Time
('Aperol Spritz', 'Alegre y vibrante. Aperol, Prosecco, soda y rodaja de naranja.', 4.50, 'Coctelería', ARRAY['Refrescante', 'Cítrico', 'Ligero'], 'https://picsum.photos/seed/aperol/600/400'),
('Tropical Spritz', 'Sirope de fruta de la pasión, Aperol, Prosecco y soda.', 5.50, 'Coctelería', ARRAY['Frutal', 'Dulce', 'Refrescante'], 'https://picsum.photos/seed/tropical-spritz/600/400'),
('Spritz Hugo', 'Refrescante mezcla de sirope Elderflower, Prosecco y soda.', 4.50, 'Coctelería', ARRAY['Floral', 'Ligero', 'Elegante'], 'https://picsum.photos/seed/hugo-spritz/600/400'),
('Pirlo Spritz', 'Campari, Prosecco, soda y rodaja de naranja.', 5.50, 'Coctelería', ARRAY['Amargo', 'Refrescante', 'Clásico'], 'https://picsum.photos/seed/campari-spritz/600/400'),
('Americano', 'Un clásico eterno con Campari, Vermouth rojo Cinzano y soda.', 6.50, 'Coctelería', ARRAY['Amargo', 'Clásico', 'Intenso'], 'https://picsum.photos/seed/americano-cocktail/600/400'),

-- Coctelería: Beach Classics
('Mojito Tradicional', 'Ron Extra Dry, lima, menta fresca, azúcar y soda.', 6.00, 'Coctelería', ARRAY['Refrescante', 'Clásico', 'Ligero'], 'https://picsum.photos/seed/mojito/600/400'),
('Mojito Sabores', 'Versión frutal de nuestro Mojito con sabores tropicales.', 7.00, 'Coctelería', ARRAY['Frutal', 'Refrescante', 'Variado'], 'https://picsum.photos/seed/fruit-mojito/600/400'),
('Bourbon Mojito', 'Variante intensa con Bourbon, lima, menta, azúcar y Ginger Ale.', 7.00, 'Coctelería', ARRAY['Intenso', 'Amaderado', 'Refrescante'], 'https://picsum.photos/seed/bourbon-mojito/600/400'),
('Sex on the Beach', 'Vodka melocotón, licor de melocotón, zumo de naranja y un toque de arándano.', 7.00, 'Coctelería', ARRAY['Clásico', 'Dulce', 'Frutal'], 'https://picsum.photos/seed/sex-beach/600/400'),
('Caipirinha', 'Cachaça, lima, azúcar y soda.', 7.00, 'Coctelería', ARRAY['Cítrico', 'Fuerte', 'Refrescante'], 'https://picsum.photos/seed/caipirinha/600/400'),
('Blue Hawaiian', 'Ron blanco extra dry, puré de coco, Blue Curaçao y zumo de piña.', 8.00, 'Coctelería', ARRAY['Dulce', 'Cremoso', 'Tropical'], 'https://picsum.photos/seed/blue-hawaiian/600/400'),
('Maï Taï', 'El rey de la Polinesia. Bases de Ron Extra Dry y Ron Oscuro, Triple Seco, Orgeat y zumo de lima.', 12.00, 'Coctelería', ARRAY['Clásico', 'Fuerte', 'Equilibrado'], 'https://picsum.photos/seed/maitai/600/400'),
('Daiquiri', 'Mezcla clásica de Ron Extra Dry, Triple Seco y lima. Consulte por nuestras versiones frutales.', 7.00, 'Coctelería', ARRAY['Cítrico', 'Clásico', 'Refrescante'], 'https://picsum.photos/seed/daiquiri/600/400'),

-- Sangrías
('Sangría Caleta', 'Bases de Vino Tinto. Vino especiado, frutas de temporada, brandy, Triple Seco y ginebra.', 15.00, 'Sangrías', ARRAY['Clásica', 'Frutal', 'Compartir'], 'https://i.ibb.co/4ZztkxSn/sangria-caleta.jpg'),
('Sangría Blanca', 'Bases de Vino Blanco. Frizzante Verdejo, fresas, melocotón, Triple Seco y Vodka de melocotón.', 16.00, 'Sangrías', ARRAY['Refrescante', 'Dulce', 'Frutal'], 'https://i.ibb.co/qTmqwBj/sangria-blanca.png'),
('Sangría Azul', 'Bases de Vino Blanco. Vino blanco, licor de Curaçao, Vodka de coco, carambolas y Soda-Prosecco.', 16.00, 'Sangrías', ARRAY['Exótica', 'Coco', 'Visual'], 'https://picsum.photos/seed/blue-sangria/600/400'),
('Rebujito Caleta', 'Especialidad. Vino Manzanilla o Fino, refresco de lima, lima natural y hierbabuena.', 15.00, 'Sangrías', ARRAY['Ligero', 'Tradicional', 'Refrescante'], 'https://picsum.photos/seed/rebujito/600/400'),
('Sangría Piña Colada', 'Especialidad. Frizzante Verdejo, Ron Extra Dry, Malibú, piña y coco.', 18.00, 'Sangrías', ARRAY['Cremosa', 'Tropical', 'Dulce'], 'https://picsum.photos/seed/pina-sangria/600/400'),
('Sangría Cava', 'Top de Gama. Cava Premium, Triple Seco, Brandy, Vodka de piña y mix de cítricos.', 20.00, 'Sangrías', ARRAY['Premium', 'Burbujas', 'Elegante'], 'https://picsum.photos/seed/cava-sangria/600/400'),

-- Cervezas
-- De Barril
('Caña de Barril', 'Cerveza de barril servida en caña.', 2.00, 'Cervezas', ARRAY['Fría', 'Ligera', 'Clásica'], 'https://i.ibb.co/TDR6f86D/ca-a-de-barril.jpg'),
('Copa de Barril', 'Cerveza de barril servida en copa.', 2.50, 'Cervezas', ARRAY['Fría', 'Clásica', 'Refrescante'], 'https://picsum.photos/seed/beer-glass/600/400'),
('Pinta de Barril', 'Cerveza de barril servida en pinta.', 3.50, 'Cervezas', ARRAY['Grande', 'Fría', 'Clásica'], 'https://picsum.photos/seed/beer-pint/600/400'),
('Jarra de Barril', 'Cerveza de barril servida en jarra.', 7.00, 'Cervezas', ARRAY['Grande', 'Compartir', 'Fría'], 'https://picsum.photos/seed/beer-mug/600/400'),

-- Botella
('Heineken Botella', 'Cerveza Heineken 33cl.', 2.50, 'Cervezas', ARRAY['Clásica', 'Internacional', 'Fría'], 'https://picsum.photos/seed/heineken/600/400'),
('Alhambra Reserva 1925', 'Cerveza premium Alhambra.', 3.00, 'Cervezas', ARRAY['Premium', 'Intensa', 'Artesanal'], 'https://picsum.photos/seed/alhambra/600/400'),
('Paulaner Trigo', 'Cerveza de trigo alemana.', 4.00, 'Cervezas', ARRAY['Trigo', 'Alemana', 'Cuerpo'], 'https://picsum.photos/seed/paulaner/600/400'),
('Judas', 'Cerveza belga fuerte.', 4.00, 'Cervezas', ARRAY['Fuerte', 'Belga', 'Intensa'], 'https://picsum.photos/seed/judas-beer/600/400'),

-- Sin Alcohol
('Heineken 0’0', 'Cerveza Heineken sin alcohol.', 2.50, 'Cervezas', ARRAY['Sin Alcohol', 'Ligera', 'Refrescante'], 'https://picsum.photos/seed/heineken-00/600/400'),
('Cruzcampo 0’0', 'Cerveza Cruzcampo sin alcohol.', 2.20, 'Cervezas', ARRAY['Sin Alcohol', 'Ligera', 'Refrescante'], 'https://picsum.photos/seed/cruzcampo/600/400'),

-- Sidras
('Ladrón de Manzanas', 'Sidra refrescante de manzana.', 2.00, 'Cervezas', ARRAY['Sidra', 'Dulce', 'Refrescante'], 'https://picsum.photos/seed/sidra-apple/600/400'),
('Bulmer’s Original', 'Sidra premium original.', 4.50, 'Cervezas', ARRAY['Sidra', 'Dulce', 'Frutal'], 'https://picsum.photos/seed/bulmers/600/400'),

-- Burgers
('The Pitbull Burger', 'Carne premium, tocineta crujiente y gratinado de queso con soplete en mesa. Con papas.', 15.00, 'Burgers', ARRAY['Premium', 'Show', 'Contundente'], 'https://i.ibb.co/W4Zp2sBd/burguer.jpg'),
('Tiki Urban Burger', 'Sabores exóticos y salsas de la casa en pan brioche artesanal.', 14.00, 'Burgers', ARRAY['Exótico', 'Brioche', 'Original'], 'https://i.ibb.co/xK72GW9y/Tiki-Urban-Burger.jpg'),

-- Platos Principales
('Paella Marinera', 'Arroces. Tradición española con el frescor del Caribe.', 25.00, 'Principales', ARRAY['Tradicional', 'Marisco', 'Arroz'], 'https://i.ibb.co/mCwb5B2L/paella-marinera.jpg'),
('Arroz Negro con Calamares', 'Arroces. Clásico de nuestra herencia Gallega-Española.', 22.00, 'Principales', ARRAY['Gallego', 'Intenso', 'Arroz'], 'https://picsum.photos/seed/black-rice/600/400'),
('Pescado del Día', 'Del Mar. Mero o Pargo preparado con técnicas vanguardistas.', 28.00, 'Principales', ARRAY['Fresco', 'Ligero', 'Saludable'], 'https://picsum.photos/seed/fish-dish/600/400'),

-- Entradas
('Aperitivos de la Bahía', 'Mar y Tierra. Selección de marisquería fresca (pulpo, calamares) con aceite de oliva.', 18.00, 'Entradas', ARRAY['Mar', 'Fresco', 'Compartir'], 'https://i.ibb.co/KxvKJmsg/aperitivos-de-la-bahia.jpg'),
('Tapas del Morro', 'Mar y Tierra. Croquetas artesanales y especialidades para compartir.', 12.00, 'Entradas', ARRAY['Casero', 'Fritura', 'Tapas'], 'https://picsum.photos/seed/tapas/600/400'),

-- Pizzas, Pastas y Ensaladas
('Pizzas Artesanales', 'Masa fina y crujiente con ingredientes frescos de la zona.', 12.00, 'Pizzas & Pastas', ARRAY['Crujiente', 'Casero', 'Familiar'], 'https://i.ibb.co/23984PgL/Pizzas-Artesanales.jpg'),
('Pasta Marina Fusion', 'Frutos del mar con pastas italianas de alta calidad.', 18.00, 'Pizzas & Pastas', ARRAY['Mar', 'Italiano', 'Gourmet'], 'https://picsum.photos/seed/seafood-pasta/600/400'),
('Ensaladas Tropicales', 'Opciones ligeras con frutas exóticas y aderezos cítricos.', 10.00, 'Pizzas & Pastas', ARRAY['Ligero', 'Veggie', 'Fresco'], 'https://picsum.photos/seed/tropical-salad/600/400'),

-- Zero Alcohol
('Magic Beach', 'Zumo de piña, naranja, melocotón, lima y granadina.', 4.50, 'Zero Alcohol', ARRAY['Niños', 'Dulce', 'Sin Alcohol'], 'https://picsum.photos/seed/kids-drink/600/400'),
('Dirty Banana Shake', 'Plátano, leche, azúcar y sirope de chocolate.', 4.50, 'Zero Alcohol', ARRAY['Cremoso', 'Chocolate', 'Niños'], 'https://picsum.photos/seed/banana-shake/600/400'),
('Fruit Smoothies', 'Batidos de frutas naturales de temporada.', 4.50, 'Zero Alcohol', ARRAY['Saludable', 'Frutal', 'Niños'], 'https://picsum.photos/seed/fruit-smoothie/600/400'),
('Tropical Beach', 'Mix de mango, fresa, manzana y zumo de uva.', 5.50, 'Zero Alcohol', ARRAY['Saludable', 'Sin Alcohol', 'Frutal'], 'https://picsum.photos/seed/tropical-mocktail/600/400'),
('Nada Colada', 'Piña natural, zumo y puré de coco.', 5.50, 'Zero Alcohol', ARRAY['Cremoso', 'Tropical', 'Sin Alcohol'], 'https://picsum.photos/seed/virgin-pina-colada/600/400'),
('Maracaibo', 'Fruta de la pasión, mango, maracuyá y un toque de canela.', 5.50, 'Zero Alcohol', ARRAY['Especiado', 'Exótico', 'Sin Alcohol'], 'https://picsum.photos/seed/exotic-mocktail/600/400'),
('Banana Twist', 'Combinado refrescante con base de plátano.', 5.50, 'Zero Alcohol', ARRAY['Refrescante', 'Plátano', 'Sin Alcohol'], 'https://picsum.photos/seed/banana-twist/600/400'),

-- Licores
-- Rones
('Cacique 500', 'Ron nacional extra añejo.', 7.50, 'Licores', ARRAY['Nacional', 'Añejo', 'Clásico'], 'https://picsum.photos/seed/ron-cacique/600/400'),
('Pampero Aniversario', 'Ron nacional premium en su icónica bolsa de cuero.', 7.50, 'Licores', ARRAY['Premium', 'Nacional', 'Elegante'], 'https://picsum.photos/seed/ron-pampero/600/400'),
('Diplomático Planas', 'Ron blanco premium añejado.', 7.00, 'Licores', ARRAY['Blanco', 'Premium', 'Suave'], 'https://picsum.photos/seed/ron-diplomatico-blanco/600/400'),
('Diplomático Mantuano', 'Ron venezolano premium con notas de frutos secos.', 7.50, 'Licores', ARRAY['Venezolano', 'Premium', 'Complejo'], 'https://picsum.photos/seed/ron-diplomatico/600/400'),
('Kraken Stormy', 'Ron especiado servido con Ginger Beer y lima.', 7.50, 'Licores', ARRAY['Especiado', 'Fuerte', 'Original'], 'https://picsum.photos/seed/ron-kraken/600/400'),
('Negroni Twist', 'Diplomático Mantuano, Vermouth, Campari y naranja.', 8.50, 'Licores', ARRAY['Amargo', 'Clásico', 'Fuerte'], 'https://picsum.photos/seed/negroni/600/400'),
('Zacapa Centenario 23', 'Ron de altura guatemalteco, añejado en sistema solera.', 12.00, 'Licores', ARRAY['Premium', 'Solera', 'Suave'], 'https://picsum.photos/seed/ron-zacapa/600/400'),
('Zacapa XO', 'Ron de Lujo. Añejado en Guatemala.', 21.00, 'Licores', ARRAY['Lujo', 'Añejo', 'Digestivo'], 'https://i.ibb.co/x0JGrkY/zacapa-xo.jpg'),

-- Ginebras (Perfect Served)
('Larios Rose', 'Ginebra con rodaja de fresa y Royal Bliss Berry.', 5.50, 'Licores', ARRAY['Frutal', 'Rosa', 'Dulce'], 'https://picsum.photos/seed/gin-larios/600/400'),
('Hendrick’s Gin', 'Ginebra con pepino y Royal Bliss Yuzu.', 8.00, 'Licores', ARRAY['Botánico', 'Premium', 'Refrescante'], 'https://picsum.photos/seed/gin-hendricks/600/400'),
('Nordés', 'Ginebra con laurel, uva y Royal Bliss Lima.', 8.00, 'Licores', ARRAY['Gallega', 'Floral', 'Original'], 'https://picsum.photos/seed/gin-nordes/600/400'),
('Gin Mare', 'Ginebra mediterránea con romero y albahaca.', 8.50, 'Licores', ARRAY['Mediterránea', 'Herbal', 'Premium'], 'https://picsum.photos/seed/gin-mare/600/400'),
('G’Vine', 'Ginebra con uvas, frambuesa y Royal Bliss Lima.', 9.00, 'Licores', ARRAY['Elegante', 'Uva', 'Premium'], 'https://picsum.photos/seed/gin-gvine/600/400'),

-- Whiskys & Bourbon
('Ballantine''s', 'Whisky escocés standard.', 5.50, 'Licores', ARRAY['Escocés', 'Standard', 'Clásico'], 'https://picsum.photos/seed/whisky-ballantines/600/400'),
('J&B', 'Whisky escocés standard.', 5.50, 'Licores', ARRAY['Escocés', 'Standard', 'Clásico'], 'https://picsum.photos/seed/whisky-jb/600/400'),
('Red Label', 'Whisky escocés standard.', 5.50, 'Licores', ARRAY['Escocés', 'Standard', 'Clásico'], 'https://picsum.photos/seed/whisky-red-label/600/400'),
('Johnnie Walker Black Label', 'Whisky escocés de 12 años.', 7.00, 'Licores', ARRAY['12 Años', 'Ahumado', 'Premium'], 'https://picsum.photos/seed/whisky-black-label/600/400'),
('Chivas 12', 'Whisky escocés de 12 años.', 7.50, 'Licores', ARRAY['12 Años', 'Suave', 'Premium'], 'https://picsum.photos/seed/whisky-chivas/600/400'),
('JW Blue Label', 'Whisky de Lujo. El tope de gama de Johnnie Walker.', 31.00, 'Licores', ARRAY['Lujo', 'Exclusivo', 'Intenso'], 'https://picsum.photos/seed/blue-label/600/400'),

-- Brandies
('Magno', 'Brandy Solera Reserva.', 5.00, 'Licores', ARRAY['Solera', 'Clásico', 'Fuerte'], 'https://picsum.photos/seed/brandy-magno/600/400'),
('Lustau Solera Gran Reserva', 'Brandy de Jerez de alta calidad.', 8.00, 'Licores', ARRAY['Jerez', 'Premium', 'Complejo'], 'https://picsum.photos/seed/brandy-lustau/600/400'),
('Torres 20', 'Brandy añejo de la familia Torres.', 9.00, 'Licores', ARRAY['Añejo', 'Elegante', 'Premium'], 'https://picsum.photos/seed/brandy-torres/600/400'),
('Jaime I', 'Brandy de Lujo. Reserva de la familia Torres.', 19.00, 'Licores', ARRAY['Elegante', 'Reserva', 'Fuerte'], 'https://picsum.photos/seed/brandy-jaime/600/400'),

-- Tequilas y Vodkas
('Don Julio Reposado', 'Tequila premium, recomendado en Cóctel Paloma.', 9.00, 'Licores', ARRAY['Premium', 'Cítrico', 'Suave'], 'https://picsum.photos/seed/tequila-don-julio/600/400'),
('Ciroc Ultra Premium', 'Vodka ultra premium disponible en varias esencias.', 7.00, 'Licores', ARRAY['Ultra Premium', 'Variado', 'Suave'], 'https://picsum.photos/seed/vodka-ciroc/600/400'),
('Grey Goose', 'Vodka francés ultra premium.', 8.00, 'Licores', ARRAY['Francés', 'Premium', 'Puro'], 'https://picsum.photos/seed/vodka-grey-goose/600/400');

-- Función para búsqueda por similitud (RAG)
CREATE OR REPLACE FUNCTION match_platillos (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  descripcion TEXT,
  precio DECIMAL,
  categoria TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    platillos.id,
    platillos.nombre,
    platillos.descripcion,
    platillos.precio,
    platillos.categoria,
    1 - (platillos.embedding <=> query_embedding) AS similarity
  FROM platillos
  WHERE 1 - (platillos.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Tabla para llamados al mesonero
CREATE TABLE IF NOT EXISTS llamados (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  mesa TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Realtime para la tabla llamados
ALTER PUBLICATION supabase_realtime ADD TABLE llamados;
