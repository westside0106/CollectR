# CollectR – AGENTS.md

**Sammler-App für Hot Wheels, Münzen, Trading Cards, LEGO, Briefmarken und mehr**

Live: https://www.collectorssphere.com
Repository: https://github.com/westside0106/CollectR.git
Owner: westside0106 (Vercel: westside0106s-projects)

---

## 📋 Project Overview

CollectR ist eine Progressive Web App (PWA) zum Verwalten von Sammlungen aller Art. Nutzer können:
- Sammlungen mit Kategorien und Unterkategorien organisieren
- Attribute pro Kategorie definieren (Text, Zahl, Auswahl, Tags, Datum, Währung, etc.)
- Items mit Bildern, Barcodes und benutzerdefinierten Attributen erfassen
- Sammlungen teilen (read/write/admin Permissions)
- Barcode-Scanner nutzen (PWA)
- Dark/Light Mode verwenden

**Sprache:** Deutsch (UI-Texte, Kommentare, Commit Messages)

---

## 🛠️ Tech Stack

### Core
- **Next.js 16.0.8** (App Router, React Server Components, Turbopack)
- **React 19.2.1** (mit react-dom 19.2.1)
- **TypeScript 5.9.3** (strict mode enabled)
- **Tailwind CSS 4** (mit @tailwindcss/postcss)

### Backend & Database
- **Supabase** (@supabase/supabase-js 2.87.1, @supabase/ssr 0.8.0)
  - PostgreSQL Database mit Row Level Security (RLS) aktiviert
  - Storage für Bilder (your-project.supabase.co)
  - Realtime Subscriptions
  - Auth (email/password, OAuth)

### PWA & Analytics
- **next-pwa 5.6.0** (Service Worker, Background Sync, Offline Support)
- **@vercel/analytics 1.6.1**
- Custom Service Worker: `public/sw.js` (Background Sync für offline items)

### Deployment
- **Vercel** (Auto-Deploy bei push to main)
- **Node 20+** (empfohlen)
- **npm** (package manager - nicht yarn/pnpm)

---

## 📂 Project Structure

```
CollectR_clean/
├── src/
│   ├── app/                          # Next.js 16 App Router
│   │   ├── layout.tsx                # Root Layout mit PWA Metadata
│   │   ├── page.tsx                  # Homepage
│   │   ├── collections/
│   │   │   ├── page.tsx              # Sammlungen-Übersicht
│   │   │   ├── new/page.tsx          # Neue Sammlung erstellen
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Sammlung Details
│   │   │       ├── categories/page.tsx  # ⚠️ Kategorien/Attribute verwalten
│   │   │       ├── items/
│   │   │       │   ├── new/page.tsx  # Neues Item erstellen
│   │   │       │   └── [itemId]/
│   │   │       │       ├── page.tsx  # Item Details
│   │   │       │       └── edit/page.tsx
│   │   │       ├── scan/page.tsx     # Barcode Scanner
│   │   │       ├── export/page.tsx   # Export Funktion
│   │   │       └── import/page.tsx   # Import Funktion
│   │   ├── settings/page.tsx         # User Settings (Theme, Profil, Passwort)
│   │   ├── tools/                    # Externe Tools (Market, News, Currency)
│   │   ├── auth/callback/route.ts    # Supabase Auth Callback
│   │   └── api/                      # API Routes (Discogs Integration)
│   ├── components/                   # React Components
│   │   ├── BarcodeScanner.tsx        # Barcode Scanner mit QuaggaJS
│   │   ├── ImageUpload.tsx           # Bild-Upload zu Supabase Storage
│   │   ├── FilterBar.tsx             # Item Filtering
│   │   ├── SearchBar.tsx             # Item Search
│   │   ├── ShareModal.tsx            # Sammlung teilen
│   │   ├── AddToCollectionModal.tsx  # Item zu Sammlung hinzufügen
│   │   ├── InstallPrompt.tsx         # PWA Install Banner
│   │   ├── ServiceWorkerRegistration.tsx
│   │   ├── AIAnalyzeButton.tsx       # AI Bildanalyse
│   │   ├── AIResultModal.tsx
│   │   ├── CollectionGoals.tsx       # Sammlungsziele
│   │   ├── DashboardCharts.tsx       # Statistiken
│   │   ├── ImageGallery.tsx
│   │   ├── MarketTicker.tsx          # Marktdaten
│   │   ├── NewsFeed.tsx              # News Feed
│   │   └── CurrencyConverter.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useDebounce.ts            # Debounce Hook
│   │   └── useRealtime.ts            # Supabase Realtime Hook
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts             # Browser Supabase Client (ANON_KEY)
│   │       └── server.ts             # Server Supabase Client (SSR, Cookies)
│   └── types/
│       └── database.ts               # TypeScript Database Interfaces
├── public/
│   ├── manifest.json                 # PWA Manifest (de, standalone)
│   ├── sw.js                         # Service Worker (Background Sync)
│   ├── icons/                        # PWA Icons (72-512px)
│   └── splash/                       # iOS Splash Screens
├── .env.local                        # Local Environment Variables (gitignored)
├── .vercel/                          # Vercel Config (gitignored)
├── next.config.ts                    # Next.js Config (Turbopack, Images)
├── tsconfig.json                     # TypeScript Config
├── tailwind.config.js                # Tailwind CSS Config
├── package.json                      # Dependencies & Scripts
└── AGENTS.md                         # This file
```

