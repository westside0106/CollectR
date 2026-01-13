-- Create Price Alerts Table
-- Allows users to set up alerts when item prices cross certain thresholds

CREATE TYPE alert_condition AS ENUM ('above', 'below', 'change_percent');
CREATE TYPE alert_status AS ENUM ('active', 'triggered', 'disabled');

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  condition alert_condition NOT NULL,
  threshold_value DECIMAL(10, 2) NOT NULL,
  status alert_status DEFAULT 'active',
  last_checked_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,
  triggered_price DECIMAL(10, 2),
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_item_id ON price_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(status, last_checked_at) WHERE status = 'active';

-- Add comments
COMMENT ON TABLE price_alerts IS 'Price alerts for items. Users get notified when conditions are met.';
COMMENT ON COLUMN price_alerts.condition IS 'Alert type: above (price goes above threshold), below (price goes below threshold), change_percent (price changes by X%)';
COMMENT ON COLUMN price_alerts.threshold_value IS 'Threshold value in EUR or percentage';
COMMENT ON COLUMN price_alerts.status IS 'Alert status: active (monitoring), triggered (condition met), disabled (paused by user)';

-- Row Level Security
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own alerts
CREATE POLICY "Users can view own alerts"
  ON price_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create alerts
CREATE POLICY "Users can create alerts"
  ON price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts"
  ON price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts"
  ON price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- View for alerts with item details
CREATE OR REPLACE VIEW price_alerts_view AS
SELECT
  pa.id,
  pa.user_id,
  pa.item_id,
  i.name as item_name,
  i._computed_value as current_price,
  i.purchase_currency as currency,
  pa.condition,
  pa.threshold_value,
  pa.status,
  pa.last_checked_at,
  pa.triggered_at,
  pa.triggered_price,
  pa.notification_sent,
  pa.created_at,
  -- Calculate if condition is met
  CASE
    WHEN pa.condition = 'above' AND i._computed_value >= pa.threshold_value THEN true
    WHEN pa.condition = 'below' AND i._computed_value <= pa.threshold_value THEN true
    WHEN pa.condition = 'change_percent' THEN
      -- Check if price changed by threshold_value percent from last triggered price or creation price
      COALESCE(
        ABS((i._computed_value - COALESCE(pa.triggered_price, i._computed_value)) / NULLIF(COALESCE(pa.triggered_price, i._computed_value), 0) * 100) >= pa.threshold_value,
        false
      )
    ELSE false
  END as condition_met
FROM price_alerts pa
JOIN items i ON pa.item_id = i.id
WHERE pa.status = 'active';

COMMENT ON VIEW price_alerts_view IS 'Price alerts with item details and condition_met calculation';

-- Function to check and trigger alerts
CREATE OR REPLACE FUNCTION check_and_trigger_alerts()
RETURNS TABLE(alert_id UUID, item_name TEXT, current_price DECIMAL, threshold_value DECIMAL, condition alert_condition) AS $$
BEGIN
  -- Find all active alerts where condition is met
  RETURN QUERY
  WITH triggered AS (
    SELECT
      pa.id,
      i.name,
      i._computed_value,
      pa.threshold_value,
      pa.condition
    FROM price_alerts pa
    JOIN items i ON pa.item_id = i.id
    WHERE pa.status = 'active'
    AND (
      (pa.condition = 'above' AND i._computed_value >= pa.threshold_value) OR
      (pa.condition = 'below' AND i._computed_value <= pa.threshold_value) OR
      (pa.condition = 'change_percent' AND
        ABS((i._computed_value - COALESCE(pa.triggered_price, i._computed_value)) / NULLIF(COALESCE(pa.triggered_price, i._computed_value), 0) * 100) >= pa.threshold_value
      )
    )
  )
  UPDATE price_alerts pa
  SET
    status = 'triggered',
    triggered_at = NOW(),
    triggered_price = (SELECT _computed_value FROM items WHERE id = pa.item_id),
    last_checked_at = NOW()
  FROM triggered t
  WHERE pa.id = t.id
  RETURNING pa.id, t.name, t._computed_value, t.threshold_value, t.condition;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_trigger_alerts IS 'Checks all active alerts and triggers those where condition is met. Returns list of triggered alerts.';
