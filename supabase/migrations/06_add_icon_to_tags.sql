-- Migration 06: add icon column to tags
-- Stores the Ionicons icon name chosen when creating an L1 category.
-- Nullable — existing tags fall back to the TAG_ICONS static map in the app.

ALTER TABLE tags ADD COLUMN IF NOT EXISTS icon text;
