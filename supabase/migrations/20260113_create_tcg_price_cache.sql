-- Create TCG Price Cache Table
-- This table stores cached pricing data from pokemontcg.io API
-- to reduce API calls and improve performance

CREATE TABLE IF NOT EXISTS tcg_price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  card_name TEXT NOT NULL,
  card_id TEXT,
  set_name TEXT,
  card_number TEXT,
  raw_price JSONB,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on cache_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_tcg_price_cache_cache_key ON tcg_price_cache(cache_key);

-- Create index on updated_at for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_tcg_price_cache_updated_at ON tcg_price_cache(updated_at);

-- Create index on card_name for search queries
CREATE INDEX IF NOT EXISTS idx_tcg_price_cache_card_name ON tcg_price_cache(card_name);

-- Add comment to table
COMMENT ON TABLE tcg_price_cache IS 'Cache for TCG card pricing data from pokemontcg.io API. Cache expires after 24 hours.';

-- Add comment to columns
COMMENT ON COLUMN tcg_price_cache.cache_key IS 'Unique cache key format: cardName|setName|cardNumber';
COMMENT ON COLUMN tcg_price_cache.raw_price IS 'JSON object containing min, max, avg, market prices in EUR';
COMMENT ON COLUMN tcg_price_cache.source IS 'API source, e.g., "pokemontcg.io"';
