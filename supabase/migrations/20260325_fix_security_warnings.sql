-- Security Fix: function_search_path_mutable für 4 Funktionen
-- Date: 2026-03-25
-- Issue: Supabase Security Advisor – 5 Warnings
--
-- Warnings 1–4: function_search_path_mutable
--   Funktionen ohne fixen search_path sind anfällig für Privilege-Escalation-Angriffe.
--   Fix: SET search_path = public via ALTER FUNCTION
--
-- Warning 5: auth_leaked_password_protection
--   Kann NICHT per SQL aktiviert werden.
--   Fix: Supabase Dashboard → Authentication → Sign In / Up → Leaked Password Protection → aktivieren

-- ============================================================================
-- 1. FIX: public.handle_new_user (Auth Trigger – neuer User → Profil anlegen)
-- ============================================================================

ALTER FUNCTION public.handle_new_user()
  SET search_path = public;

-- ============================================================================
-- 2. FIX: public.messages_broadcast_trigger (Realtime Broadcast Trigger)
-- ============================================================================

ALTER FUNCTION public.messages_broadcast_trigger()
  SET search_path = public;

-- ============================================================================
-- 3. FIX: public.is_room_member
-- ============================================================================

-- Variante für is_room_member(uuid, uuid):
-- Falls die Funktion andere Argumente hat, den Aufruf entsprechend anpassen.
DO $$
BEGIN
  -- Versuche alle möglichen Signaturen
  BEGIN
    EXECUTE 'ALTER FUNCTION public.is_room_member(uuid, uuid) SET search_path = public';
    RAISE NOTICE 'Fixed: is_room_member(uuid, uuid)';
  EXCEPTION WHEN others THEN
    BEGIN
      EXECUTE 'ALTER FUNCTION public.is_room_member(uuid) SET search_path = public';
      RAISE NOTICE 'Fixed: is_room_member(uuid)';
    EXCEPTION WHEN others THEN
      RAISE WARNING 'is_room_member: Signatur nicht gefunden – bitte manuell im SQL Editor prüfen';
    END;
  END;
END;
$$;

-- ============================================================================
-- 4. FIX: public.get_translation
-- ============================================================================

DO $$
BEGIN
  -- Variante (text, text) – Schlüssel + Sprache
  BEGIN
    EXECUTE 'ALTER FUNCTION public.get_translation(text, text) SET search_path = public';
    RAISE NOTICE 'Fixed: get_translation(text, text)';
  EXCEPTION WHEN others THEN
    -- Variante (text) – nur Schlüssel
    BEGIN
      EXECUTE 'ALTER FUNCTION public.get_translation(text) SET search_path = public';
      RAISE NOTICE 'Fixed: get_translation(text)';
    EXCEPTION WHEN others THEN
      RAISE WARNING 'get_translation: Signatur nicht gefunden – bitte manuell im SQL Editor prüfen';
    END;
  END;
END;
$$;

-- ============================================================================
-- HINWEIS: Warning 5 – Leaked Password Protection
-- ============================================================================
-- Diese Warnung kann NICHT per SQL behoben werden.
-- Aktivierung im Dashboard:
--   Supabase Dashboard → Authentication → Sign In / Up
--   → Scroll zu "Password Security"
--   → "Leaked Password Protection" → Toggle ON
--   (Prüft neue Passwörter gegen HaveIBeenPwned.org)
-- ============================================================================

-- ============================================================================
-- Verification
-- ============================================================================

-- SELECT p.proname, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
-- AND p.proname IN ('handle_new_user', 'messages_broadcast_trigger', 'is_room_member', 'get_translation');
