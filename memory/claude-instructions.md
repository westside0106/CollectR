---
tags: [claude, instructions]
updated: 2026-03-09 (Session 2)
---

# CLAUDE.md — CollectR / Collectorssphere

> Dieses Dokument wird automatisch beim Start jeder Claude Code Session gelesen.
> Letzte Aktualisierung: März 2026

---

## Projekt-Identität

CollectR ist eine **Luxury Collection Management PWA** unter der Brand **Collectorssphere** (collectorssphere.com).
Zielgruppe: Sammler von Hot Wheels, Trading Cards (Pokémon/Yu-Gi-Oh!/Magic), Vinyl, LEGO, Kameras, Münzen, Briefmarken, Gaming und mehr.

- **Live:** https://www.collectorssphere.com
- **Repo:** https://github.com/westside0106/CollectR
- **Hosting:** Vercel (Auto-Deploy bei push to main)
- **Owner:** Flip (westside0106)

---

## Tech Stack

| Layer | Technologie | Version |
|-------|-------------|---------|
| Framework | Next.js (App Router, RSC, Turbopack) | 16.1.6 |
| UI | React + TypeScript (strict) | 19.2.1 / 5.9.3 |
| Styling | Tailwind CSS v4 | — |
| Animation | GSAP, Three.js, @react-three/fiber | 3.12.5 / 0.171 / 9.0 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) | 2.87.1 |
| PWA | Custom Service Worker (public/sw.js) | — |
| Analytics | Vercel Analytics | 1.6.1 |
| Package Manager | **npm** (NICHT yarn/pnpm) | — |

### UI Libraries (verfügbar / geplant)

- **Aceternity UI** — Animierte Components via shadcn Registry (`@aceternity`)
- **React Bits** — Micro-Animations (3D Folder, Dither Background bereits integriert)
- **Magic UI** — Number Ticker, Bento Grid, Marquee
- **shadcn/ui** — Basis-Components (Dialog, Dropdown, Tabs)
- **Framer Motion** — Custom Animations

Installation neuer Aceternity Components:
```bash
npx shadcn@latest add @aceternity/{component-name}
```

---

## Design System

### Gold-on-Dark Luxury Aesthetic

| Token | Wert |
|-------|------|
| Primärgold | `#d4a038` |
| Helles Gold | `#f5d98e` |
| Dunkles Gold | `#b8892a` |
| Hintergrund | Dunkle Töne (Dark-First Design) |
| Schrift | Inter (400, 500, 600, 700) |

### Brand Voice

- **Tonalität:** Freundlich, enthusiastisch — wie ein begeisterter Sammler-Freund
- **Ansprache:** Du (persönlich), auf Augenhöhe
- **Stil:** Kurze Sätze, aktiv, klar. Fachbegriffe erklären.
- **Emoji:** Nur funktional und sparsam (✓ 📦 ⚠️)

---

## Projekt-Architektur

```
src/
├── app/                    # Next.js App Router
│   ├── (gaming)/           # Gaming Sphere (PlayStation, Preise)
│   ├── (geo)/              # Geo Sphere
│   ├── (hub)/              # Main Hub
│   ├── (official)/         # Official Sphere
│   ├── (shop)/             # Shop Sphere
│   ├── (tcg)/              # TCG Sphere (Pokémon, Yu-Gi-Oh!, Magic)
│   ├── collections/        # Sammlungen CRUD + Items
│   ├── api/                # API Routes (Discogs etc.)
│   └── auth/               # Supabase Auth Callback
├── components/             # React Components
├── contexts/               # React Context (Theme etc.)
├── hooks/                  # Custom Hooks (useDebounce, useRealtime)
├── lib/supabase/           # Supabase Client (client.ts + server.ts)
├── services/               # API Services
├── types/                  # TypeScript Types (database.ts)
└── utils/                  # Utilities (exportImport.ts)

supabase/
├── functions/              # Edge Functions (Deno)
│   ├── analyze-image/      # AI Bildanalyse (Claude API)
│   ├── tcg-price-lookup/   # TCG Preisabfrage (Pokémon/YGO/MTG)
│   └── tcg-price-updater/  # Automatische Preisaktualisierung
└── migrations/             # SQL Migrations (RLS, Schema)
```

---

## Kritische Regeln

### IMMER beachten

1. Deutsche Kommentare im Code (technische Begriffe auf Englisch okay)
2. Deutsche Commit Messages: `<type>: <subject>` (feat, fix, chore, refactor, docs)
3. `'use client'` Direktive bei Components mit Hooks, Animationen oder Browser-APIs
4. Server Components sind der Default — nur Client markieren wenn nötig
5. Path Alias: `@/` → `src/` (z.B. `import { cn } from '@/lib/utils'`)
6. RLS ist aktiviert — jede neue Tabelle MUSS RLS Policies haben
7. Supabase Keys NIE hardcoden — immer `process.env` (Client) oder `Deno.env.get()` (Edge)
8. `SERVICE_ROLE_KEY` niemals im Browser-Code verwenden
9. `cn()` Utility liegt in `src/lib/utils.ts` für Tailwind Class Merging

### NIEMALS tun

- Keine API-Keys, Tokens oder Secrets im Code oder in Commits
- Kein `node_modules/` oder `.next/` committen
- Keine `.env` Dateien committen
- Kein `any` Type — immer typisieren
- Keine Class Components — nur Function Components mit Hooks
- Kein yarn oder pnpm — nur npm
- Keine generischen Preisschätzungen — jedes Item hat individuellen Wert

---

