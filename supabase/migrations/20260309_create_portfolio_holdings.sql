-- Portfolio Holdings: Aktien + Crypto Positionen pro User
-- Unterstützt Eingabe entweder als Anteile (quantity) ODER als investierter Betrag (invested_amount)

CREATE TABLE IF NOT EXISTS user_portfolio_holdings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Asset-Informationen
  type            TEXT NOT NULL CHECK (type IN ('stock', 'crypto')),
  ticker          TEXT NOT NULL,       -- z.B. "AAPL", "bitcoin", "ethereum"
  name            TEXT NOT NULL,       -- z.B. "Apple Inc.", "Bitcoin"
  coingecko_id    TEXT,                -- CoinGecko ID für Crypto (z.B. "bitcoin")

  -- Position: Anteile ODER investierter Betrag
  quantity        DECIMAL(18, 8),      -- Anzahl Aktien / Coins (optional)
  invested_amount DECIMAL(18, 2),      -- Investierter Betrag in Basiswährung (optional)
  purchase_price  DECIMAL(18, 6),      -- Kaufkurs pro Einheit (für P&L Berechnung)
  currency        TEXT DEFAULT 'EUR' NOT NULL,

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Mindestens eines von quantity oder invested_amount muss gesetzt sein
  CONSTRAINT quantity_or_invested CHECK (quantity IS NOT NULL OR invested_amount IS NOT NULL)
);

-- Index für schnelle User-Abfragen
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id
  ON user_portfolio_holdings(user_id);

-- RLS aktivieren
ALTER TABLE user_portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- User sieht und verwaltet nur eigene Holdings
CREATE POLICY "Eigene Portfolio-Holdings verwalten"
  ON user_portfolio_holdings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_portfolio_holdings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_portfolio_holdings_updated_at
  BEFORE UPDATE ON user_portfolio_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_holdings_updated_at();
