# CollectR - Übergabeprotokoll

**Datum:** 2026-03-04
**Projekt:** CollectR - Collection Management PWA
**Status:** Phase 3 aktiv – Sphere-Ausbau, PWA-Verfeinerung, Preis-Features

---

## Projektzusammenfassung

CollectR ist eine Next.js PWA zur Verwaltung verschiedener Sammlungstypen (Hot Wheels, Vinyl, TCG, Gaming, Geologie, u.v.m.) mit Supabase Backend. Die App läuft als installierbare PWA auf iOS und Android.

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4
- Backend: Supabase (PostgreSQL, Auth, Storage, RLS, Realtime)
- 3D/Animationen: Three.js, React Three Fiber, GSAP
- Deployment: Vercel (Auto-Deploy via GitHub)
- Analytics: Vercel Analytics

---

## Abgeschlossene Features

### Core
- User Authentication (Supabase Auth, SSR-Middleware)
- Collections Management (CRUD, Cover Image, Settings JSONB)
- Items Management mit Multi-Image Upload
- Kategorie-System und Tag-System (many-to-many via `item_tags`)
- EK/VK Preisfelder (`purchase_price` / `_computed_value`) mit Anzeige in Collection-View und Stats-Bar
- Barcode-Scanner Integration (nur HTTPS)
- AI Batch Upload
- Export/Import (CSV, inkl. EK/VK Feldmapping)
- Dark Mode
- Realtime Updates (Supabase Realtime)
- Service Costs Tracking

### Sharing System
- Collection Sharing mit Rollen (viewer, editor, admin)
- Einladungen per E-Mail und Link (`collection_invitations`)
- RLS Policies für shared access

### Dashboard
- Anpassbare Tiles (Sichtbarkeit, Größe, Drag-to-Reorder)
- Stats-Tile, Reminders-Tile, RecentItems-Tile, TopItems-Tile, TCGHighlights-Tile, Favorites-Tile, CollectionList-Tile, Spheres-Tile, QuickActions-Tile
- Charts: Kategorienverteilung, Collection-Werte, Status-Verteilung, Finanz-Metriken

### PWA
- Installierbar auf iOS/Android
- iOS Safe-Area-Header-Fix (env(safe-area-inset-top))
- Pull-to-Refresh (mit Schutz gegen versehentliche Trigger beim Scrollen)
- Service Worker (`/public/sw.js`)
- Manifest mit App-Shortcuts

### Spheres
Jede Sphere hat eine eigene Route-Group, eigene Stats-Hook und spezialisierte Subpages:

**TCG Sphere** (`/tcg`)
- Pokémon, Yu-Gi-Oh, Magic: The Gathering
- Preisabfrage via pokemontcg.io, YGOPRODeck, Scryfall
- Deck Builder, Meta-Decks, Yu-Gi-Oh Banlist, Magic Format-Checker
- TCG Card Scanner, Bulk Price Update, Price Refresh
- Price History Charts, Price Alerts

**Gaming Sphere** (`/gaming`)
- PlayStation-Subpage, Scanner, Preisseite, Wishlist (Placeholder)
- Barcode-Lookup (TODO), AI Cover-Erkennung (TODO)

**Geo Sphere** (`/geo`)
- Geologie & Archäologie Sammlungen
- Lab Data, Locations

**Official Sphere** (`/official`)
- Dokumente & Zertifikate

**Shop Sphere** (`/shop`)
- E-Commerce-Verwaltung

### Reminders & Benachrichtigungen
- Erinnerungen für Items (DB-Tabelle `reminders`)
- Reminder-Tile im Dashboard

### Sicherheit
- Umfassendes Security Hardening: Security Headers (CSP, X-Frame-Options, etc.)
- RLS-Fixes (Search Path Hardening, keine SECURITY DEFINER ohne explizites Schema)
- Middleware schützt alle App-Routen außer `/tools/*`, `/login`, `/register`

---

## Datenbank Schema

### Tabellen (NICHT ohne Prüfung ändern!)

