# TCG Grading Feature - Dokumentation

## ✅ Implementiert: GradingInput Komponente

### Übersicht

Die **GradingInput** Komponente ermöglicht professionelles Grading-Tracking für Trading Cards mit Unterstützung für alle großen Grading-Anbieter:

- **PSA** (Professional Sports Authenticator) - Rot
- **BGS** (Beckett Grading Services) - Blau
- **CGC** (Certified Guaranty Company) - Orange
- **SGC** (Sportscard Guaranty) - Grün
- **RAW** (Nicht gegraded)

### Features

#### 1. **Grading-Anbieter Auswahl**
- Dropdown mit allen großen Grading-Unternehmen
- Farbkodierung für visuelle Unterscheidung
- "Keine/RAW" Option für ungegradete Karten

#### 2. **Grade-Wert**
- Anbieter-spezifische Grade-Skalen:
  - **PSA**: 1-10 (Ganzzahlen)
  - **BGS**: 1-10 (mit .5 Schritten, z.B. 9.5)
  - **CGC**: 1-10 (mit .5 Schritten)
  - **SGC**: 1-10 (mit .5 Schritten)
- Beschreibende Labels (z.B. "PSA 10 - Gem Mint")

#### 3. **Zertifikatsnummer**
- Optionales Feld für Cert-Nummer
- Monospace Font für bessere Lesbarkeit
- Wichtig für Authentifizierung und PSA/BGS Registry

#### 4. **Live Preview**
- Zeigt ausgewähltes Grading mit Farbe an
- Format: "PSA 10 #12345678"
- Farbiger Indikator neben Grading-Info

### Datenformat

Die Komponente speichert Grading-Daten als strukturiertes Objekt:

```typescript
interface GradingValue {
  company: 'PSA' | 'BGS' | 'CGC' | 'SGC' | 'RAW' | ''
  grade: string        // z.B. "10", "9.5"
  certNumber: string   // z.B. "12345678"
}
```

**Beispiel:**
```json
{
  "company": "PSA",
  "grade": "10",
  "certNumber": "82364721"
}
```

### Integration

#### In Categories-Template (bereits vorhanden)

Die Trading Card Templates in `/collections/[id]/categories` haben bereits ein "grading" Attribut:

```typescript
// Pokémon Kategorie
{
  name: 'grading',
  display_name: 'PSA/BGS Grading',
  type: 'text'
}
```

#### Automatische Erkennung

Die GradingInput-Komponente wird **automatisch** verwendet wenn:
- Attribut-Name = `'grading'` ODER
- Display-Name enthält "grading" (case-insensitive)

#### Wo integriert?

✅ **Item-Erstellung** (`/collections/[id]/items/new`)
- Zeigt GradingInput für Trading Card Items

✅ **Item-Bearbeitung** (`/collections/[id]/items/[itemId]/edit`)
- Bearbeiten von vorhandenem Grading
- Parse von altem Format ("PSA 10" → strukturiert)

### Grade-Skalen im Detail

#### PSA (10 Stufen)
- **10** - Gem Mint (perfekt)
- **9** - Mint
- **8** - NM-MT (Near Mint - Mint)
- **7** - Near Mint
- **6** - Excellent-MT
- **5** - Excellent
- **4** - Very Good-Excellent
- **3** - Very Good
- **2** - Good
- **1** - Poor

#### BGS (Beckett, 11 Stufen mit .5)
- **10** - Pristine (Black Label bei 10/10/10/10)
- **9.5** - Gem Mint
- **9** - Mint
- **8.5** - NM-MT+
- **8** - NM-MT
- usw. bis 5

#### CGC & SGC (ähnlich BGS, .5 Schritte)

### Abwärtskompatibilität

Die Komponente kann **alte Text-Werte** parsen:

```typescript
// Alt: "PSA 10"
// Neu: { company: "PSA", grade: "10", certNumber: "" }
```

Regex: `/^(PSA|BGS|CGC|SGC)\s+(.+)$/i`

### UI/UX

- **Dark Mode Support** ✅
- **Responsive Design** ✅
- **Tailwind CSS** ✅
- **Farbkodierung** (PSA=Rot, BGS=Blau, CGC=Orange, SGC=Grün)
- **Required Field Support** ✅

