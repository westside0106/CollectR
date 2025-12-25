<p align="center">
  <img src="public/logo.svg" alt="CollectR Logo" width="200" />
</p>

<h1 align="center">CollectR</h1>

<p align="center">
  <b>Dein privates digitales Sammlungsarchiv.</b><br/>
  Strukturiert - Sicher - Flexibel
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" />
  <img src="https://img.shields.io/badge/Supabase-Backend-green" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/Privacy-First-critical" />
</p>

---

## Uebersicht

**CollectR** ist eine moderne Sammlungsverwaltungs-App fuer Sammler aller Art.
Egal ob Hot Wheels, Muenzen, Briefmarken, Vinyl, LEGO oder Antiquitaeten -
CollectR hilft dir, deine Sammlung professionell zu katalogisieren und zu verwalten.

### Kernprinzipien

- **Struktur** - Kategorien und benutzerdefinierte Attribute fuer jede Sammlungsart
- **Flexibilitaet** - Preset-Vorlagen oder komplett individuelle Konfiguration
- **Privatsphaere** - Deine Daten gehoeren dir, kein Tracking
- **Einfachheit** - Intuitive Bedienung ohne Lernkurve

---

## Features (Aktuell)

### Sammlungsverwaltung
- Unbegrenzte Sammlungen erstellen
- 11 vordefinierte Vorlagen (Hot Wheels, Muenzen, Briefmarken, Vinyl, LEGO, etc.)
- Benutzerdefinierte Kategorien mit Icons
- Flexible Attribut-Definitionen (Text, Zahl, Auswahl, Checkbox, Datum, Tags)

### Item-Management
- Detaillierte Item-Erfassung mit allen Metadaten
- Kaufpreis, Kaufdatum, Haendler tracking
- Status-Tracking (In Sammlung, Verkauft, Verliehen, Wunschliste)
- Barcode-Scanner Integration
- Notizen und Beschreibungen

### Import/Export
- CSV Import mit intelligentem Spalten-Mapping
- JSON Import/Export
- Kategorie-Attribute beim Import zuordnen
- Auto-Erkennung von Spaltenbezeichnungen

### Tools
- Waehrungsrechner mit Live-Kursen
- Marktnews (Sammlermarkt-Nachrichten)
- Collector News Feed

### Weitere Features
- Responsive Design (Mobile & Desktop)
- Dark Mode Sidebar
- Offline-Faehigkeit (PWA-ready)
- Benutzer-Authentifizierung

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |

---

## Projektstruktur

```
CollectR/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/              # Authentifizierung
│   │   ├── register/
│   │   ├── collections/        # Sammlungsverwaltung
│   │   │   ├── page.tsx        # Sammlungsuebersicht
│   │   │   ├── new/            # Neue Sammlung erstellen
│   │   │   └── [id]/           # Einzelne Sammlung
│   │   │       ├── page.tsx    # Sammlung Detailansicht
│   │   │       ├── categories/ # Kategorien verwalten
│   │   │       ├── items/      # Items (neu, bearbeiten, detail)
│   │   │       ├── import/     # CSV/JSON Import
│   │   │       ├── export/     # Daten exportieren
│   │   │       └── scan/       # Barcode Scanner
│   │   ├── tools/              # Werkzeuge
│   │   │   ├── currency/       # Waehrungsrechner
│   │   │   ├── market/         # Marktnews
│   │   │   └── news/           # Sammler-News
│   │   └── offline/            # Offline-Seite
│   ├── components/             # React Komponenten
│   │   ├── layout/             # Layout (Sidebar, etc.)
│   │   └── UserMenu.tsx
│   ├── lib/                    # Utilities & Konfiguration
│   │   └── supabase/           # Supabase Client
│   └── utils/                  # Helper-Funktionen
│       └── exportImport.ts     # CSV/JSON Parsing
├── public/                     # Statische Assets
├── supabase/                   # Supabase Migrations
└── package.json
```

---

## Datenbank-Schema

### Tabellen

**collections**
- id, name, description, owner_id, created_at

**categories**
- id, collection_id, name, icon, color, parent_id, sort_order

**attribute_definitions**
- id, category_id, name, display_name, type, options, required, show_in_list, sort_order

**items**
- id, collection_id, category_id, name, description, status
- purchase_price, purchase_currency, purchase_date, purchase_location
- barcode, notes, attributes (JSONB), created_by, created_at

