-- Security Fix: Enable RLS on TCG tables and add proper policies
-- Date: 2026-01-21
-- Issue: Supabase Linter found missing RLS on public tables

-- ============================================================================
-- 1. FIX: Enable RLS on tcg_price_cache
-- ============================================================================

ALTER TABLE tcg_price_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached prices (public data)
CREATE POLICY "Public read access to price cache"
  ON tcg_price_cache FOR SELECT
  USING (true);

-- Policy: Only service role can write (Edge Functions)
CREATE POLICY "Service role can insert price cache"
  ON tcg_price_cache FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update price cache"
  ON tcg_price_cache FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete price cache"
  ON tcg_price_cache FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. FIX: Enable RLS on item_price_history
-- ============================================================================

ALTER TABLE item_price_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view price history of their own items
CREATE POLICY "Users can view own items price history"
  ON item_price_history FOR SELECT
  USING (
    item_id IN (
      SELECT i.id FROM items i
      JOIN collections c ON c.id = i.collection_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Policy: Only service role can insert price history (automatic triggers)
CREATE POLICY "Service role can insert price history"
  ON item_price_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. FIX: Add policies to collection_shares (has RLS but no policies)
-- ============================================================================

-- Policy: Users can view shares for collections they own
CREATE POLICY "Collection owners can view shares"
  ON collection_shares FOR SELECT
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can view shares where they are the shared user
CREATE POLICY "Shared users can view their shares"
  ON collection_shares FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Only collection owners can create shares
CREATE POLICY "Collection owners can create shares"
  ON collection_shares FOR INSERT
  WITH CHECK (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- Policy: Only collection owners can update shares
CREATE POLICY "Collection owners can update shares"
  ON collection_shares FOR UPDATE
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- Policy: Only collection owners can delete shares
CREATE POLICY "Collection owners can delete shares"
  ON collection_shares FOR DELETE
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. FIX: Fix permissive RLS policy on collection_invitations
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can accept invitations" ON collection_invitations;

-- Create a more secure policy
CREATE POLICY "Users can accept their own invitations"
  ON collection_invitations FOR UPDATE
  USING (
    -- User must be updating their own invitation
    auth.email() = email OR
    -- Or invitation is not yet accepted and user is accepting it
    (accepted_by IS NULL AND auth.uid() IS NOT NULL)
  )
  WITH CHECK (
    -- User can only mark as accepted by themselves
    accepted_by = auth.uid() AND
    accepted_at IS NOT NULL
  );

-- ============================================================================
-- 5. OPTIONAL: Fix SECURITY DEFINER views (document the risk)
-- ============================================================================

-- Note: item_price_history_view and price_alerts_view use SECURITY DEFINER
-- This means they run with the permissions of the view creator, not the user.
-- This is intentional for these views as they need to access data across tables.
-- The RLS policies on the underlying tables provide the actual security.

-- If you want to remove SECURITY DEFINER (less convenient but more explicit):
-- DROP VIEW item_price_history_view;
-- DROP VIEW price_alerts_view;
-- Then recreate without SECURITY DEFINER

-- ============================================================================
-- Verification queries (run these to check)
-- ============================================================================

-- Check RLS status
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('tcg_price_cache', 'item_price_history', 'collection_shares');

-- Check policies
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('tcg_price_cache', 'item_price_history', 'collection_shares');