### Anwendungsbeispiele

#### Pokémon Karte mit PSA 10 Grading

```
Name: Glurak 1st Edition Base Set
Kategorie: Pokémon
Grading:
  - Anbieter: PSA
  - Grade: 10 - Gem Mint
  - Zertifikat: 82364721

Preview: 🔴 PSA 10 #82364721
```

#### Yu-Gi-Oh Karte mit BGS 9.5

```
Name: Dark Magician LOB-005
Kategorie: Yu-Gi-Oh!
Grading:
  - Anbieter: BGS (Beckett)
  - Grade: 9.5 - Gem Mint
  - Zertifikat: 0012345678

Preview: 🔵 BGS 9.5 #0012345678
```

#### Ungegradete Karte

```
Name: Pikachu Promo
Kategorie: Pokémon
Grading:
  - Anbieter: -- Keine/RAW --

(Keine weiteren Felder)
```

### Nächste Schritte (Optional)

**Phase 5.2 - Erweiterungen:**

1. **Grading-Untergrade** (BGS Subgrades)
   - Centering, Corners, Edges, Surface
   - z.B. "BGS 9.5 (9.5/10/9.5/9)"

2. **PSA Registry Link**
   - Automatischer Link zu PSA Set Registry
   - Cert Verification via PSA API

3. **Grading Value Estimator**
   - Automatische Wertermittlung basierend auf:
     - Karte + Set
     - Grading Company + Grade
     - PSA/eBay Sold Listings API

4. **Grading-Filter im Dashboard**
   - Filter nach Grading Company
   - Filter nach Grade-Bereich (z.B. "PSA 9+")

5. **Grading Statistics**
   - Durchschnitts-Grade pro Sammlung
   - Grading Distribution Chart
   - Wertsteigerung nach Grading

---

## Technische Details

**Datei:** `/src/components/GradingInput.tsx`

**Dependencies:**
- React (Client Component)
- Tailwind CSS
- Dark Mode Support

**Props:**
```typescript
interface GradingInputProps {
  value?: GradingValue | string | null
  onChange: (value: GradingValue) => void
  required?: boolean
  className?: string
}
```

**State Management:**
- Lokaler State für Company, Grade, CertNumber
- Bidirektionales Data Binding mit Parent
- Auto-Reset bei Company-Wechsel

---

## Testing

### Manueller Test-Workflow

1. **Neue Trading Card Sammlung erstellen**
   - Collection anlegen
   - "Trading Cards" Template importieren
   - Pokémon, Yu-Gi-Oh oder MTG Kategorie wählen

2. **Item erstellen**
   - `/collections/[id]/items/new`
   - Kategorie: "Pokémon" wählen
   - Scrolle zu "PSA/BGS Grading" Attribut
   - **Erwartung:** GradingInput Komponente erscheint (nicht Text-Feld!)

3. **Grading eingeben**
   - Anbieter: PSA wählen
   - Grade: "10 - Gem Mint" wählen
   - Cert: "82364721" eingeben
   - **Erwartung:** Preview zeigt "🔴 PSA 10 #82364721"

4. **Item speichern & bearbeiten**
   - Item speichern
   - Item öffnen → Bearbeiten
   - **Erwartung:** Grading-Werte sind korrekt geladen

5. **Dark Mode testen**
   - Settings → Dark Mode aktivieren
   - **Erwartung:** GradingInput ist lesbar in Dark Mode

---

## Changelog

### v1.0 (2026-01-13)

✅ **GradingInput Komponente erstellt**
- 4 Grading Companies (PSA, BGS, CGC, SGC)
- Company-spezifische Grade-Skalen
- Zertifikatsnummer-Feld
- Live Preview mit Farbkodierung

✅ **Integration in Item-Formulare**
- Automatische Erkennung von "grading" Attributen
- New Item Page
- Edit Item Page

✅ **Abwärtskompatibilität**
- Parse alter "PSA 10" String-Werte
- Strukturiertes GradingValue Objekt

✅ **Build erfolgreich**
- TypeScript kompiliert ohne Fehler
- Next.js Build erfolgreich

---

**Status:** ✅ FERTIG (Phase 5.1 - TCG Grading Input)
**Nächste Aufgabe:** TCG Dashboard Tile ODER TCG-Preis-API Integration
