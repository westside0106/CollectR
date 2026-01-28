-- Migration: Fix searchable field issue
-- This migration adds a searchable field to the items table for full-text search
-- and removes any triggers that might be referencing a non-existent searchable field

-- First, check if there are any triggers referencing 'searchable' and drop them
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger
        WHERE tgrelid = 'items'::regclass
        AND tgname LIKE '%search%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_record.tgname, trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger: % on table %', trigger_record.tgname, trigger_record.table_name;
    END LOOP;
END $$;

-- Add searchable text field if it doesn't exist
-- This will be a tsvector field for full-text search
ALTER TABLE items
ADD COLUMN IF NOT EXISTS searchable tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C')
) STORED;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS items_searchable_idx ON items USING GIN (searchable);

-- Add a comment to explain the field
COMMENT ON COLUMN items.searchable IS 'Full-text search vector combining name (A weight), description (B weight), and notes (C weight)';
