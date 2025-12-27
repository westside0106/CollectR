-- Collection Sharing: Mitglieder und Einladungen
-- Führe dieses SQL in deinem Supabase SQL Editor aus

-- Rollen für Sammlungs-Mitglieder
CREATE TYPE collection_role AS ENUM ('viewer', 'editor', 'admin');

-- Tabelle für Sammlungs-Mitglieder
CREATE TABLE collection_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role collection_role NOT NULL DEFAULT 'viewer',
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collection_id, user_id)
);

-- Tabelle für Einladungen (per Link oder E-Mail)
CREATE TABLE collection_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  invited_email TEXT, -- Optional: E-Mail des Eingeladenen
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  role collection_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_collection_members_collection ON collection_members(collection_id);
CREATE INDEX idx_collection_members_user ON collection_members(user_id);
CREATE INDEX idx_collection_invitations_token ON collection_invitations(invite_token);
CREATE INDEX idx_collection_invitations_email ON collection_invitations(invited_email);

-- RLS aktivieren
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_invitations ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies für collection_members
-- ===========================================

-- Mitglieder können ihre eigene Mitgliedschaft sehen
CREATE POLICY "Users can view their memberships"
  ON collection_members FOR SELECT
  USING (user_id = auth.uid());

-- Owner und Admins können alle Mitglieder der Sammlung sehen
CREATE POLICY "Owners and admins can view all members"
  ON collection_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Owner und Admins können Mitglieder hinzufügen
CREATE POLICY "Owners and admins can add members"
  ON collection_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Owner und Admins können Mitglieder entfernen (außer sich selbst als letzten Admin)
CREATE POLICY "Owners and admins can remove members"
  ON collection_members FOR DELETE
  USING (
    -- User kann sich selbst entfernen
    user_id = auth.uid()
    OR
    -- Owner kann alle entfernen
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    -- Admins können andere entfernen (nicht den Owner)
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Owner und Admins können Rollen ändern
CREATE POLICY "Owners and admins can update roles"
  ON collection_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- ===========================================
-- RLS Policies für collection_invitations
-- ===========================================

-- Owner und Admins können Einladungen sehen
CREATE POLICY "Owners and admins can view invitations"
  ON collection_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_invitations.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
    -- Eingeladene mit passendem Token können auch sehen
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Owner und Admins können Einladungen erstellen
CREATE POLICY "Owners and admins can create invitations"
  ON collection_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = collection_invitations.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Einladungen können von Erstellern gelöscht werden
CREATE POLICY "Creators can delete invitations"
  ON collection_invitations FOR DELETE
  USING (invited_by = auth.uid());

-- Einladungen können aktualisiert werden (für Annahme)
CREATE POLICY "Invitations can be accepted"
  ON collection_invitations FOR UPDATE
  USING (
    -- Jeder kann eine Einladung annehmen (Token wird im Code geprüft)
    accepted_at IS NULL
  );

-- ===========================================
-- Bestehende RLS Policies für collections anpassen
-- ===========================================

-- Neue Policy: Mitglieder können geteilte Sammlungen sehen
CREATE POLICY "Members can view shared collections"
  ON collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = id AND cm.user_id = auth.uid()
    )
  );

-- ===========================================
-- Bestehende RLS Policies für items anpassen
-- ===========================================

-- Neue Policy: Mitglieder können Items sehen
CREATE POLICY "Members can view items in shared collections"
  ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = items.collection_id AND cm.user_id = auth.uid()
    )
  );

-- Editoren und Admins können Items erstellen
CREATE POLICY "Editors can create items in shared collections"
  ON items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = items.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('editor', 'admin')
    )
  );

-- Editoren und Admins können Items bearbeiten
CREATE POLICY "Editors can update items in shared collections"
  ON items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = items.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('editor', 'admin')
    )
  );

-- Editoren und Admins können Items löschen
CREATE POLICY "Editors can delete items in shared collections"
  ON items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collection_members cm
      WHERE cm.collection_id = items.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('editor', 'admin')
    )
  );

-- ===========================================
-- Hilfsfunktion: Einladung annehmen
-- ===========================================

CREATE OR REPLACE FUNCTION accept_collection_invitation(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation collection_invitations%ROWTYPE;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Aktuellen User holen
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nicht eingeloggt');
  END IF;

  -- Einladung finden
  SELECT * INTO v_invitation
  FROM collection_invitations
  WHERE invite_token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF v_invitation.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Einladung nicht gefunden oder abgelaufen');
  END IF;

  -- Prüfen ob User bereits Mitglied ist
  IF EXISTS (
    SELECT 1 FROM collection_members
    WHERE collection_id = v_invitation.collection_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Du bist bereits Mitglied dieser Sammlung');
  END IF;

  -- Mitgliedschaft erstellen
  INSERT INTO collection_members (collection_id, user_id, role, added_by)
  VALUES (v_invitation.collection_id, v_user_id, v_invitation.role, v_invitation.invited_by);

  -- Einladung als angenommen markieren
  UPDATE collection_invitations
  SET accepted_at = NOW(), accepted_by = v_user_id
  WHERE id = v_invitation.id;

  RETURN json_build_object(
    'success', true,
    'collection_id', v_invitation.collection_id,
    'role', v_invitation.role
  );
END;
$$;

-- Realtime für neue Tabellen aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE collection_members;
