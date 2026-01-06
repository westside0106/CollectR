-- Create service_costs table for cost monitoring
CREATE TABLE IF NOT EXISTS service_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hosting', 'database', 'ai', 'api', 'storage', 'other')),
  current_cost DECIMAL(10, 2) DEFAULT 0.00,
  monthly_limit DECIMAL(10, 2) DEFAULT 0.00,
  billing_cycle_start TIMESTAMPTZ NOT NULL,
  billing_cycle_end TIMESTAMPTZ NOT NULL,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE service_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service costs"
  ON service_costs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service costs"
  ON service_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service costs"
  ON service_costs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service costs"
  ON service_costs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_service_costs_user_id ON service_costs(user_id);
CREATE INDEX idx_service_costs_category ON service_costs(category);
CREATE INDEX idx_service_costs_billing_cycle ON service_costs(billing_cycle_start, billing_cycle_end);

-- Comment
COMMENT ON TABLE service_costs IS 'Tracks external service costs for budget monitoring';
