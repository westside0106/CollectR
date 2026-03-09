---
tags: [landingpage, plan, feature]
created: 2026-03-09
status: draft
---

# Landingpage-Plan — Collectorssphere

> Implementierungsplan für die öffentliche Landing Page unter `/`.
> Zielgruppe: nicht eingeloggte Besucher — Sammler, die CollectR entdecken.

---

## 1. Routing-Strategie

### Aktueller Zustand

`/` ist derzeit ein reines Dashboard (`src/app/page.tsx` mit `'use client'`).
Das Middleware (`middleware.ts`) leitet unauthentifizierte Nutzer direkt zu `/login` — sie
sehen die Landingpage nie.

### Ziel-Zustand

```
/ → unauthentifiziert → Landing Page
/ → eingeloggt        → Dashboard (bisheriges page.tsx)
```

### Strategie: Route-Split

#### Schritt 1 — Middleware anpassen

```typescript
// Vorher: / ist protected
const protectedPaths = ['/', '/collections']

// Nachher: / ist öffentlich, /dashboard ist protected
const protectedPaths = ['/dashboard', '/collections']
```

Neue Redirect-Logik:
- Eingeloggt + Besuch `/` → redirect zu `/dashboard`
- Nicht eingeloggt + Besuch `/dashboard` → redirect zu `/login`
- Nicht eingeloggt + Besuch `/` → Landing Page anzeigen

#### Schritt 2 — Dateistruktur

```
src/app/
├── page.tsx                    ← NEU: Landing Page (Server Component, statisch)
├── dashboard/
│   └── page.tsx                ← VERSCHOBEN: bisheriges page.tsx (Dashboard)
```

#### Schritt 3 — TopHeader anpassen

```typescript
const hideOnPaths = ['/login', '/register', '/']
if (hideOnPaths.includes(pathname)) return null
```

Landing Page bekommt eigene transparente `LandingNavbar`.

---

## 2. Seitenaufbau (Sections)

```
LandingNavbar          ← transparent → solid bei scroll
HeroSection            ← Fullscreen, Dither-Hintergrund (Gold), 3D-Element optional
FeatureShowcase        ← 4 Feature-Cards mit Scroll-Reveal
CollectionTypesGrid    ← animiertes Kachel-Grid aller Sammelgebiete (15+)
AppDemoSection         ← Phone-Mockup mit echten Screenshots
CTAFooterSection       ← Finaler CTA + Links
```

### 2.1 LandingNavbar

- Startet transparent (über Hero), wird bei Scroll zu `bg-slate-900/80 backdrop-blur-xl`
- Logo links + ThemeToggle + "Anmelden" (Ghost) + "Kostenlos starten" (Gold-CTA)
- Mobile: Hamburger → Sheet mit CTAs
- `position: fixed`, `z-50`

### 2.2 HeroSection

**Hintergrund:** Lokale Dither-Instanz mit Gold-Farbton (`waveColor: [0.83, 0.63, 0.22]`)
über dunklem Overlay `from-slate-950/60 to-transparent`.

**Inhalt:**
- Eyebrow: `"Für echte Sammler"`
- H1: `"Deine Sammlung. Dein Überblick."`
- Sub: `"Hot Wheels, Pokémon-Karten, Vinyl — alles an einem Ort. Mit KI-Analyse, Live-Preisen und Teilen-Funktion."`
- CTA-Gruppe: `[Kostenlos starten →]` (Gold) + `[Anmelden]` (Ghost)
- Stats-Ticker: `"10.000+ Items · 50+ Sammelgebiete · Kostenlos starten"`

**Animation (Framer Motion):**
```typescript
const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }
```

### 2.3 FeatureShowcase

4 Feature-Cards in `2×2`-Grid (Desktop) / Liste (Mobile).
Cards: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl`

| Icon | Titel | Beschreibung |
|------|-------|-------------|
| 📦 | Sammlung verwalten | Unbegrenzt Sammlungen, Kategorien, Custom-Merkmale, Bilder. |
| 🤖 | KI-Analyse | Fotografiere ein Item — KI erkennt es und füllt alle Felder. |
| 📈 | Live-Preise & Alarme | Echtzeit-Preise für TCG, Vinyl, Bücher. Preisalarme. |
| 🔗 | Teilen & Kollaborieren | Sammlung teilen, Viewer- oder Editor-Rollen. |

**Animation:** `whileInView` mit Stagger (0ms, 100ms, 200ms, 300ms).

### 2.4 CollectionTypesGrid

**Überschrift:** `"Was sammelst du?"`

**Kacheln (15+):**
```
🚗 Hot Wheels       🃏 Trading Cards     🪙 Münzen
💿 Vinyl / Musik    📚 Bücher            🎮 Gaming
🏆 LEGO             📷 Kameras           📮 Briefmarken
🌍 Geo-Objekte      🎲 Brettspiele       🧸 Spielzeug
⌚ Uhren            👟 Sneakers          🍷 Wein
```

**Animation:** GSAP ScrollTrigger Stagger:
```typescript
gsap.from('.collection-tile', {
  scrollTrigger: { trigger: '.collection-grid', start: 'top 80%' },
  opacity: 0, scale: 0.85, y: 20,
  stagger: 0.05, duration: 0.4, ease: 'power2.out'
})
```

### 2.5 AppDemoSection

- iPhone-Frame (CSS-only: `border-8 border-slate-800 rounded-[3rem] shadow-2xl`)
- Screenshot-Carousel: 3–4 echte App-Screenshots
- Framer Motion `AnimatePresence` für Wechsel
- Auto-Advance alle 4s, pausiert bei Hover
- Screenshots ablegen unter `public/landing/`

### 2.6 CTAFooterSection

```
"Bereit, deine Sammlung zu ordnen?"
"Kostenlos. Keine Kreditkarte. Sofort loslegen."
[Jetzt kostenlos registrieren →]

