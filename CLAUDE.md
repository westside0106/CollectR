# CollectR – Claude Code Context

> Dieses File wird von Claude Code automatisch bei jedem Session-Start gelesen.
> Sensible Daten (Session-Notizen, TODOs, Entscheidungen) liegen im privaten
> Memory Vault: `memory/` (Git Submodule → westside0106/collectr_memory)

## Lies zu Beginn jeder Session

```
memory/project.md          → Tech Stack, Schema, Konventionen
memory/todos.md            → Offene TODOs mit Prioritäten
memory/sessions/<DATUM>.md → Letzte Session (heutiges Datum oder jüngste Datei)
```

---

## Projekt-Überblick

**CollectR** ist eine Next.js PWA zur Verwaltung von Sammlungen (Hot Wheels, TCG, Vinyl,
Gaming, Geologie, etc.) mit Supabase Backend. Multi-Sphere-Architektur.

**Stack:** Next.js 16 · React 19 · TypeScript strict · Tailwind 4 · Supabase · Vercel

---

## Kritische Konventionen (nicht vergessen!)

### Datenbank
- `items.images` ist `text[]` **ARRAY** — nicht `image_url` (string)!
- `items._computed_value` = VK-Preis · `items.purchase_price` = EK-Preis
- `items.status`: `'in_collection'` | `'sold'` | `'lent'` | `'wishlist'` | `'ordered'`
- Alle Tabellen: RLS ENABLED — keine Policy = kein Zugriff

### Code
- `createClient()` **immer** in `useEffect()` aufrufen, nie beim Modulimport → Vercel Prerender Error
- iOS PWA: `env(safe-area-inset-top)` direkt als Inline-Style, nicht über CSS-Variable

### Edge Functions
- CORS: localhost **nie** hardcodieren → `ALLOWED_DEV_ORIGINS` Env-Var (lokal in `supabase/functions/.env`)
- Rate Limiting via `check_rate_limit()` RPC (atomar, fail-open)

### Migrationen
- **NIE** `CREATE TABLE IF NOT EXISTS` bei existierenden Tabellen
- Erst Schema prüfen, dann nur fehlende Spalten hinzufügen

---

## Session-Abschluss

Am Ende einer Session bitte:
1. `memory/sessions/DATUM.md` mit Summary füllen (Was gemacht, Offene Punkte, Nächste Schritte)
2. `memory/todos.md` aktualisieren
3. Commit im memory/ Ordner:
   ```bash
   cd memory && git add -A && git commit -m "session DATUM" && git push && cd ..
   git add memory && git commit -m "chore: update memory" && git push
   ```
