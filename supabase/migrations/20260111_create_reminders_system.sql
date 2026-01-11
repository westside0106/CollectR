-- Migration: Create reminders system for item notifications
-- Allows users to set reminders for items (e.g., "Return lent item", "Renew insurance")

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reminder_date TIMESTAMPTZ NOT NULL,
  reminder_type TEXT DEFAULT 'once' CHECK (reminder_type IN ('once', 'recurring_weekly', 'recurring_monthly', 'recurring_yearly')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON reminders;

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_item_id ON reminders(item_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date) WHERE NOT is_completed;

-- Add comments
COMMENT ON TABLE reminders IS 'User reminders for items (e.g., return lent items, renew insurance)';
COMMENT ON COLUMN reminders.reminder_type IS 'Type: once (one-time), recurring_weekly, recurring_monthly, recurring_yearly';
