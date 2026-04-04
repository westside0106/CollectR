-- Security Fix: Enable RLS on rooms and room_members tables
-- Date: 2026-03-25
-- Issue: Supabase Security Advisor – RLS Disabled in Public (rls_disabled_in_public)
-- Betroffen: public.rooms, public.room_members

-- ============================================================================
-- 1. FIX: Enable RLS on rooms
-- ============================================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Raum-Ersteller und Mitglieder können Räume sehen
CREATE POLICY "Room members can view rooms"
  ON rooms FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
  );

-- Nur authentifizierte User können Räume erstellen
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Nur der Ersteller kann den Raum aktualisieren
CREATE POLICY "Room creator can update rooms"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Nur der Ersteller kann den Raum löschen
CREATE POLICY "Room creator can delete rooms"
  ON rooms FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- 2. FIX: Enable RLS on room_members
-- ============================================================================

ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Mitglieder eines Raums können andere Mitglieder sehen
CREATE POLICY "Room members can view other members"
  ON room_members FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Raum-Ersteller kann Mitglieder hinzufügen
CREATE POLICY "Room creator can add members"
  ON room_members FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- Raum-Ersteller kann Mitglieder entfernen, User können sich selbst entfernen
CREATE POLICY "Room creator or self can remove members"
  ON room_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- ============================================================================
-- Verification queries
-- ============================================================================

-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('rooms', 'room_members');

-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('rooms', 'room_members');
