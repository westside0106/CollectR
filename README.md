<p align="center">
  <img src="public/icons/icon-512.png" alt="Collectorssphere Logo" width="200">
</p>

<h1 align="center">Collectorssphere</h1>

<p align="center">
  <strong>Die intelligente Sammlungsplattform fuer leidenschaftliche Sammler</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-sphere-konzept">Spheres</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/PWA-Ready-purple?style=flat-square" alt="PWA Ready">
</p>

---

## Was ist Collectorssphere?

Collectorssphere ist eine moderne, datenschutzfreundliche Progressive Web App zur Verwaltung deiner Sammlungen. Egal ob Hot Wheels, Muenzen, Briefmarken, Vinyl, LEGO, Kameras oder Mineralien — alles an einem Ort, sicher und uebersichtlich.

### Kernidee

Ein universeller **Collection HUB**, der dir hilft, alles was du sammelst professionell zu katalogisieren, zu bewerten und im Blick zu behalten. Spezialisierte **Spheres** fuer bestimmte Sammelgebiete (Trading Cards, Gaming, etc.) folgen in zukuenftigen Updates.

---

## Features

### Collection Management

| Feature | Beschreibung |
|---------|-------------|
| **Sammlungen** | Erstelle beliebig viele Sammlungen mit eigenen Kategorien |
| **Items** | Erfasse Items mit Bildern, Tags, Custom-Attributen und Preisen |
| **Flexible Attribute** | 8+ Attributtypen: Text, Nummer, Tags, Checkbox, Datum, Link, Waehrung |
| **Import & Export** | CSV und JSON Support fuer alle Sammlungen |
| **Sharing** | Teile Sammlungen mit anderen (Viewer/Editor/Admin Rollen) |
| **Barcode Scanner** | EAN-13, EAN-8, UPC-A, UPC-E, Code-128, QR |

### Dashboard

- Uebersicht ueber alle Sammlungen, Items und Gesamtwert
- Konfigurierbare Dashboard-Tiles (verschieben, ein-/ausblenden, Groessen anpassen)
- Finanz-Charts (Ausgaben, Wert, Gewinn pro Sammlung)
- Top Items nach Wert
- Erinnerungen fuer wichtige Termine

### Tools

| Tool | Beschreibung |
|------|-------------|
| **Waehrungsrechner** | Live-Wechselkurse fuer internationale Sammlungen |
| **Markt & Portfolio** | Edelmetall- und Kryptopreise im Blick |
| **Sammler-News** | Kuratierte News aus 14+ Sammelkategorien |
| **Buecher-Suche** | ISBN- und Textsuche mit Detailinfos |
| **Vinyl-Suche** | Barcode- und Textsuche mit Marktpreisen |

### PWA & Mobile

- Installierbar auf Smartphone und Desktop
- Offline-Faehigkeit mit Background Sync
- Pull-to-Refresh auf mobilen Geraeten
- Dark/Light Theme

---

## Sphere-Konzept

Collectorssphere organisiert sich in spezialisierte **Spheres**, von denen jede optimiert ist fuer spezifische Sammelkategorien:

```
                    Collectorssphere
                         HUB
              Universal Collection Manager
                          |
    +-----------+---------+---------+-----------+
    |           |         |         |           |
   TCG       Gaming   Official    Geo        Shop
  Trading    Video     Docs &    Geology    Market-
  Cards      Games     Certs     & Arch.    place
```

> **Aktueller Fokus:** Der **HUB** — der universelle Sammlungsmanager — ist die aktive Kernplattform. Die spezialisierten Spheres (TCG, Gaming, Official, Geo, Shop) befinden sich in Entwicklung und werden schrittweise freigeschaltet.

---

## Tech Stack

| Kategorie | Technologie |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Sprache** | TypeScript (strict) |
| **Styling** | Tailwind CSS 4 |
| **UI** | React 19, Framer Motion, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **PWA** | Custom Service Worker |
| **Hosting** | Vercel |
| **Analytics** | Vercel Analytics & Speed Insights |

---

## Installation

### Voraussetzungen

- Node.js 18+
- npm
- Supabase Account

### 1. Repository klonen

```bash
git clone https://github.com/westside0106/CollectR.git
cd CollectR
```

### 2. Abhaengigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen

Erstelle eine `.env.local` Datei mit den erforderlichen Variablen. Eine Vorlage findest du in der Projektdokumentation. Mindestens werden Supabase-Verbindungsdaten benoetigt.

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Oeffne [http://localhost:3000](http://localhost:3000)

> `/` ist die oeffentliche Landing Page. Eingeloggte User werden automatisch zum Dashboard weitergeleitet.

---

## Scripts

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build
npm run start      # Produktions-Server
npm run lint       # ESLint
```

---

## Roadmap

### Phase 1: Collection HUB (Aktiv)
- [x] Sammlungen erstellen, bearbeiten, teilen
- [x] Items mit Bildern, Tags, Custom-Attributen
- [x] Dashboard mit konfigurierbaren Tiles
- [x] Finanz-Tracking (Ausgaben, Wert, Gewinn)
- [x] Erinnerungen-System
- [x] 5 integrierte Tools (Waehrung, Markt, News, Buecher, Vinyl)
- [x] PWA mit Offline-Support
- [x] Import/Export (CSV, JSON)
- [ ] Onboarding-Flow fuer neue User
- [ ] Performance-Optimierung
- [ ] Test-Coverage aufbauen

### Phase 2: Spezialisierte Spheres (Geplant)
- [ ] TCG Sphere (Trading Card Games)
- [ ] Gaming Sphere (Video Game Collections)
- [ ] Geo Sphere (Mineralien, Fossilien)
- [ ] Official Sphere (Dokumente & Zertifikate)
- [ ] Shop Sphere (Marketplace Integration)

### Phase 3: Advanced Features (Zukunft)
- [ ] AI-gestuetzte Item-Erkennung
- [ ] Community Features
- [ ] Oeffentliche Sammlungen
- [ ] Erweiterte Analytics

---

## Mitwirken

Beitraege sind willkommen!

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/dein-feature`)
3. Committe deine Aenderungen
4. Push zum Branch (`git push origin feature/dein-feature`)
5. Oeffne einen Pull Request

---

## Lizenz

MIT License - siehe [LICENSE](LICENSE) fuer Details.

---

<p align="center">
  <strong>Made with Leidenschaft fuer Sammler weltweit</strong>
</p>
