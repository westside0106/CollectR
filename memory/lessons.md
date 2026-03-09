---
tags: [lessons, debugging]
updated: 2026-03-04
---

# Lessons Learned

## Supabase / Datenbank

### RLS debuggen (bei 403/500 Errors)
```sql
-- 1. RLS-Status prüfen
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 2. Alle Policies einer Tabelle
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'items';

-- 3. Als User testen (im SQL Editor)
SELECT auth.uid();
SELECT * FROM collections WHERE owner_id = auth.uid();
```
- **403** → Policy fehlt oder falsches USING/WITH CHECK
- **500** → Supabase SQL Editor verwenden (nicht App-Konsole!)
- Immer Hard Reload nach Schema-Änderungen

### Migrationen
- **NIE** `CREATE TABLE IF NOT EXISTS` bei existierenden Tabellen
- Erst Schema prüfen: `SELECT column_name FROM information_schema.columns WHERE table_name = 'items'`
- Nur fehlende Spalten hinzufügen

### SECURITY DEFINER Functions
- Immer `SET search_path = public` angeben
- Ohne explizites Schema → potenzielle Search-Path-Injection

---

## Next.js / React

### createClient() – Vercel Prerender Error
**Problem:** `createClient()` beim Modulimport aufgerufen → Vercel bricht Prerender ab
**Fix:** Immer in `useEffect()` oder in Server Components aufrufen
```typescript
// FALSCH:
const supabase = createClient(url, key)  // Top-Level

// RICHTIG:
useEffect(() => {
  const supabase = createClient(url, key)
  // ...
}, [])
```

### TypeScript `unknown` in Props
**Problem:** `child.props` ist Typ `unknown` in React 19
**Fix:** Interface definieren und casten:
```typescript
interface CardProps { children?: React.ReactNode }
const props = child.props as CardProps
```

---

## iOS PWA

### Safe Area Header
**Problem:** `env(safe-area-inset-top)` über CSS-Variable (`var()`) → iOS ignoriert es
**Fix:** Direkt als Inline-Style:
```tsx
<header style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```
Oder in Tailwind globals.css direkt in der Klasse, nicht über CSS-Variable weiterreichen.

### Pull-to-Refresh (Accidental Trigger)
**Problem:** Normales Scrollen triggert versehentlich Pull-to-Refresh
**Fix:** Touch-Velocity prüfen, nur bei langsamem Scroll am Top triggern (siehe `usePullToRefresh.ts`)

### Barcode Scanner
- Funktioniert **nur mit HTTPS** (nicht localhost)
- Bei lokalem Testen: ngrok oder Vercel Preview URL verwenden

---

## Edge Functions (Deno)

### CORS
- `localhost` nie hartcodieren → Env-Var `ALLOWED_DEV_ORIGINS`
- Fail-open bei fehlendem Origin: ersten PROD_ORIGIN zurückgeben

### Rate Limiting
- Supabase RPC `check_rate_limit()` ist atomar (UPSERT + COUNT in einer Transaktion)
- Fail-open: Wenn RPC fehlschlägt, Request trotzdem durchlassen
- IP aus `x-forwarded-for` Header (erstes Element bei mehreren IPs)

### Import-Stil
```typescript
// Neu (JSR, bevorzugt):
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Alt (Deno.land):
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
```

---

## Git / Deployment

### Submodule updaten
```bash
cd memory
git add -A && git commit -m "session DATUM: was gemacht"
git push
cd ..
git add memory  # Submodule-Pointer updaten
git commit -m "chore: update memory submodule"
git push
```

### Vercel Build
- Auto-Deploy nur auf `main` Branch
- Preview-Deployments für alle anderen Branches
- Environment Variables müssen im Vercel Dashboard gesetzt sein
