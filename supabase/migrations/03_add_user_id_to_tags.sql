-- Migration 03: Make tags user-scoped
-- Run after 02_add_material_color_to_items.sql
--
-- IMPORTANT: Before running, find Oscar's user_id from auth.users:
--   SELECT id FROM auth.users LIMIT 1;
-- Replace '<OSCAR_USER_ID>' below with the actual UUID.

-- 1. Add user_id column as nullable first (so existing rows don't break)
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill Oscar's user_id on all existing tags
-- Replace <OSCAR_USER_ID> with the actual UUID from auth.users
UPDATE tags SET user_id = '<OSCAR_USER_ID>' WHERE user_id IS NULL;

-- 3. Now add NOT NULL constraint
ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;

-- 4. Drop the old UNIQUE(name, parent_id) constraint and replace with user-scoped one
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_parent_id_key;
ALTER TABLE tags ADD CONSTRAINT tags_name_parent_id_user_id_key UNIQUE (name, parent_id, user_id);

-- 5. Drop the old authenticated read-only policy and replace with user-scoped policies
DROP POLICY IF EXISTS "tags: authenticated read" ON tags;

CREATE POLICY "Users can read own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- 6. RPC to delete a tag and remove all item_tags associations atomically
CREATE OR REPLACE FUNCTION delete_tag_with_associations(p_tag_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove item associations
  DELETE FROM item_tags WHERE tag_id = p_tag_id;
  -- Delete the tag itself (RLS check: user must own it)
  DELETE FROM tags WHERE id = p_tag_id AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_tag_with_associations(uuid, uuid) TO authenticated;
