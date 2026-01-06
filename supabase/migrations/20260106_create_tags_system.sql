-- Migration: Create tags system for flexible item categorization
-- Tags allow users to add custom labels like "rare", "signed", "limited edition"

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280', -- Default gray color
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id) -- Each user can have unique tag names
);

-- Create item_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, tag_id) -- Prevent duplicate tag assignments
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tags" ON tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tags;

DROP POLICY IF EXISTS "Users can view item tags for their items" ON item_tags;
DROP POLICY IF EXISTS "Users can create item tags for their items" ON item_tags;
DROP POLICY IF EXISTS "Users can delete item tags for their items" ON item_tags;

-- RLS Policies for tags
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for item_tags (check via items ownership)
CREATE POLICY "Users can view item tags for their items"
  ON item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN collections c ON i.collection_id = c.id
      WHERE i.id = item_tags.item_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create item tags for their items"
  ON item_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items i
      JOIN collections c ON i.collection_id = c.id
      WHERE i.id = item_tags.item_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete item tags for their items"
  ON item_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN collections c ON i.collection_id = c.id
      WHERE i.id = item_tags.item_id
      AND c.owner_id = auth.uid()
    )
  );

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

-- Add comments
COMMENT ON TABLE tags IS 'User-defined tags for flexible item categorization';
COMMENT ON TABLE item_tags IS 'Junction table linking items to tags (many-to-many)';
