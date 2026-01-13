-- Create Price History Table
-- Tracks historical price data for items over time

CREATE TABLE IF NOT EXISTS item_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price_value DECIMAL(10, 2) NOT NULL,
  price_currency TEXT DEFAULT 'EUR',
  price_source TEXT, -- 'pokemontcg.io', 'manual', 'ygoprodeck.com', 'scryfall', etc.
  price_type TEXT DEFAULT 'estimated', -- 'purchase', 'estimated', 'sold'
  grading_snapshot JSONB, -- Snapshot of grading at time of price check
  raw_price_data JSONB, -- Full API response for reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON item_price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON item_price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_item_date ON item_price_history(item_id, created_at DESC);

-- Add comment
COMMENT ON TABLE item_price_history IS 'Historical price tracking for items. Automatically populated when prices are updated via API.';
COMMENT ON COLUMN item_price_history.price_source IS 'Source of the price: pokemontcg.io, manual, ygoprodeck.com, scryfall, etc.';
COMMENT ON COLUMN item_price_history.grading_snapshot IS 'Snapshot of item grading at time of price check (for TCG items)';
COMMENT ON COLUMN item_price_history.raw_price_data IS 'Full API response stored for future reference';

-- Function to automatically log price changes
CREATE OR REPLACE FUNCTION log_item_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if _computed_value changed and is not null
  IF (NEW._computed_value IS DISTINCT FROM OLD._computed_value) AND NEW._computed_value IS NOT NULL THEN
    INSERT INTO item_price_history (
      item_id,
      price_value,
      price_currency,
      price_type,
      grading_snapshot
    ) VALUES (
      NEW.id,
      NEW._computed_value,
      NEW.purchase_currency,
      'estimated',
      NEW.attributes->'grading' -- Store grading snapshot
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on items table
DROP TRIGGER IF EXISTS trigger_log_price_change ON items;
CREATE TRIGGER trigger_log_price_change
  AFTER UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION log_item_price_change();

-- View for easy price history queries with item details
CREATE OR REPLACE VIEW item_price_history_view AS
SELECT
  ph.id,
  ph.item_id,
  i.name as item_name,
  i.collection_id,
  ph.price_value,
  ph.price_currency,
  ph.price_source,
  ph.price_type,
  ph.grading_snapshot,
  ph.created_at,
  -- Calculate price change from previous entry
  LAG(ph.price_value) OVER (PARTITION BY ph.item_id ORDER BY ph.created_at) as previous_price,
  ph.price_value - LAG(ph.price_value) OVER (PARTITION BY ph.item_id ORDER BY ph.created_at) as price_change,
  CASE
    WHEN LAG(ph.price_value) OVER (PARTITION BY ph.item_id ORDER BY ph.created_at) IS NOT NULL
    THEN ROUND(((ph.price_value - LAG(ph.price_value) OVER (PARTITION BY ph.item_id ORDER BY ph.created_at)) / LAG(ph.price_value) OVER (PARTITION BY ph.item_id ORDER BY ph.created_at) * 100)::numeric, 2)
    ELSE NULL
  END as price_change_percent
FROM item_price_history ph
JOIN items i ON ph.item_id = i.id
ORDER BY ph.created_at DESC;

COMMENT ON VIEW item_price_history_view IS 'Price history with calculated changes and item details';
