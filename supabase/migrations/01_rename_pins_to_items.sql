-- Migration 01: Rename pins → items, pin_tags → item_tags
-- Run this first. All existing rows are preserved.

-- 1. Rename the main table
ALTER TABLE pins RENAME TO items;

-- 2. Rename the junction table
ALTER TABLE pin_tags RENAME TO item_tags;

-- 3. Rename the FK column in item_tags
ALTER TABLE item_tags RENAME COLUMN pin_id TO item_id;

-- 4. Rename RPC function that references pins
-- (decrement_collection_numbers_after uses p_user_id, queries 'pins' internally)
-- Drop the old function and recreate targeting 'items'
DROP FUNCTION IF EXISTS decrement_collection_numbers_after(integer, uuid);

CREATE OR REPLACE FUNCTION decrement_collection_numbers_after(p_deleted_number integer, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE items
  SET collection_number = collection_number - 1
  WHERE user_id = p_user_id
    AND collection_number > p_deleted_number;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_collection_numbers_after(integer, uuid) TO authenticated;

-- 5. Update RLS policies on items (they were on 'pins')
-- Policies are carried over automatically with the table rename on Supabase.
-- If not, recreate:
-- DROP POLICY IF EXISTS "Users can manage own items" ON items;
-- CREATE POLICY "Users can manage own items" ON items
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Update RLS policies on item_tags
-- DROP POLICY IF EXISTS "Users can manage own item_tags" ON item_tags;
-- CREATE POLICY "Users can manage own item_tags" ON item_tags
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
