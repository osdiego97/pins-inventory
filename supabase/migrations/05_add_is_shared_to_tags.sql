-- Migration 05: add is_shared column to tags
-- Shared tags (is_shared = true, parent_id = null) appear as subcategories
-- under every L1 in the tag picker. Regular L1s have is_shared = false.

ALTER TABLE tags
  ADD COLUMN is_shared boolean NOT NULL DEFAULT false;