## Supabase & Datenbank

### Kern-Tabellen

| Tabelle | Beschreibung |
|---------|-------------|
| `collections` | Sammlungen (owner_id → auth.users) |
| `items` | Items (**`images` ist `text[]` ARRAY**, nicht `image_url`!) |
| `categories` | Kategorien pro Sammlung |
| `attribute_definitions` | Custom Attribute pro Kategorie |
| `item_attributes` | Attribut-Werte pro Item |
| `collection_shares` | Sharing mit Rollen (viewer/editor/admin) |
| `collection_invitations` | Einladungen per Email/Link |
| `item_tags` | Tag-System |
| `tcg_price_cache` | Gecachte TCG-Preise (24h TTL) |
| `rate_limits` | Rate Limiting für Edge Functions |
| `user_portfolio_holdings` | Aktien & Crypto Portfolio-Positionen (RLS) |
| `item_price_history` | Preisverlauf |

### RLS Pattern

```sql
-- Beispiel: User sieht nur eigene Collections
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (owner_id = auth.uid());
```

### Edge Functions

- `analyze-image`: Nimmt Base64-Bild, sendet an Claude API, gibt strukturierte Item-Daten zurück
- `tcg-price-lookup`: Preise von pokemontcg.io, ygoprodeck.com, scryfall.com (mit Cache)
- CORS: `collectorssphere.com` (localhost nur für Dev via `ALLOWED_DEV_ORIGINS` Env-Var)

---

## Bekannte Issues & Kontext

### Offene Security-TODOs

- [ ] Git-Historie bereinigen (git-filter-repo — node_modules/.next aus erstem Commit)
- [ ] Supabase Keys prüfen ob sie je exponiert waren → ggf. rotieren
- [ ] Rate Limiting für `analyze-image` Edge Function (Kostenschutz)
- [ ] Leaked Password Protection in Supabase Dashboard aktivieren

### Build-Hinweise

- Lokaler Build kann fehlschlagen ohne `.env.local` (Static Generation braucht Supabase)
- Auf Vercel mit Environment Variables funktioniert alles
- Workaround lokal: `vercel env pull .env.local`

### PWA

- Service Worker: `public/sw.js` (Cache v4)
- Background Sync für offline erstellte Items
- Push Notifications postponed (TypeScript-Kompatibilität)

---

## Verwandte Projekte (gleicher Owner)

- **eBay AutoDraft** — FastAPI + Gemini 2.0 Flash, 27 Kategorien für automatisierte eBay-Listings
  - Architektur: 4-File Sync Pattern (category-config, vision_ai_prompts, dynamic-form, category-menu)
  - Preise müssen IMMER individuell pro Item sein (keine Pauschalwerte)
- **Job Application Tool** — Flask + Claude API + Web.de SMTP für personalisierte Bewerbungen

---

## Workflow-Präferenzen

- Kein Git/GitHub für aktive Entwicklung — lokaler Workflow mit Claude Code
- Phased Builds — strukturiert in Phasen statt rapid prototyping
- Mobile Development: Claude Code Remote Control (iPhone 16 Pro)
- Stack-Philosophie: Vanilla JS + CDN-Libraries bevorzugt (Pico CSS, Open Props, Shoelace) — Next.js/React nur für CollectR
- Obsidian Vault als Knowledge Base — diese Datei liegt im Vault unter `memory/claude-instructions.md`

---

## Session-Abschluss

Am Ende jeder Session:
1. `memory/sessions/DATUM.md` mit Summary füllen
2. `memory/todos.md` aktualisieren
3. Haupt-Repo pushen (memory/ wird automatisch mitgetrackt):
   ```bash
   cd ~/Downloads/CollectR_clean/memory
   git add -A && git commit -m "session DATUM" && git push origin main
   ```

---

## API-Übersicht (Stand 2026-03-09)

| API | Endpunkt | Key? | Zweck |
|-----|----------|------|-------|
| frankfurter.app | `/api/currency` | Nein | EZB-Wechselkurse |
| Google News RSS | `/api/news` | Nein | Sammler-News |
| Discogs | `/api/discogs/*` | Nein (Token optional) | Vinyl-Datenbank |
| Open Library | `/api/books` | Nein | Bücher-Datenbank |
| CoinGecko | direkt (marketService) | Nein | Krypto-Preise |
| Alpha Vantage | `/api/portfolio/prices` | Ja (gratis) | Aktienpreise |
| Pokémon TCG | `/api/card-prices` | Nein (Key optional) | TCG-Preise |
| Yu-Gi-Oh! API | `/api/card-prices` | Nein | TCG-Preise |
| Scryfall | `/api/card-prices` | Nein | MTG-Preise |

### Benötigte Env-Vars (Vercel)

```
ALPHA_VANTAGE_API_KEY=   # Gratis: alphavantage.co – für Aktienpreise im Portfolio
DISCOGS_TOKEN=           # Optional – verbessert Rate Limits
POKEMON_TCG_API_KEY=     # Optional – verbessert Rate Limits
ANTHROPIC_API_KEY=       # Pflicht – für analyze-image Edge Function
```

## Tool-Seiten Design-Referenz

Alle Seiten unter `/tools/*` folgen diesem Muster:
- Gradient Hero oben (sphere-spezifische Farbe)
- `bg-slate-50 dark:bg-slate-950` Seitenhintergrund
- `bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700` Cards
- `focus:ring-2 focus:ring-[akzent]-500` auf Inputs
- Skeleton-Loader mit `animate-pulse dark:bg-slate-700`
