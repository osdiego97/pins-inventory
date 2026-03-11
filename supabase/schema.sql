-- =============================================================
-- Pins Inventory — Supabase Schema
-- Run this in the Supabase SQL Editor (once, on a fresh project)
-- =============================================================


-- -------------------------
-- TABLES
-- -------------------------

CREATE TABLE pins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description     text NOT NULL CHECK (char_length(description) <= 100),
  country         text,
  city            text,
  region          text,
  image_url       text,
  acquired_year   smallint CHECK (acquired_year >= 1900 AND acquired_year <= 2100),
  is_commemorative boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  parent_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE (name, parent_id)
);

CREATE TABLE pin_tags (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id  uuid NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (pin_id, tag_id)
);


-- -------------------------
-- ROW LEVEL SECURITY
-- -------------------------

ALTER TABLE pins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_tags ENABLE ROW LEVEL SECURITY;

-- pins: users can only access their own rows
CREATE POLICY "pins: own rows only"
  ON pins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- tags: readable by any authenticated user (taxonomy is shared, no user_id)
CREATE POLICY "tags: authenticated read"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

-- pin_tags: users can only access their own rows
CREATE POLICY "pin_tags: own rows only"
  ON pin_tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- -------------------------
-- INDEXES
-- -------------------------

CREATE INDEX pins_user_id_idx     ON pins(user_id);
CREATE INDEX pin_tags_pin_id_idx  ON pin_tags(pin_id);
CREATE INDEX pin_tags_tag_id_idx  ON pin_tags(tag_id);
CREATE INDEX pin_tags_user_id_idx ON pin_tags(user_id);


-- -------------------------
-- TAG TAXONOMY SEED
-- -------------------------

WITH l1 AS (
  INSERT INTO tags (name) VALUES
    ('Geografía'),
    ('Turismo'),
    ('Fútbol'),
    ('Series y Películas'),
    ('Hard Rock'),
    ('Música'),
    ('Marcas'),
    ('Militar'),
    ('Símbolos'),
    ('Animales'),
    ('Objetos')
  RETURNING id, name
)
INSERT INTO tags (name, parent_id)
SELECT sub.name, l1.id
FROM l1
JOIN (VALUES
  ('Geografía',         'Escudo de Ciudad'),
  ('Geografía',         'Escudo de Región'),
  ('Geografía',         'Escudo de País'),
  ('Geografía',         'Bandera de Ciudad'),
  ('Geografía',         'Bandera de Región'),
  ('Geografía',         'Bandera de País'),
  ('Turismo',           'Evento'),
  ('Fútbol',            'Club'),
  ('Fútbol',            'Selección'),
  ('Fútbol',            'Jugador'),
  ('Fútbol',            'Evento'),
  ('Series y Películas','Disney'),
  ('Series y Películas','Harry Potter'),
  ('Series y Películas','Otros'),
  ('Marcas',            'Logotipo'),
  ('Marcas',            'Producto'),
  ('Marcas',            'Otros'),
  ('Símbolos',          'Celta'),
  ('Símbolos',          'Político'),
  ('Símbolos',          'Social'),
  ('Símbolos',          'Religión'),
  ('Símbolos',          'Otros'),
  ('Objetos',           'Vehículo'),
  ('Objetos',           'Instrumento musical'),
  ('Objetos',           'Otros')
) AS sub(parent_name, name) ON l1.name = sub.parent_name;


-- -------------------------
-- STORAGE BUCKET
-- -------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('pins', 'pins', false);

CREATE POLICY "storage: upload own images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pins'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage: read own images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pins'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage: delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pins'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