---

## 🗃️ Database Schema (Supabase)

**WICHTIG:** Row Level Security (RLS) ist aktiviert. Immer die richtigen Supabase Clients nutzen!

### Tables

#### `collections`
Sammlungen eines Users.
```typescript
{
  id: string (uuid, PK)
  owner_id: string (uuid, FK → auth.users)
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean (default: false)
  settings: Json (JSON-Feld für flexible Einstellungen)
  created_at: timestamp
  updated_at: timestamp
}
```

#### `categories`
Kategorien innerhalb einer Sammlung. Unterstützt Hierarchie via `parent_id`.
```typescript
{
  id: string (uuid, PK)
  collection_id: string (uuid, FK → collections)
  parent_id: string | null (uuid, FK → categories, für Unterkategorien)
  name: string
  icon: string | null (Emoji, z.B. '🚗')
  color: string | null (Hex-Code, z.B. '#ef4444')
  sort_order: number
  created_at: timestamp
}
```
**Features:**
- Hierarchische Kategorien (Parent → Children)
- 9 Farboptionen: null, #ef4444 (Rot), #f97316 (Orange), #eab308 (Gelb), #22c55e (Grün), #06b6d4 (Cyan), #3b82f6 (Blau), #8b5cf6 (Violett), #ec4899 (Pink)
- 12 Emoji-Icons: 📦 🚗 🏠 🎮 📚 🎨 ⌚ 💎 🎸 📷 🧸 🏺

#### `attribute_definitions`
Attribut-Definitionen pro Kategorie (definiert Felder für Items).
```typescript
{
  id: string (uuid, PK)
  category_id: string (uuid, FK → categories)
  name: string (technischer Name, z.B. 'produktionsjahr')
  display_name: string (Anzeigename, z.B. 'Produktionsjahr')
  description: string | null
  type: AttributeType (siehe unten)
  options: AttributeOptions (JSON, siehe unten)
  required: boolean (Pflichtfeld bei Item-Erstellung)
  show_in_list: boolean (Spalte in Item-Liste anzeigen)
  show_in_filter: boolean (In Filter-Bar verfügbar)
  sort_order: number
  inherited_from: string | null (für Vererbung von Parent-Kategorien)
  created_at: timestamp
}
```

