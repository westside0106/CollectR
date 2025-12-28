-- Push Subscriptions Tabelle für Web Push Notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint für user_id + endpoint
  UNIQUE(user_id, endpoint)
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS aktivieren
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- User kann eigene Subscriptions verwalten
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Server (Service Role) kann alle Subscriptions lesen für Benachrichtigungen
-- Das wird über die API mit service_role key gemacht
