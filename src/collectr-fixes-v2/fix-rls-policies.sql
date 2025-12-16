-- ============================================
-- CollectR: RLS Policies Fix
-- Führe dieses Script in Supabase SQL Editor aus
-- ============================================

-- 1. Prüfen ob RLS aktiviert ist
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================
-- OPTION A: RLS DEAKTIVIEREN (für Entwicklung)
-- ============================================
-- Wenn du gerade entwickelst und RLS später aktivieren willst:

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_images DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION B: RLS POLICIES ERSTELLEN (für Produktion)
-- ============================================
-- Kommentiere Option A aus und nutze stattdessen diese Policies:

/*
-- Erst alle alten Policies löschen
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

DROP POLICY IF EXISTS "attributes_select" ON attribute_definitions;
DROP POLICY IF EXISTS "attributes_insert" ON attribute_definitions;
DROP POLICY IF EXISTS "attributes_update" ON attribute_definitions;
DROP POLICY IF EXISTS "attributes_delete" ON attribute_definitions;

-- RLS aktivieren
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_definitions ENABLE ROW LEVEL SECURITY;

-- CATEGORIES: Jeder eingeloggte User kann Kategorien in seinen Collections verwalten
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- ATTRIBUTE_DEFINITIONS: Über die Kategorie -> Collection -> Owner
CREATE POLICY "attributes_select" ON attribute_definitions
  FOR SELECT USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN collections col ON c.collection_id = col.id
      WHERE col.owner_id = auth.uid()
    )
  );

CREATE POLICY "attributes_insert" ON attribute_definitions
  FOR INSERT WITH CHECK (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN collections col ON c.collection_id = col.id
      WHERE col.owner_id = auth.uid()
    )
  );

CREATE POLICY "attributes_update" ON attribute_definitions
  FOR UPDATE USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN collections col ON c.collection_id = col.id
      WHERE col.owner_id = auth.uid()
    )
  );

CREATE POLICY "attributes_delete" ON attribute_definitions
  FOR DELETE USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN collections col ON c.collection_id = col.id
      WHERE col.owner_id = auth.uid()
    )
  );
*/

-- ============================================
-- PRÜFEN: Aktuelle RLS Status
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'attribute_definitions', 'items', 'collections');

-- ============================================
-- PRÜFEN: Aktuelle Policies
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
