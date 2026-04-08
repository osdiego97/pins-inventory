-- Rollback 05: remove is_shared column from tags

ALTER TABLE tags
  DROP COLUMN is_shared;
