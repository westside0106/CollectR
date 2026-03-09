#!/usr/bin/env bash
# setup-memory-vault.sh
# Führe dieses Script im geklonten collectr_memory Ordner aus.
# Es legt alle Memory-Dateien an und committed sie ins private Repo.
#
# Verwendung:
#   git clone https://github.com/westside0106/collectr_memory.git ~/collectr_memory
#   cd ~/collectr_memory
#   bash /path/to/CollectR_clean/scripts/setup-memory-vault.sh

set -euo pipefail

echo "→ Lege Memory-Vault Struktur an..."

mkdir -p sessions

# ─── _index.md ───────────────────────────────────────────────────────────────
cat > _index.md << 'HEREDOC'
---
tags: [dashboard]
updated: 2026-03-04
---

# CollectR Memory Vault

> Dieses Vault ist das persistente Gedächtnis von Claude Code für das CollectR-Projekt.
> Claude liest diese Dateien zu Beginn jeder Session automatisch.

---

## Navigation

| Datei | Inhalt |
|-------|--------|
| [[project]] | Tech Stack, Schema, Konventionen |
| [[todos]] | Offene TODOs mit Prioritäten |
| [[decisions]] | Architektur-Entscheidungen |
| [[lessons]] | Lessons Learned & Debugging-Guides |

---

## Sessions

```dataview
LIST
FROM "sessions"
SORT file.name DESC
LIMIT 10
```

*(Ohne Dataview Plugin: Dateien im `sessions/` Ordner manuell öffnen)*

---

## iPhone Setup (iCloud, kostenlos)

1. Diesen Ordner in iCloud ablegen:
   ```bash
   cp -r ~/collectr_memory ~/Library/Mobile\ Documents/com~apple~CloudDocs/collectr_memory
   ```
2. **Obsidian Mobile** aus dem App Store laden (kostenlos)
3. Obsidian → „Vault öffnen" → „Ordner öffnen" → `iCloud Drive/collectr_memory` wählen
4. Fertig — iCloud synct neue Dateien automatisch aufs iPhone

> **Sync-Workflow:** Nach jeder Session `git push` im collectr_memory Ordner →
> Mac zieht Änderungen automatisch → iCloud überträgt sie aufs iPhone

---

## Wie Claude diesen Vault nutzt

```
Session startet:
  → Claude liest CLAUDE.md (automatisch, im CollectR Repo Root)
  → Claude liest memory/project.md (Kontext)
  → Claude liest memory/todos.md (Was ist offen?)
  → Claude liest memory/sessions/DATUM.md (Was war zuletzt?)

Session endet:
  → Claude schreibt Session-Summary nach memory/sessions/HEUTE.md
  → git add -A && git commit -m "session DATUM" && git push
    (im memory/ Ordner ausführen)
```
HEREDOC

# ─── project.md ──────────────────────────────────────────────────────────────
cat > project.md << 'HEREDOC'
---
tags: [project, context]
updated: 2026-03-04
---

# CollectR – Projekt-Kontext

## Was ist CollectR?
PWA zur Verwaltung von Sammlungen (Hot Wheels, TCG, Vinyl, Gaming, Geologie, etc.)
mit spezialisiertem Multi-Sphere-System. Installierbar auf iOS/Android.

## Tech Stack
| Layer | Technologie |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, RLS, Realtime, Storage) |
| 3D | Three.js, React Three Fiber, GSAP |
| Deployment | Vercel (Auto-Deploy via GitHub main) |
| Edge Functions | Deno (Supabase Edge Functions) |

## Deployment
- **App URL:** collect-r.vercel.app
- Auto-Deploy bei Push auf `main`
- Edge Functions: Supabase (EU-Region)

---

## Datenbank – Wichtigste Konventionen

### `items` Tabelle (kritisch!)
```
images          → text[] ARRAY (NICHT image_url string!)
_computed_value → VK-Preis (Verkaufswert)
_value_currency → Währung des VK
purchase_price  → EK-Preis (Einkaufspreis)
status          → 'in_collection' | 'sold' | 'lent' | 'wishlist' | 'ordered'
```

### `collections` Tabelle
```
settings  → jsonb (Custom Fields etc.)
owner_id  → uuid (FK → auth.users)
```

### Sharing-Tabellen
- `collection_members` – Rollen: `viewer` | `editor` | `admin`
- `collection_invitations` – E-Mail und Link-Einladungen

### RLS
- **Alle Tabellen** haben RLS ENABLED
- `rate_limits` Tabelle: kein User-Zugriff (nur service_role aus Edge Functions)

---

## Code-Konventionen

### createClient() – KRITISCH
```typescript
// FALSCH (verursacht Vercel Prerender-Fehler):
const supabase = createClient(...)  // Top-Level beim Modulimport

// RICHTIG:
useEffect(() => {
  const supabase = createClient(...)
}, [])
```

### iOS PWA Safe Area
```css
/* RICHTIG – direkt als Inline-Style: */
style={{ paddingTop: 'env(safe-area-inset-top)' }}

/* FALSCH – CSS-Variable funktioniert auf iOS nicht: */
--safe-top: env(safe-area-inset-top);
padding-top: var(--safe-top);
```

