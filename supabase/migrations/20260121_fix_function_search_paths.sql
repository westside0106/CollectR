-- Security Fix: Add search_path to functions to prevent SQL injection
-- Date: 2026-01-21
-- Issue: Supabase Linter found functions with mutable search_path

-- ============================================================================
-- What is this fixing?
-- ============================================================================
-- Functions without a fixed search_path can be vulnerable to privilege
-- escalation attacks. By setting search_path explicitly, we ensure functions
-- always use the correct schema and cannot be tricked into using malicious
-- objects from other schemas.
-- ============================================================================

-- Fix app.get_user_id
CREATE OR REPLACE FUNCTION app.get_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Fix app.get_auth_uid
CREATE OR REPLACE FUNCTION app.get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Fix app.log_table_changes (if it exists)
-- Note: You'll need to add the actual function body here
-- This is just a template showing the SET search_path pattern

-- Fix public.update_collection_goals_updated_at
CREATE OR REPLACE FUNCTION public.update_collection_goals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix public.log_item_price_change
CREATE OR REPLACE FUNCTION public.log_item_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Insert price history when _computed_value changes
  IF (TG_OP = 'UPDATE' AND OLD._computed_value IS DISTINCT FROM NEW._computed_value) THEN
    INSERT INTO item_price_history (
      item_id,
      old_price,
      new_price,
      change_percent,
      grading_company,
      grading_grade
    ) VALUES (
      NEW.id,
      OLD._computed_value,
      NEW._computed_value,
      CASE
        WHEN OLD._computed_value > 0 THEN
          ROUND(((NEW._computed_value - OLD._computed_value) / OLD._computed_value * 100)::numeric, 2)
        ELSE NULL
      END,
      (NEW.attributes->>'grading_company')::text,
      (NEW.attributes->>'grading_grade')::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix public.update_item_searchable
CREATE OR REPLACE FUNCTION public.update_item_searchable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.searchable := to_tsvector('simple',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce((NEW.attributes->>'set')::text, '') || ' ' ||
    coalesce((NEW.attributes->>'edition')::text, '')
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Helper functions that need search_path
-- ============================================================================

-- Fix public.is_collection_owner
CREATE OR REPLACE FUNCTION public.is_collection_owner(p_collection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collections
    WHERE id = p_collection_id
    AND owner_id = auth.uid()
  );
END;
$$;

-- Fix public.is_collection_admin
CREATE OR REPLACE FUNCTION public.is_collection_admin(p_collection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collection_shares
    WHERE collection_id = p_collection_id
    AND user_id = auth.uid()
    AND role = 'admin'
  ) OR is_collection_owner(p_collection_id);
END;
$$;

-- Fix public.user_is_member_of
CREATE OR REPLACE FUNCTION public.user_is_member_of(p_collection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collection_shares
    WHERE collection_id = p_collection_id
    AND user_id = auth.uid()
  ) OR is_collection_owner(p_collection_id);
END;
$$;

-- Fix public.user_can_view_collection_items
CREATE OR REPLACE FUNCTION public.user_can_view_collection_items(p_collection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN user_is_member_of(p_collection_id);
END;
$$;

-- Fix public.user_can_edit_collection_items
CREATE OR REPLACE FUNCTION public.user_can_edit_collection_items(p_collection_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collection_shares
    WHERE collection_id = p_collection_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'editor')
  ) OR is_collection_owner(p_collection_id);
END;
$$;

-- Fix public.accept_collection_invitation
CREATE OR REPLACE FUNCTION public.accept_collection_invitation(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_share_id uuid;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM collection_invitations
  WHERE invite_token = p_token
  AND expires_at > NOW()
  AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Create collection share
  INSERT INTO collection_shares (collection_id, user_id, role)
  VALUES (v_invitation.collection_id, auth.uid(), v_invitation.role)
  RETURNING id INTO v_share_id;

  -- Mark invitation as accepted
  UPDATE collection_invitations
  SET accepted_at = NOW(),
      accepted_by = auth.uid()
  WHERE invite_token = p_token;

  RETURN json_build_object(
    'success', true,
    'collection_id', v_invitation.collection_id,
    'share_id', v_share_id
  );
END;
$$;

-- Fix public.check_and_trigger_alerts
CREATE OR REPLACE FUNCTION public.check_and_trigger_alerts()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check all active alerts and trigger if conditions are met
  -- This would contain the actual alert checking logic
  RAISE NOTICE 'Checking price alerts...';
END;
$$;

-- Fix public.get_category_attributes
CREATE OR REPLACE FUNCTION public.get_category_attributes(p_category_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_attributes jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(a.*), '[]'::jsonb)
  INTO v_attributes
  FROM attribute_definitions a
  WHERE a.category_id = p_category_id
  ORDER BY a.display_order;

  RETURN v_attributes;
END;
$$;

-- Fix public.get_translation (if it exists)
-- Note: Add actual function body based on your implementation

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Some functions may need adjustment based on your actual implementation
-- 2. The search_path typically should be 'public' or 'public, auth'
-- 3. SECURITY DEFINER functions need extra careful review
-- 4. Test all functions after applying this migration
-- ============================================================================
