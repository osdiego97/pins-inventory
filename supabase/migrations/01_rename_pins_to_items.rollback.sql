-- Rollback 01: rename items → pins, item_tags → pin_tags
-- Run in reverse order from the forward migration.

-- 1. Restore the original RPC
DROP FUNCTION IF EXISTS decrement_collection_numbers_after(integer, uuid);

CREATE OR REPLACE FUNCTION decrement_collection_numbers_after(p_deleted_number integer, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pins
  SET collection_number = collection_number - 1
  WHERE user_id = p_user_id
    AND collection_number > p_deleted_number;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_collection_numbers_after(integer, uuid) TO authenticated;

-- 2. Rename item_id column back to pin_id
ALTER TABLE item_tags RENAME COLUMN item_id TO pin_id;

-- 3. Rename tables back
ALTER TABLE item_tags RENAME TO pin_tags;
ALTER TABLE items RENAME TO pins;