### Edge Functions CORS
```typescript
// Dev-Origins NUR via Env-Var (nie hartcodiert):
const devOrigins = Deno.env.get('ALLOWED_DEV_ORIGINS')
  ?.split(',').map(o => o.trim()).filter(Boolean) ?? []
```

---

## Spheres (Route-Gruppen)
| Sphere | Pfad | Status |
|--------|------|--------|
| TCG | `/(tcg)/tcg/` | Vollständig |
| Gaming | `/(gaming)/gaming/` | Teilweise |
| Geo | `/(geo)/geo/` | Stub |
| Official | `/(official)/official/` | Stub |
| Shop | `/(shop)/shop/` | Stub |

## Migrations-Überblick
Alle in `supabase/migrations/` – neueste: `20260304_create_rate_limits.sql`
(Rate Limiting für Edge Functions via `check_rate_limit()` RPC)
HEREDOC

# ─── todos.md ─────────────────────────────────────────────────────────────────
cat > todos.md << 'HEREDOC'
---
tags: [todos]
updated: 2026-03-04
---

# Offene TODOs

## Hohe Priorität

- [ ] **E-Mail Versand** (ShareModal): Supabase Edge Function + Resend/SendGrid
  - Aktuell: Placeholder, keine echte E-Mail wird verschickt
  - Betrifft: `src/components/ShareModal.tsx`

- [ ] **Supabase Migration anwenden**: `20260304_create_rate_limits.sql`
  - Rate Limits Tabelle + `check_rate_limit()` Funktion
  - Im Supabase Dashboard SQL Editor ausführen

- [ ] **Supabase Keys rotieren?**
  - Prüfen ob `.env.local` jemals öffentlich war (Audit-Empfehlung)

- [ ] **Leaked Password Protection**: Im Supabase Dashboard aktivieren (2 Klicks)

- [ ] **ALLOWED_DEV_ORIGINS setzen**:
  - In `supabase/functions/.env` (lokal, nicht einchecken):
    `ALLOWED_DEV_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

## Mittlere Priorität

- [ ] **Währungskonvertierung**: EK/VK-Summen in Stats-Bar ignorieren Nicht-EUR Währungen
  - TODOs in `src/hooks/useTCGStats.ts`, `useGamingStats.ts`

- [ ] **Gaming Wishlist**: Zeigt Placeholder-Daten, echte DB-Anbindung fehlt

- [ ] **Gaming/Geo Scanner**: Barcode-Lookup + AI Cover-Erkennung (TODO im Code)

- [ ] **User-Email in ShareModal**: Zeigt nur `user_id.slice(0,8)`
  - Braucht Edge Function für `auth.users` Zugriff

- [ ] **Server-side Image Compression**: Aktuell client-side, sollte server-side sein

## Niedrige Priorität

- [ ] Sentry/LogRocket Integration (Placeholder in `src/lib/logger.ts`)
- [ ] Item-Duplikate erkennen
- [ ] Filter-State in URL speichern (für Sharing)
- [ ] Deck-Counter in TCG Stats (`src/hooks/useTCGStats.ts`)

---

## Zuletzt erledigt (Session 2026-03-04)
- ✅ CORS: localhost aus Edge Functions entfernt (via `ALLOWED_DEV_ORIGINS` Env-Var)
- ✅ Rate Limiting für `analyze-image` (10 req/IP/h) und `tcg-price-lookup` (60 req/IP/h)
- ✅ Migration `20260304_create_rate_limits.sql`
- ✅ HANDOVER.md aktualisiert
- ✅ Obsidian Memory Vault eingerichtet
HEREDOC

# ─── decisions.md ────────────────────────────────────────────────────────────
cat > decisions.md << 'HEREDOC'
---
tags: [decisions, architecture]
updated: 2026-03-04
---

# Architektur-Entscheidungen

## App Router statt Pages Router
**Entscheidung:** Next.js App Router
**Grund:** SSR-Middleware für Supabase Auth, Route Groups für Spheres, Server Components

## Supabase statt eigenem Backend
**Entscheidung:** Supabase (PostgreSQL + Auth + RLS + Storage + Realtime)
**Grund:** RLS direkt auf DB-Ebene, keine eigene Auth-Logik, Realtime out of the box

## RLS für alle Tabellen
**Entscheidung:** Alle Tabellen haben RLS ENABLED, keine Policy = kein Zugriff
**Grund:** Defense in depth – selbst wenn API-Key leakt, kein Datenzugriff ohne Auth

## rate_limits: Kein User-Zugriff (nur service_role)
**Entscheidung:** RLS enabled, keine Policies → nur Edge Functions (service_role) schreiben
**Grund:** User soll Rate-Limit-Status nicht manipulieren können

## Edge Functions: Fail Open bei Rate-Limit-Fehler
**Entscheidung:** Wenn `check_rate_limit()` RPC fehlschlägt → Request trotzdem durchlassen
**Grund:** Verfügbarkeit > Sicherheit bei temporärem DB-Problem

## CORS: Env-Variable statt Hardcoded localhost
**Entscheidung:** `ALLOWED_DEV_ORIGINS` Env-Var steuert lokale Origins
**Grund:** Prod-Build hat nie localhost erlaubt; Dev braucht es nur lokal

## Submodule für Memory Vault
**Entscheidung:** `collectr_memory` privates Repo als Git Submodule in `memory/`
**Grund:** Memory/Session-Daten bleiben privat, Claude Code sieht sie als normalen Ordner

## items.images als ARRAY (text[])
**Entscheidung:** Mehrere Bilder pro Item als PostgreSQL Array, nicht separate Tabelle
**Grund:** Einfachere Queries, item_images Tabelle existiert parallel für sort_order

## _computed_value für VK-Preis
**Entscheidung:** Feldname `_computed_value` für Verkaufswert
**Grund:** Historisch so benannt; NICHT umbenennen ohne Migration

## Spheres als Next.js Route Groups
**Entscheidung:** `/(tcg)/tcg/`, `/(gaming)/gaming/` etc.
**Grund:** Eigene Layouts, Stats-Hooks, Navigation pro Sphere ohne URL-Einfluss

## PWA statt Native App
**Entscheidung:** Next.js PWA (Service Worker, Manifest) statt React Native
**Grund:** Ein Codebase für Web + iOS + Android, kein App Store nötig
HEREDOC

# ─── lessons.md ──────────────────────────────────────────────────────────────
cat > lessons.md << 'HEREDOC'
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
**Problem:** `createClient()` beim Modulimport → Vercel bricht Prerender ab
**Fix:** Immer in `useEffect()` oder in Server Components aufrufen
```typescript
// FALSCH:
const supabase = createClient(url, key)  // Top-Level

