-- Rollback 02: remove material and color from items
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_material_length;
ALTER TABLE items DROP COLUMN IF EXISTS material;
ALTER TABLE items DROP COLUMN IF EXISTS color;
