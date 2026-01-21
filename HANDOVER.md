# CollectR - Übergabeprotokoll

**Datum:** 2026-01-07
**Projekt:** CollectR - Collection Management App
**Status:** Phase 2 abgeschlossen, Phase 3 bereit zum Start

---

## 🎯 Projektzusammenfassung

CollectR ist eine Next.js/React-App zur Verwaltung von Sammlungen (Hot Wheels, Vinyl, etc.) mit Supabase Backend.

**Tech Stack:**
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Storage, RLS)
- Deployment: Vercel
- User: <YOUR_EMAIL> (User-ID: `<YOUR_USER_ID>`)

---

## ✅ Abgeschlossene Features (Phase 1 & 2)

### Core Features
- ✅ User Authentication (Supabase Auth)
- ✅ Collections Management (CRUD)
- ✅ Items Management mit Multi-Image Upload
- ✅ Dashboard mit Statistiken und Charts
- ✅ Kategorie-System für Items
- ✅ Tag-System für flexible Kategorisierung
- ✅ Barcode-Scanner Integration
- ✅ Export/Import Funktionalität
- ✅ Dark Mode Support
- ✅ Pull-to-Refresh
- ✅ Realtime Updates
- ✅ Service Costs Tracking

### Sharing System
- ✅ Collection Sharing mit Rollen (viewer, editor, admin)
- ✅ Einladungen per E-Mail und Link
- ✅ RLS Policies für shared access

---

## 🗄️ Datenbank Schema (WICHTIG!)

### Bestehende Tabellen (NICHT ändern!)

#### `collections`
```sql
- id (uuid, PK)
- name (text)
- description (text)
- owner_id (uuid, FK → auth.users)
- cover_image (text)
- is_public (boolean)
- settings (jsonb)
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
- images (text[]) -- ARRAY, nicht image_url!
- thumbnail (text)
- purchase_date (date)
- purchase_price (numeric)
- purchase_currency (text)
- purchase_location (text)
- status (text) -- 'in_collection', 'sold', 'lent', 'wishlist'
- sold_date (date)
- sold_price (numeric)
- sold_currency (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `tags`
```sql
- id (uuid, PK)
- name (text)
- color (text)
- user_id (uuid, FK → auth.users)
- created_at (timestamptz)
- UNIQUE(name, user_id)
```

#### `item_tags` (many-to-many)
```sql
- id (uuid, PK)
- item_id (uuid, FK → items)
- tag_id (uuid, FK → tags)
- created_at (timestamptz)
- UNIQUE(item_id, tag_id)
```

#### `categories`
```sql
- id (uuid, PK)
- name (text)
- user_id (uuid, FK → auth.users)
- created_at (timestamptz)
```

#### `collection_members` (Sharing)
```sql
- id (uuid, PK)
- collection_id (uuid, FK → collections)
- user_id (uuid, FK → auth.users)
- role (text) -- 'viewer', 'editor', 'admin'
- created_at (timestamptz)
- UNIQUE(collection_id, user_id)
```

#### `collection_invitations` (Sharing)
```sql
- id (uuid, PK)
- collection_id (uuid, FK → collections)
- invited_email (text, nullable)
- invite_token (text, UNIQUE)
- role (text)
- invited_by (uuid, FK → auth.users)
- accepted_at (timestamptz, nullable)
- accepted_by (uuid, FK → auth.users, nullable)
- expires_at (timestamptz)
- created_at (timestamptz)
```

#### `service_costs`
```sql
- id (uuid, PK)
- collection_id (uuid, FK → collections)
- service_name (text)
- cost (numeric)
- billing_cycle (text) -- 'monthly', 'yearly', 'one_time'
- payment_date (date)
- notes (text)
- created_at (timestamptz)
```

#### `item_images`
```sql
- id (uuid, PK)
- item_id (uuid, FK → items)
- url (text)
- sort_order (integer)
- created_at (timestamptz)
```

### Storage Buckets
- `item_images` (public bucket für Item-Bilder)

---

## 🔐 Row Level Security (RLS) Status

**Alle Tabellen haben RLS ENABLED.**

### Funktionierende Policies (Stand: 2026-01-07)

#### Collections
```sql
-- Owner hat vollen Zugriff
"Users can do everything with their collections" (ALL)
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id)
```

#### Items
```sql
-- Owner der Collection hat vollen Zugriff
"Users can do everything with their items" (ALL)
  USING (EXISTS (SELECT 1 FROM collections c WHERE c.id = items.collection_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM collections c WHERE c.id = items.collection_id AND c.owner_id = auth.uid()))