**AttributeType Enum:**
- `'text'` - Textfeld
- `'number'` - Zahlfeld (mit min/max/step)
- `'select'` - Dropdown (Einfachauswahl)
- `'multiselect'` - Mehrfachauswahl
- `'tags'` - Tag-System
- `'checkbox'` - Ja/Nein Checkbox
- `'date'` - Datumsfeld
- `'link'` - URL-Feld
- `'currency'` - Währungsfeld

**AttributeOptions Interface:**
```typescript
{
  choices?: string[]           // Für select/multiselect
  min?: number                 // Für number
  max?: number                 // Für number
  step?: number                // Für number
  default_currency?: string    // Für currency
  max_length?: number          // Für text
  multiline?: boolean          // Für text
}
```

#### `items`
Sammlungsstücke (die eigentlichen Objekte in einer Sammlung).
```typescript
{
  id: string (uuid, PK)
  collection_id: string (uuid, FK → collections)
  category_id: string | null (uuid, FK → categories)
  name: string
  description: string | null
  images: string[] (Array von URLs)
  thumbnail: string | null
  purchase_date: date | null
  purchase_price: number | null
  purchase_currency: string (default: 'EUR')
  purchase_location: string | null
  status: ItemStatus (siehe unten)
  sold_date: date | null
  sold_price: number | null
  sold_currency: string (default: 'EUR')
  notes: string | null
  attributes: Record<string, Json> (Dynamische Attribute gemäß attribute_definitions)
  _tags: string[] (Generierte Tags)
  _computed_value: number | null (Berechneter Wert)
  _value_currency: string
  barcode: string | null
  external_ids: Json (z.B. { discogs_id: '12345' })
  created_at: timestamp
  updated_at: timestamp
  created_by: string | null (uuid, FK → auth.users)
}
```

**ItemStatus Enum:**
- `'in_collection'` - In Sammlung
- `'sold'` - Verkauft
- `'wishlist'` - Wunschliste
- `'ordered'` - Bestellt
- `'lost'` - Verloren/Vermisst

#### `item_images`
Bilder zu Items (mit AI-Analyse).
```typescript
{
  id: string (uuid, PK)
  item_id: string (uuid, FK → items)
  original_url: string (Supabase Storage URL)
  thumbnail_url: string | null
  medium_url: string | null
  filename: string | null
  size_bytes: number | null
  width: number | null
  height: number | null
  mime_type: string | null
  ai_tags: string[] (AI-generierte Tags)
  ai_description: string | null (AI-Beschreibung)
  sort_order: number
  is_primary: boolean (Hauptbild)
  uploaded_at: timestamp
  uploaded_by: string | null (uuid, FK → auth.users)
}
```

#### `collection_shares`
Sharing-Berechtigungen für Sammlungen.
```typescript
{
  id: string (uuid, PK)
  collection_id: string (uuid, FK → collections)
  shared_with_user_id: string (uuid, FK → auth.users)
  permission: SharePermission ('read' | 'write' | 'admin')
  created_at: timestamp
  created_by: string (uuid, FK → auth.users)
}
```

---

## ⚙️ Development Environment

### Prerequisites
- **Node.js 20+** (empfohlen: 20.x LTS)
- **npm** (nicht yarn/pnpm - package.json nutzt npm)
- **Vercel CLI** (optional, für `vercel env pull`)
- **Git**

### Environment Variables

**Vercel Integration Setup:**
Die Supabase-Vercel-Integration managed automatisch alle Environment Variables.

**Lokal entwickeln:**
```bash
# 1. Vercel CLI installieren (falls nicht vorhanden)
npm install -g vercel

# 2. Bei Vercel anmelden
vercel login

# 3. Projekt linken
vercel link
# → Scope: westside0106's projects
# → Projekt: collect-r

# 4. Environment Variables pullen
vercel env pull .env.local
```