// RICHTIG:
useEffect(() => {
  const supabase = createClient(url, key)
}, [])
```

### TypeScript `unknown` in Props (React 19)
```typescript
interface CardProps { children?: React.ReactNode }
const props = child.props as CardProps
```

---

## iOS PWA

### Safe Area Header
**Problem:** `env(safe-area-inset-top)` über CSS-Variable → iOS ignoriert es
**Fix:** Direkt als Inline-Style:
```tsx
<header style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```

### Pull-to-Refresh (Accidental Trigger)
**Problem:** Normales Scrollen triggert versehentlich Pull-to-Refresh
**Fix:** Touch-Velocity prüfen (siehe `usePullToRefresh.ts`)

### Barcode Scanner
- Funktioniert **nur mit HTTPS** (nicht localhost)

---

## Edge Functions (Deno)

### CORS
- `localhost` nie hartcodieren → Env-Var `ALLOWED_DEV_ORIGINS`
- Fail-open bei fehlendem Origin: ersten PROD_ORIGIN zurückgeben

### Rate Limiting
- `check_rate_limit()` RPC ist atomar (UPSERT + COUNT in einer Transaktion)
- Fail-open: Wenn RPC fehlschlägt, Request trotzdem durchlassen
- IP aus `x-forwarded-for` Header (erstes Element)

---

## Git / Submodule

### Memory Vault updaten
```bash
cd memory
git add -A && git commit -m "session DATUM: was gemacht"
git push
cd ..
git add memory
git commit -m "chore: update memory submodule"
git push
```
HEREDOC

# ─── sessions/2026-03-04.md ──────────────────────────────────────────────────
cat > sessions/2026-03-04.md << 'HEREDOC'
---
date: 2026-03-04
tags: [session]
---

# Session 2026-03-04

## Was wurde gemacht
- Security Audit umgesetzt: CORS-Fix, Rate Limiting für Edge Functions
- HANDOVER.md aktualisiert (sensitives entfernt, aktueller Stand)
- Obsidian Memory Vault eingerichtet (dieses Repo)

## Änderungen (CollectR Repo)
- `supabase/functions/analyze-image/index.ts`: CORS + Rate Limiting (10 req/IP/h)
- `supabase/functions/tcg-price-lookup/index.ts`: CORS + Rate Limiting (60 req/IP/h)
- `supabase/migrations/20260304_create_rate_limits.sql`: rate_limits Tabelle + check_rate_limit() RPC
- `CLAUDE.md`: Neues Kontext-File für Claude Code
- `.claude/settings.json` + `.claude/hooks/on-stop.sh`: Automatische Session-Vorlagen

## Offene Punkte
- Migration `20260304_create_rate_limits.sql` noch nicht in Supabase angewendet
- Supabase Keys: Prüfen ob jemals exponiert (manuell im Dashboard)
- `ALLOWED_DEV_ORIGINS` lokal in `supabase/functions/.env` setzen

## Nächste Schritte
- Memory Vault auf iPhone via iCloud einrichten (Obsidian Mobile)
- Nächste Features: Gaming Wishlist, Währungskonvertierung, E-Mail Versand
HEREDOC

echo ""
echo "✓ Alle Dateien angelegt:"
ls -la
echo ""
echo "→ Jetzt committen und pushen:"
echo "   git add -A"
echo "   git commit -m 'init: memory vault'"
echo "   git push -u origin main"