```

#### Tags
```sql
-- User kann eigene Tags verwalten
"Users can view their own tags" (SELECT) - USING (auth.uid() = user_id)
"Users can create their own tags" (INSERT) - WITH CHECK (auth.uid() = user_id)
"Users can update their own tags" (UPDATE) - USING/WITH CHECK (auth.uid() = user_id)
"Users can delete their own tags" (DELETE) - USING (auth.uid() = user_id)
```

#### Collection Members
```sql
-- Owner und Members können Members sehen
"Users can view members of their collections" (SELECT)
"Users can view members of collections they belong to" (SELECT)
"Collection owners can manage members" (ALL)
"Collection admins can manage members" (INSERT)
```

#### Collection Invitations
```sql
-- Owner/Admins können einladen
"Users can view invitations for their collections" (SELECT)
"Users can view invitations they created" (SELECT)
"Anyone can view invitations by token" (SELECT) -- für Accept-Flow
"Collection owners can create invitations" (INSERT)
"Collection admins can create invitations" (INSERT)
"Collection owners can delete invitations" (DELETE)
"Users can accept invitations" (UPDATE)
```

---

## 📁 Projekt-Struktur

```
/Users/flip/Downloads/CollectR_clean/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Dashboard (/)
│   │   ├── login/             # Auth
│   │   ├── collections/       # Collections CRUD
│   │   │   ├── page.tsx       # Liste aller Collections
│   │   │   ├── new/           # Neue Collection
│   │   │   └── [id]/          # Collection Details
│   │   │       ├── page.tsx   # Collection View
│   │   │       ├── items/     # Items CRUD
│   │   │       ├── export/    # Export
│   │   │       ├── import/    # Import
│   │   │       └── scan/      # Barcode Scanner
│   │   ├── settings/          # User Settings
│   │   └── invite/[token]/    # Invite Accept Page
│   ├── components/
│   │   ├── ShareModal.tsx     # Sharing UI (WICHTIG!)
│   │   ├── DashboardCharts.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   ├── lib/
│   │   └── supabase/
│   │       └── client.ts      # Supabase Client
│   └── hooks/
│       ├── useRealtimeRefresh.ts
│       └── usePullToRefresh.ts
├── supabase/
│   ├── config.toml
│   ├── functions/             # Edge Functions
│   └── migrations/
│       ├── 20260106_create_tags_system.sql
│       ├── 20260106_create_service_costs_table.sql
│       ├── 20260107_create_collections_and_sharing.sql (FEHLER - nicht verwenden!)
│       └── 20260107_fix_sharing_only.sql (KORREKT - verwendet)
└── package.json
```

---

## ⚠️ WICHTIGE ERKENNTNISSE (LESSONS LEARNED)

### 1. Migration-Fehler vermeiden
**Problem:** Die erste Migration `20260107_create_collections_and_sharing.sql` hat versucht, bestehende Tabellen mit `CREATE TABLE IF NOT EXISTS` neu zu erstellen. Das führte zu Schema-Konflikten.

**Lösung:**
- NIE `CREATE TABLE IF NOT EXISTS` verwenden wenn Tabellen schon existieren
- Immer erst Schema prüfen mit: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TABLE_NAME'`
- Nur fehlende Tabellen/Spalten hinzufügen

### 2. RLS-Policies debuggen
**Symptome:** 403 oder 500 Errors beim API-Aufruf

**Debug-Schritte:**
```sql
-- 1. Prüfe ob RLS enabled ist
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 2. Zeige alle Policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'collections';

-- 3. Test Policy als User
SELECT auth.uid(); -- zeigt aktuelle User-ID
SELECT * FROM collections WHERE owner_id = auth.uid(); -- sollte Daten zurückgeben
```

### 3. Owner-ID Migration
**Problem:** Nach Migration waren `owner_id` Felder NULL

**Lösung:**
```sql
UPDATE collections SET owner_id = '3934964a-1bbb-4e24-ba30-73b4d2ec2044' WHERE owner_id IS NULL;
```

### 4. Browser-Cache vs. RLS
- Immer Hard Reload (`Cmd + Shift + R`) nach Schema-Änderungen
- Bei 500 Errors → Supabase Dashboard SQL Editor verwenden um Policies zu prüfen
- Bei 403 Errors → RLS blockiert Zugriff, Policy fehlt oder falsch

---

## 🎯 Phase 3: Nächste Aufgaben (TODO)

### Priorität 1: Themes & Personalisierung
- [ ] Verschiedene Farbschemas/Themes implementieren
- [ ] Custom Collection Icons (emoji picker oder upload)
- [ ] Benutzerdefinierte Felder pro Collection (JSONB settings nutzen)

### Priorität 2: Filter erweitern
- [ ] Filter nach Tags (UI + Query)
- [ ] Filter nach benutzerdefinierten Attributen
- [ ] Kombinierte Filter (Tag + Kategorie + Status)
- [ ] Filter-State in URL speichern (für Sharing)

### Priorität 3: Notifications & Reminders
- [ ] Erinnerungen für Items (z.B. "Ausleihe zurückholen")
- [ ] Push-Benachrichtigungen (Web Push API)
- [ ] E-Mail Notifications (Supabase Edge Function)