**Benötigte Environment Variables (automatisch via Vercel):**
```bash
# Supabase (Public - dürfen im Browser sein)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Externe APIs (Optional - für Tools)
NEXT_PUBLIC_CURRENCYLAYER_API_KEY=...
NEXT_PUBLIC_GNEWS_API_KEY=...
NEXT_PUBLIC_MARKETSTACK_API_KEY=...
NEXT_PUBLIC_MEDIASTACK_API_KEY=...

# Push Notifications (Postponed - nicht aktiv)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Vercel (automatisch gesetzt)
VERCEL_OIDC_TOKEN=...
```

**WICHTIG:** `.env.local` ist in `.gitignore` und wird NIEMALS committed!

### Scripts

```bash
# Development Server (Turbopack, Fast Refresh)
npm run dev
# → http://localhost:3000

# Production Build
npm run build
# → .next/ Ordner
# HINWEIS: Build-Fehler wegen fehlender Supabase-Keys sind lokal normal!
#          Next.js versucht Static Generation, aber ohne Keys schlägt das fehl.
#          Auf Vercel (mit Keys) funktioniert der Build.

# Production Server (lokal testen)
npm run start
# → Benötigt erfolgreichen Build

# Linting
npm run lint
# → ESLint Check
```

### Development Workflow

1. **Neue Session starten:**
   ```bash
   cd CollectR_clean
   vercel env pull .env.local  # Nur falls .env.local fehlt
   npm run dev
   ```

2. **Code ändern:**
   - Datei bearbeiten
   - Browser auto-refresht (Fast Refresh)
   - TypeScript-Fehler werden inline angezeigt

3. **Commit Guidelines:**
   ```bash
   git add .
   git commit -m "feat: Beschreibung

   Detaillierte Beschreibung...

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   git push
   ```
   - Commit Messages auf **Deutsch** (außer Präfix wie feat/fix/chore)
   - Convention: `<type>: <subject>` (feat, fix, chore, refactor, docs, test)
   - Auto-Deploy via Vercel bei push to main

4. **Deployment:**
   - Push to `main` → Auto-Deploy auf Vercel
   - Preview-Deploy bei Pull Requests
   - Keine manuellen Deployments nötig

---

## 🔐 Supabase Client Usage

**CRITICAL:** Es gibt ZWEI Supabase Clients - nutze immer den richtigen!

### Browser Client (`src/lib/supabase/client.ts`)
**Wann nutzen:** Client Components, Browser-Code
```typescript
import { createClient } from '@/lib/supabase/client'

// In Client Component
const supabase = createClient()

// Nutzt NEXT_PUBLIC_SUPABASE_ANON_KEY
// Durch RLS geschützt - kann nur tun, was Policies erlauben
```

### Server Client (`src/lib/supabase/server.ts`)
**Wann nutzen:** Server Components, API Routes, Server Actions
```typescript
import { createClient } from '@/lib/supabase/server'

// In Server Component / API Route
const supabase = await createClient()

// Nutzt Cookies für Session-Verwaltung
// Kann mehr als Client (aber immer noch RLS-begrenzt)
```

**NIEMALS:** SERVICE_ROLE_KEY im Browser-Code nutzen!

---

## 🎨 Styling & UI

### Tailwind CSS 4
- **Config:** `tailwind.config.js`
- **Dark Mode:** Class-based (`dark:` Prefix)
- **Theme Toggle:** `src/hooks/useTheme.ts` (localStorage + System Preference)