---

## Roadmap

### Phase 1: Core Features (Erledigt)
- [x] Sammlungen erstellen/bearbeiten/loeschen
- [x] Kategorien mit benutzerdefinierten Attributen
- [x] Item-Verwaltung (CRUD)
- [x] CSV/JSON Import mit Attribut-Mapping
- [x] Export-Funktion
- [x] Preset-Vorlagen fuer verschiedene Sammlungsarten
- [x] Barcode-Scanner
- [x] Waehrungsrechner

### Phase 2: Verbesserungen (In Arbeit)
- [ ] **Bilder-Upload** - Mehrere Fotos pro Item
- [ ] **Globale Suche** - Ueber alle Sammlungen suchen
- [ ] **Erweiterte Filter** - Nach Attributen filtern
- [ ] **Listenansicht verbessern** - show_in_list Attribute anzeigen
- [ ] **Item-Detailseite** - Attribute anzeigen/bearbeiten
- [ ] **Export mit Attributen** - CSV/JSON mit allen Attributen

### Phase 3: Analytics & Insights
- [ ] **Dashboard Charts** - Wertentwicklung, Verteilung nach Kategorie
- [ ] **Sammlungs-Statistiken** - Gesamtwert, Durchschnittspreis, etc.
- [ ] **Duplikat-Erkennung** - Aehnliche Items finden
- [ ] **Wert-Tracking** - Historische Wertentwicklung

### Phase 4: Externe Integrationen
- [ ] **eBay API** - Aktuelle Marktpreise abrufen
- [ ] **Discogs API** - Vinyl/Musik-Datenbank
- [ ] **Bricklink API** - LEGO Preise
- [ ] **Numista API** - Muenzdatenbank
- [ ] **AI Bild-Erkennung** - Automatische Item-Identifikation

### Phase 5: Community & Sharing
- [ ] **Oeffentliche Sammlungen** - Optional teilen
- [ ] **Wunschlisten teilen** - Mit anderen Sammlern
- [ ] **Tauschboerse** - Items zum Tausch anbieten
- [ ] **Sammler-Netzwerk** - Andere Sammler finden

### Phase 6: Mobile & Offline
- [ ] **Native App** - iOS/Android mit React Native
- [ ] **Offline-Sync** - Vollstaendige Offline-Faehigkeit
- [ ] **Push-Benachrichtigungen** - Preis-Alerts, etc.

---

## Feature-Ideen (Backlog)

### Verwaltung
- Standort-Tracking (wo ist das Item gelagert?)
- Versicherungswert separat erfassen
- Leihgaben-Verwaltung (wer hat was ausgeliehen?)
- QR-Code Etiketten generieren
- Bulk-Bearbeitung (mehrere Items gleichzeitig)

### Dokumentation
- Echtheitszertifikate hochladen
- Rechnungen/Belege archivieren
- Provenienz-Dokumentation
- Restaurierungs-Historie

### Analyse
- Preis-Alerts (wenn Wert ueber/unter X)
- ROI-Berechnung
- Beste/schlechteste Investitionen
- Kauf-Empfehlungen basierend auf Sammlung

### Social
- Sammlung als PDF exportieren
- Visitenkarten mit QR-Code zur Sammlung
- Embedded Widget fuer Website

### Spezialisiert
- Hot Wheels: Treasure Hunt Tracker, Varianten-Datenbank
- Muenzen: Praegejahr-Analyse, Erhaltungsgrad-Guide
- Vinyl: Discogs-Sync, Hoerstatistik
- LEGO: Teileliste, Bauanleitungen verlinken
- Briefmarken: Michel-Katalog Integration

---

## Installation

### Voraussetzungen
- Node.js 18+
- npm oder pnpm
- Supabase Account (oder lokale Instanz)

### Setup

```bash
# Repository klonen
git clone https://github.com/yourusername/collectr.git
cd collectr

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY eintragen

# Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Scripts

```bash
npm run dev      # Entwicklungsserver (localhost:3000)
npm run build    # Produktions-Build
npm run start    # Produktions-Server
npm run lint     # ESLint ausfuehren
```

---

## Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

## Mitwirken

Beitraege sind willkommen! Bitte erstelle einen Issue oder Pull Request.

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Aenderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Oeffne einen Pull Request

---

<p align="center">
  Made with care for collectors everywhere.
</p>
