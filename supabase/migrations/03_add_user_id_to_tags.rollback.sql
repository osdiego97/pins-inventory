-- Rollback 03: remove user_id from tags, restore shared taxonomy
DROP FUNCTION IF EXISTS delete_tag_with_associations(uuid, uuid);

-- Drop user-scoped policies
DROP POLICY IF EXISTS "Users can read own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can update own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- Restore original read-only policy
CREATE POLICY "Tags readable by all authenticated users" ON tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Drop user-scoped unique constraint
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_parent_id_user_id_key;

-- Restore original unique constraint
ALTER TABLE tags ADD CONSTRAINT tags_name_parent_id_key UNIQUE (name, parent_id);

-- Remove user_id column
ALTER TABLE tags DROP COLUMN IF EXISTS user_id;