### Color Scheme
- **Primary:** Blue (#2563eb)
- **Background (Dark):** Slate-900 (#0f172a)
- **Text:** Slate-900 (Light), Slate-100 (Dark)

### Responsive Design
- Mobile-First Ansatz
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 📱 PWA Features

### Manifest (`public/manifest.json`)
- **Name:** CollectR – Deine Sammlungen
- **Lang:** de (Deutsch)
- **Display:** standalone
- **Icons:** 72px - 512px (in `public/icons/`)
- **Shortcuts:** Meine Sammlungen, Neue Sammlung
- **Splash Screens:** iOS (in `public/splash/`)

### Service Worker (`public/sw.js`)
- **Caching:** Workbox-ähnlich (App Shell, API Responses)
- **Background Sync:** Items können offline erstellt werden und werden später synchronisiert
- **Update Handling:** Auto-Reload bei neuem SW

### Installation
- InstallPrompt Component zeigt PWA-Banner
- Nutzer können App zum Home Screen hinzufügen

---

## 🐛 Known Issues & Quirks

### ✅ FIXED: Form Reset Bug (28.12.2024)
**Problem:** `null is not an object (evaluating 'e.currentTarget.reset')` in `categories/page.tsx`
**Ursache:** Form-Reset nach Unmount
**Status:** Gefixt in Commit `488dad6a`

### ⚠️ Push Notifications (Postponed)
**Status:** Feature wurde entfernt (Commit `4a581771`)
**Grund:** TypeScript-Kompatibilitätsprobleme mit @types/web-push
**TODO:** Später wieder aktivieren wenn TypeScript-Support besser ist

### 💡 Build Warnings
**Lokal:** `npm run build` kann fehlschlagen wenn `.env.local` fehlt
**Grund:** Next.js Static Generation versucht auf Supabase zuzugreifen
**Lösung:** Auf Vercel (mit Environment Variables) funktioniert es
**Workaround:** `vercel env pull .env.local` vor Build ausführen

---

## 🚀 Roadmap & TODOs

### High Priority
- [ ] **PDF Export** - Für Versicherungszwecke (Sammlung + Items als PDF)
- [ ] **Bulk-Operationen** - Mehrfachauswahl und Massenbearbeitung von Items
- [ ] **Tests** - Unit Tests (Vitest), E2E Tests (Playwright)

### Medium Priority
- [ ] **Serien/Sets Tracking** - Fortschritt bei Sammelserien (z.B. LEGO Sets)
- [ ] **Erweiterte Statistiken** - Charts, Wertverlauf, Kategorie-Breakdown
- [ ] **AI Image Recognition** - Automatische Item-Erkennung beim Upload

### Low Priority / Nice-to-Have
- [ ] **Mehr Emoji-Auswahl** - Emoji-Picker statt fixer Liste
- [ ] **Push Notifications** - Reaktivierung (wenn TypeScript-Support besser)
- [ ] **Barcode-Datenbank** - Automatische Produkt-Info bei Scan
- [ ] **CSV Import/Export** - Bulk-Daten-Import
- [ ] **Collaborative Editing** - Mehrere User bearbeiten gleichzeitig

---

## 📝 Code Style & Conventions

### TypeScript
- **Strict Mode:** Enabled (`tsconfig.json`)
- **Type Imports:** `import type { ... }` für Types
- **Interfaces over Types:** Bevorzugt für Objekte
- **Path Alias:** `@/*` → `src/*`

### React
- **Function Components:** Immer (keine Class Components)
- **Hooks:** Custom Hooks in `src/hooks/`
- **Server Components:** Default (Client Components mit `'use client'` markieren)
- **Async Components:** Server Components können `async` sein

### Naming
- **Files:** camelCase für Utils, PascalCase für Components
- **Components:** PascalCase (z.B. `BarcodeScanner.tsx`)
- **Hooks:** `use` Prefix (z.B. `useDebounce.ts`)
- **Types:** PascalCase (z.B. `AttributeType`)
- **Database Tables:** snake_case (z.B. `attribute_definitions`)

### Comments
- **Deutsch** bevorzugt (außer bei technischen Begriffen)
- **JSDoc** für Public Functions
- Inline Comments nur wo nötig

### Commits
- **Format:** `<type>: <subject>` (auf Deutsch)
- **Types:** feat, fix, chore, refactor, docs, test, style
- **Beispiel:**
  ```
  feat: Kategorien-Farbauswahl hinzugefügt

  Nutzer können jetzt aus 9 Farben wählen für ihre Kategorien.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

---

## 🧪 Testing (TODO)

**Status:** Keine Tests vorhanden

**Geplant:**
- **Vitest:** Unit Tests für Utils & Hooks
- **React Testing Library:** Component Tests
- **Playwright:** E2E Tests
- **CI/CD:** GitHub Actions für Auto-Testing bei PR

---

## 📚 Important Files Reference

### Configuration
- `next.config.ts` - Next.js Config (Turbopack, Image Domains)
- `tsconfig.json` - TypeScript Config (strict, paths)
- `tailwind.config.js` - Tailwind Config
- `package.json` - Dependencies & Scripts
- `.gitignore` - Git Ignore Rules

### Core App Logic
- `src/app/collections/[id]/categories/page.tsx` - Kategorien/Attribute Management (WICHTIG!)
- `src/app/collections/[id]/page.tsx` - Collection Detail View
- `src/app/collections/[id]/items/new/page.tsx` - Item Creation
- `src/lib/supabase/client.ts` - Browser Supabase Client
- `src/lib/supabase/server.ts` - Server Supabase Client
- `src/types/database.ts` - TypeScript Types für Database

### PWA
- `public/manifest.json` - PWA Manifest
- `public/sw.js` - Service Worker
- `src/components/InstallPrompt.tsx` - Install Banner

### Components
- `src/components/BarcodeScanner.tsx` - Barcode Scanner (QuaggaJS)
- `src/components/ImageUpload.tsx` - Image Upload zu Supabase
- `src/components/ShareModal.tsx` - Collection Sharing

---

## 🔍 Debugging Tips

### Supabase RLS Debugging
```typescript
// Check current user
const { data: { user } } = await supabase.auth.getUser()
console.log('Current User:', user?.id)

// Test Query mit Error Logging
const { data, error } = await supabase
  .from('collections')
  .select('*')
console.log('Data:', data)
console.log('Error:', error) // Zeigt RLS Policy Violations
```

### Next.js Debugging
- **Server Logs:** Terminal wo `npm run dev` läuft
- **Client Logs:** Browser DevTools Console
- **Network:** DevTools Network Tab (Supabase Requests)
- **React DevTools:** Browser Extension installieren

### Vercel Deployment Debugging
- **Logs:** Vercel Dashboard → Deployment → Runtime Logs
- **Environment:** Vercel Dashboard → Settings → Environment Variables
- **Build Logs:** Vercel Dashboard → Deployment → Build Logs

---

## 📞 Support & Resources

### Documentation
- **Next.js 16:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS 4:** https://tailwindcss.com/docs
- **React 19:** https://react.dev

### External APIs
- **Discogs API:** https://www.discogs.com/developers (für Vinyl-Suche)
- **CurrencyLayer:** https://currencylayer.com/documentation (Währungsumrechnung)
- **GNews:** https://gnews.io/docs/v4 (News Feed)

### GitHub & Deployment
- **Repository:** https://github.com/westside0106/CollectR.git
- **Vercel:** https://vercel.com/westside0106s-projects/collect-r
- **Live App:** https://www.collectorssphere.com

---

## 🎯 Quick Start Checklist

Neue AI Agent Session? Folge dieser Checkliste:

- [ ] Repository klonen / in Verzeichnis wechseln
- [ ] `vercel env pull .env.local` ausführen (für Supabase-Keys)
- [ ] `npm install` (falls node_modules fehlt)
- [ ] `npm run dev` starten
- [ ] Browser auf http://localhost:3000
- [ ] Bei Code-Änderungen: TypeScript-Fehler checken
- [ ] Vor Commit: `npm run lint` ausführen
- [ ] Nach Commit: `git push` für Auto-Deploy

---

**Zuletzt aktualisiert:** 29.12.2024
**Version:** 1.0.0
**Erstellt für:** Claude Code / AI Agents
