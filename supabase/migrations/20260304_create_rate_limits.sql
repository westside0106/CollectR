-- Rate Limits Tabelle für Edge Function Throttling
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Kein RLS nötig – wird ausschließlich über service_role aus Edge Functions beschrieben.
-- Kein Zugriff für anon/authenticated Roles.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Keine Policies → kein User-Zugriff über Supabase Client (anon/auth)
-- Edge Functions nutzen SERVICE_ROLE_KEY, der RLS umgeht.

-- Automatisches Cleanup alter Einträge (älter als 24h)
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON public.rate_limits (window_start);

-- Atomare Rate-Limit-Funktion
-- Gibt zurück: allowed (boolean), remaining (integer)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET
      count = CASE
        WHEN rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          THEN now()
        ELSE rate_limits.window_start
      END
  RETURNING rate_limits.count INTO v_count;

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    GREATEST(0, p_max_requests - v_count);
END;
$$;

-- Cleanup-Funktion für alte Einträge (kann via cron aufgerufen werden)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '24 hours';
$$;