### Priorität 4: UX Verbesserungen
- [ ] Drag & Drop für Image-Sortierung
- [ ] Bulk-Operationen (mehrere Items gleichzeitig bearbeiten)
- [ ] Advanced Search (Volltext-Suche)
- [ ] Item Duplikate erkennen

---

## 🛠️ Technische Schulden

1. **E-Mail Versand:** Aktuell nur Placeholder - braucht Supabase Edge Function + Resend/SendGrid
2. **User-Email Anzeige in ShareModal:** Zeigt nur `user_id.slice(0,8)` - braucht Edge Function für auth.users Zugriff
3. **Image Optimization:** Thumbnails werden client-side erzeugt, sollte server-side sein
4. **Error Handling:** Viele Errors werden nur geloggt, nicht dem User angezeigt

---

## 🔧 Nützliche Commands

### Entwicklung
```bash
cd /Users/flip/Downloads/CollectR_clean
npm run dev          # Dev Server starten
npm run build        # Production Build
npm run lint         # ESLint
```

### Supabase (falls CLI installiert)
```bash
supabase link --project-ref your-project-ref
supabase db pull     # Schema pullen
supabase db push     # Migrationen anwenden
```

### Datenbank-Queries (Supabase Dashboard)
```sql
-- User-ID finden
SELECT auth.uid();

-- Alle Collections des Users
SELECT * FROM collections WHERE owner_id = auth.uid();

-- Collections mit Item-Count
SELECT c.id, c.name, COUNT(i.id) as item_count
FROM collections c
LEFT JOIN items i ON i.collection_id = c.id
WHERE c.owner_id = auth.uid()
GROUP BY c.id, c.name;

-- Tags eines Users
SELECT * FROM tags WHERE user_id = auth.uid();

-- Shared Collections
SELECT c.*, cm.role
FROM collections c
JOIN collection_members cm ON cm.collection_id = c.id
WHERE cm.user_id = auth.uid();
```

---

## 🐛 Bekannte Issues

1. **Image Upload:** Manchmal langsam bei großen Bildern → TODO: Client-side Compression
2. **Dark Mode:** Manche Komponenten haben inkonsistente dark mode styles
3. **Mobile:** Pull-to-Refresh funktioniert nicht auf allen Browsern perfekt
4. **Barcode Scanner:** Funktioniert nur mit HTTPS (nicht localhost)

---

## 📊 Statistiken (Stand: 2026-01-07)

- **Anzahl Collections:** 11
- **Anzahl Items:** ~50+ (geschätzt)
- **Anzahl Migrations:** 4
- **Code-Dateien:** ~40+
- **Komponenten:** ~15+

---

## 🚀 Deployment

**Vercel:**
- URL: collect-r.vercel.app
- Auto-Deploy bei Git Push
- Environment Variables in Vercel Dashboard setzen

**Supabase:**
- Projekt: your-project-ref
- Region: EU (vermutlich Frankfurt)
- Dashboard: https://supabase.com/dashboard

---

## 💡 Wichtige Hinweise für nächsten Chat

1. **IMMER** erst Schema prüfen bevor du Migrationen schreibst
2. **NIE** `CREATE TABLE IF NOT EXISTS` bei bestehenden Tabellen
3. **IMMER** RLS-Policies testen mit `SELECT auth.uid()` und Test-Queries
4. User-ID ist: `3934964a-1bbb-4e24-ba30-73b4d2ec2044`
5. Items-Tabelle nutzt `images` (ARRAY), nicht `image_url` (text)
6. Collections haben `settings` (JSONB) für Custom Fields
7. Bei 500 Errors → SQL Editor verwenden, nicht App Console

---

## 📝 Letzte Änderungen (Session 2026-01-07)

1. ✅ Sharing-System implementiert (collection_members, collection_invitations)
2. ✅ RLS-Policies für Sharing hinzugefügt
3. ✅ Migration-Fehler behoben (collections/items waren leer)
4. ✅ Owner-ID für alle Collections wiederhergestellt
5. ✅ ShareModal.tsx implementiert mit Email/Link Einladungen
6. ✅ Alle Collections und Items sind wieder sichtbar

---

## 🎯 Empfohlener Start für nächsten Chat

**User wird wahrscheinlich sagen:**
> "Lass uns mit Phase 3 weitermachen: Filter erweitern"

**Deine Antwort sollte sein:**
1. Bestätige dass du das Übergabeprotokoll gelesen hast
2. Prüfe kurz ob die App läuft (User fragen)
3. Erstelle TodoWrite mit den Filter-Tasks
4. Starte mit Filter nach Tags (UI + Backend)
5. Nutze die bestehenden `tags` und `item_tags` Tabellen

**Wichtig:** Frage IMMER zuerst ob alles noch funktioniert, bevor du neue Features implementierst!

---

**Status:** ✅ Alle Systeme funktionieren, ready for Phase 3!
**Next Steps:** Filter erweitern → Themes → Notifications
