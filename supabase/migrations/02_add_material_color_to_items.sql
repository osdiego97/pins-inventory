-- Migration 02: Add material and color fields to items
-- Run after 01_rename_pins_to_items.sql

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS color text[];

-- Add a check constraint on material length
ALTER TABLE items
  ADD CONSTRAINT items_material_length CHECK (material IS NULL OR char_length(material) <= 50);