#### `collections`
```sql
- id (uuid, PK)
- name (text)
- description (text)
- owner_id (uuid, FK → auth.users)
- cover_image (text)
- is_public (boolean)
- settings (jsonb)           -- für Custom Fields etc.
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `items`
```sql
- id (uuid, PK)
- collection_id (uuid, FK → collections)
- category_id (uuid, FK → categories)
- name (text)
- description (text)
- images (text[])            -- ARRAY! Nicht image_url (text)
- thumbnail (text)
- purchase_date (date)
- purchase_price (numeric)   -- EK (Einkaufspreis)
- purchase_currency (text)
- purchase_location (text)
- _computed_value (numeric)  -- VK (Verkaufspreis / Geschätzter Wert)
- _value_currency (text)
- status (text)              -- 'in_collection', 'sold', 'lent', 'wishlist', 'ordered'
- sold_date (date)
- sold_price (numeric)
- sold_currency (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `tags` / `item_tags` (many-to-many)
```sql
tags:
- id, name, color, user_id, created_at
- UNIQUE(name, user_id)

item_tags:
- id, item_id, tag_id, created_at
- UNIQUE(item_id, tag_id)
```

#### `categories`
```sql
- id, name, user_id, created_at
```

#### `collection_members` / `collection_invitations` (Sharing)
```sql
collection_members:
- id, collection_id, user_id, role ('viewer'|'editor'|'admin'), created_at
- UNIQUE(collection_id, user_id)

collection_invitations:
- id, collection_id, invited_email (nullable), invite_token (UNIQUE)
- role, invited_by, accepted_at, accepted_by, expires_at, created_at
```

#### `service_costs`
```sql
- id, collection_id, service_name, cost, billing_cycle ('monthly'|'yearly'|'one_time')
- payment_date, notes, created_at
```

#### `item_images`
```sql
- id, item_id, url, sort_order, created_at
```

#### `reminders`
```sql
- Erinnerungen für Items (genaues Schema in Migration prüfen)
```

#### `price_history` / `price_alerts` / `tcg_price_cache`
```sql
- Preis-Tracking Tabellen für TCG und allgemeine Items
- (genaues Schema in den Migrations unter supabase/migrations/ prüfen)
```

### Storage Buckets
- `item_images` (public bucket)

---

## Migrations-Übersicht

```
supabase/migrations/
├── 20260106_create_tags_system.sql
├── 20260106_create_service_costs_table.sql
├── 20260107_fix_sharing_only.sql          ← Sharing-System (KORREKTE Version!)
├── 20260111_create_reminders_system.sql
├── 20260113_create_price_history.sql
├── 20260113_create_price_alerts.sql
├── 20260113_create_tcg_price_cache.sql
├── 20260121_fix_rls_security_issues.sql   ← Security Hardening
├── 20260121_fix_function_search_paths.sql
└── 20260128_fix_searchable_field.sql
```

**Wichtig:** `20260107_create_collections_and_sharing.sql` existiert noch im Verzeichnis, ist aber fehlerhaft (versuchte bestehende Tabellen neu zu erstellen) – nicht verwenden.

---

## RLS Status

**Alle Tabellen haben RLS ENABLED.**

Policies existieren für: collections, items, tags, item_tags, categories, collection_members, collection_invitations, service_costs, reminders, price_history, price_alerts, tcg_price_cache.

RLS debuggen:
```sql
-- Alle Policies einer Tabelle
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'items';

-- Prüfen ob RLS aktiv
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Projekt-Struktur

```
src/
├── app/
│   ├── page.tsx                     # Dashboard (/)
│   ├── login/ register/             # Auth
│   ├── collections/
│   │   ├── page.tsx                 # Liste aller Collections
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx             # Collection-View (Grid/List, Stats-Bar, EK/VK)
│   │       ├── items/new/           # Item hinzufügen
│   │       ├── items/[itemId]/      # Item-Detail, Edit
│   │       ├── export/ import/      # CSV Export/Import
│   │       ├── scan/                # Barcode Scanner
│   │       └── categories/
│   ├── settings/
│   ├── invite/[token]/
│   ├── api/
│   │   ├── tcg-price-lookup/
│   │   ├── tcg-barcode-lookup/
│   │   ├── card-prices/ card-search/ tcg-set-info/
│   │   ├── currency/
│   │   ├── news/
│   │   └── discogs/search/ discogs/release/[id]/
│   ├── (tcg)/tcg/                   # TCG Sphere
│   │   ├── page.tsx
│   │   ├── collection/ scanner/ prices/ deck-builder/
│   │   ├── pokemon/ pokemon/meta-decks/
│   │   ├── yugioh/ yugioh/banlist/
│   │   └── magic/ magic/format-checker/
│   ├── (gaming)/gaming/             # Gaming Sphere
│   │   ├── page.tsx
│   │   ├── playstation/ scanner/ prices/ wishlist/
│   ├── (geo)/geo/                   # Geo Sphere
│   │   ├── page.tsx
│   │   ├── scanner/ lab-data/ locations/
│   ├── (official)/official/         # Official Sphere
│   └── (shop)/shop/                 # Shop Sphere
├── components/
│   ├── dashboard/
│   │   ├── DashboardSettings.tsx    # Tile-Konfiguration (Drag-to-Reorder)
│   │   └── tiles/                   # Alle Dashboard-Tiles
│   ├── ShareModal.tsx
│   ├── DashboardCharts.tsx
│   ├── BarcodeScanner.tsx
│   ├── TCGCardScanner.tsx
│   ├── TCGPriceLookupButton.tsx
│   ├── TCGPriceRefreshButton.tsx
│   ├── TCGBulkPriceUpdate.tsx
│   ├── AIBatchUpload.tsx
│   ├── PriceHistoryChart.tsx
│   ├── PriceAlertManager.tsx
│   ├── MarketTicker.tsx
│   ├── FilterBar.tsx
│   ├── SearchBar.tsx
│   ├── TagInput.tsx
│   ├── AddToCollectionModal.tsx
│   ├── ServiceWorkerRegistration.tsx
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useDashboardConfig.ts
│   ├── useRealtimeRefresh.ts
│   ├── usePullToRefresh.ts
│   ├── useDebounce.ts
│   ├── useTCGStats.ts
│   ├── useGamingStats.ts
│   ├── useGeoStats.ts
│   ├── useOfficialStats.ts
│   └── useShopStats.ts
├── lib/
│   ├── supabase/client.ts
│   └── logger.ts
└── types/
    ├── database.ts
    └── tcg.ts
```

---

## Wichtige Erkenntnisse (Lessons Learned)

### 1. Migrationen
- **NIE** `CREATE TABLE IF NOT EXISTS` bei bereits existierenden Tabellen
- Immer erst Schema prüfen: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'`
- Nur fehlende Spalten/Tabellen hinzufügen

### 2. RLS debuggen
- 403 → Policy fehlt oder greift nicht
- 500 → Supabase SQL Editor verwenden, nicht App-Konsole
- Immer Hard Reload nach Schema-Änderungen

### 3. iOS PWA Header
- `env(safe-area-inset-top)` muss direkt in CSS-Klassen stehen, nicht über CSS-Variablen (`var()`) pipen → iOS ignoriert das
- Die globals.css enthält die finale funktionierende Lösung

### 4. Items-Tabelle
- Bilder sind `images (text[])` – ein ARRAY, kein einzelner `image_url`-String
- VK-Preis heißt im Schema `_computed_value`, nicht `selling_price` o.ä.
- Status-Werte: `'in_collection'`, `'sold'`, `'lent'`, `'wishlist'`, `'ordered'`

### 5. createClient()
- Nicht beim Modulimport aufrufen – erst innerhalb von `useEffect` oder Server-Komponenten, sonst Prerender-Fehler auf Vercel

---

## Offene TODOs

### Hohe Priorität
- [ ] **E-Mail Versand** (ShareModal): Aktuell Placeholder – braucht Supabase Edge Function + Resend/SendGrid
- [ ] **Währungskonvertierung**: EK/VK-Summen in Stats-Bar gehen von EUR aus – andere Währungen werden ignoriert (TODOs in `useTCGStats.ts`, `useGamingStats.ts`)

### Mittlere Priorität
- [ ] **Gaming Wishlist**: Zeigt noch Placeholder-Daten, echte DB-Anbindung fehlt
- [ ] **Gaming/TCG Preis-Suche**: Seiten existieren, Logik ist noch Stub
- [ ] **Gaming Scanner**: Barcode-Lookup und AI Cover-Erkennung (TODO im Code)
- [ ] **User-Email in ShareModal**: Zeigt nur `user_id.slice(0,8)` – braucht Edge Function für `auth.users` Zugriff
- [ ] **Image Compression**: Client-side, sollte server-side sein
- [ ] **Deck-Counter in TCG Stats**: TODO in `useTCGStats.ts`

### Niedrige Priorität
- [ ] Sentry/LogRocket Integration (Placeholder in `logger.ts`)
- [ ] Item-Duplikate erkennen
- [ ] Filter-State in URL speichern (für Sharing)
- [ ] Advanced Search (Volltext)

---

## Bekannte Issues

1. **Barcode Scanner**: Funktioniert nur mit HTTPS (nicht localhost)
2. **Dark Mode**: Vereinzelt inkonsistente Styles in Sphere-Seiten
3. **Image Upload**: Kann bei großen Bildern langsam sein (keine client-side Compression)

---

## Nützliche Commands

```bash
npm run dev          # Dev Server (Turbopack)
npm run build        # Production Build
npm run lint         # ESLint
```

```bash
supabase db pull     # Schema pullen
supabase db push     # Migrationen anwenden
```

---

## Deployment

- **Vercel**: Auto-Deploy bei Push auf `main`
- **Supabase**: EU-Region
- Environment Variables müssen im Vercel-Dashboard gesetzt sein (nie in Code einchecken)

---

## Letzte Änderungen (Sessions bis 2026-03-04)

- PWA iOS Safe-Area-Header-Fix (mehrere Iterationen, env() direkt in CSS-Klassen)
- EK/VK Preisfelder in Collection-View, Stats-Bar zeigt beide Summen
- VK-Importfeld im CSV-Import ergänzt
- Dashboard Tiles: Drag-to-Reorder, Overflow-Fix
- Pull-to-Refresh: kein versehentliches Triggern beim normalen Scrollen
- Security Hardening: RLS-Fixes, Security Headers, Function Search Paths
- TypeScript-Fixes (CardSwap, createClient prerender)

---

**Status:** Alle Kernsysteme funktionieren. Sphere-Ausbau und Preis-Features in aktiver Entwicklung.