Impressum · Datenschutz · Kontakt
```

---

## 3. Technische Umsetzung

### Dateistruktur

```
src/components/landing/
├── LandingNavbar.tsx           ← 'use client' (scroll-state)
├── HeroSection.tsx             ← 'use client' (Framer Motion)
├── FeatureShowcase.tsx         ← 'use client' (whileInView)
├── CollectionTypesGrid.tsx     ← 'use client' (GSAP ScrollTrigger)
├── AppDemoSection.tsx          ← 'use client' (AnimatePresence)
├── CTAFooterSection.tsx        ← Server Component
└── Hero3DElement.tsx           ← 'use client', ssr: false (Three.js, Phase 2)
```

### Landing Page als Server Component

```typescript
// src/app/page.tsx
export const dynamic = 'force-static'

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <FeatureShowcase />
      <CollectionTypesGrid />
      <AppDemoSection />
      <CTAFooterSection />
    </>
  )
}
```

### Dither im Hero (Gold)

```typescript
<Dither
  waveColor={[0.83, 0.63, 0.22]}   // Gold #d4a038
  colorNum={6}
  waveAmplitude={0.5}
  waveFrequency={2}
  waveSpeed={0.03}
  pixelSize={3}
  enableMouseInteraction={true}
/>
```

`GlobalDitherBackground` auf `/` per Pathname-Check ausblenden.

### Keine neuen Packages nötig

Alle Libraries bereits vorhanden:
- `framer-motion` v12 — Scroll-Animationen, AnimatePresence
- `gsap` 3.12.5 — CollectionTypes Stagger
- `@react-three/fiber` + `three` — Hero 3D (optional, Phase 2)

---

## 4. Implementierungsreihenfolge

| Phase | Schritte |
|-------|---------|
| **1 — Routing** | Middleware anpassen · Dashboard nach `/dashboard` verschieben · TopHeader auf `/` ausblenden · Links aktualisieren |
| **2 — Grundgerüst** | `LandingNavbar` + `CTAFooterSection` + leeres `page.tsx` · Deploy testen |
| **3 — Hero** | Dither-BG (Gold) · Framer Motion Entrance · Stats-Ticker · Scroll-Indicator |
| **4 — Features** | 4 Glassmorphism-Cards · whileInView-Stagger |
| **5 — Kacheln** | CollectionTypesGrid · GSAP ScrollTrigger |
| **6 — Demo** | Screenshots aufnehmen · iPhone-Frame · AnimatePresence-Carousel |
| **7 — Polish** | Dark/Light Mode · Mobile-Test · Lighthouse · OG-Image |

---

## 5. Design-Tokens

### Gold-Palette
| Token | Wert |
|-------|------|
| Gold Primär | `#d4a038` |
| Gold Hell | `#f5d98e` |
| Gold Dunkel | `#b8892a` |

### Utility-Classes (globals.css)

```css
.shadow-gold {
  box-shadow: 0 0 20px rgba(212, 160, 56, 0.3), 0 0 60px rgba(212, 160, 56, 0.1);
}

.text-gradient-gold {
  background: linear-gradient(135deg, #f5d98e 0%, #d4a038 50%, #b8892a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Button-Stile

```tsx
// Gold CTA
"px-8 py-4 bg-[#d4a038] hover:bg-[#f5d98e] text-slate-950 font-semibold
 rounded-xl shadow-gold transition-all duration-200"

// Ghost
"px-8 py-4 border border-white/20 hover:border-[#d4a038]/50 text-white
 font-semibold rounded-xl backdrop-blur-sm hover:bg-white/5 transition-all"
```

### Glassmorphism-Card

```tsx
"bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6
 hover:bg-white/10 hover:border-[#d4a038]/30 hover:shadow-gold transition-all duration-300"
```

---

## 6. Kritische Punkte

1. **Dashboard-Links:** Alle `href="/"` → `href="/dashboard"` (TopHeader, LoginPage, UserMenu, Tiles)
2. **GlobalDitherBackground:** Pathname-Check auf `/` → ausblenden (Hero nutzt eigene Instanz)
3. **Static:** Kein Supabase-Call in `page.tsx` — rein statisch
4. **TopHeader:** Auf `/` ausblenden, Landing hat eigene Navbar
5. **Middleware Matcher:** `/dashboard` zu protected paths, `/` raus
