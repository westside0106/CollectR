# TCG Price Lookup Function

Diese Supabase Edge Function holt Preisinformationen für Trading Cards von der [pokemontcg.io API](https://pokemontcg.io).

## Features

- **Pokémon TCG Preisabfrage** über die pokemontcg.io API
- **Automatische Währungskonvertierung** von USD nach EUR (ca. 0.92 Wechselkurs)
- **Grading-Preisberechnung** für PSA/BGS/CGC/SGC
  - PSA 10: 15x Multiplikator
  - PSA 9: 5x Multiplikator
  - BGS 9.5+: 12x Multiplikator
  - Und mehr...
- **24h Caching** in Supabase Datenbank zur Rate-Limit-Vermeidung
- **Intelligente Preiswahl** (holofoil > 1st Edition > reverse holo > normal)
- **CORS-Support** für Frontend-Aufrufe

## Setup

### 1. Datenbank Migration ausführen

Bevor die Function verwendet werden kann, muss die `tcg_price_cache` Tabelle erstellt werden:

```bash
# Supabase CLI installieren (falls nicht vorhanden)
npm install -g supabase

# In das Projektverzeichnis wechseln
cd /Users/flip/Downloads/CollectR_clean

# Supabase starten (lokal)
supabase start

# Migration ausführen
supabase db push
```

Die Migration erstellt folgende Tabelle:

```sql
CREATE TABLE tcg_price_cache (
  id UUID PRIMARY KEY,
  cache_key TEXT UNIQUE,        -- Format: "cardName|setName|cardNumber"
  card_name TEXT,
  card_id TEXT,                 -- pokemontcg.io card ID
  set_name TEXT,
  card_number TEXT,
  raw_price JSONB,              -- {min, max, avg, market, currency}
  source TEXT,                  -- "pokemontcg.io"
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 2. Optional: API Key hinzufügen

Die pokemontcg.io API funktioniert ohne Key, aber mit Key gibt es höhere Rate Limits:

```bash
# .env.local erstellen
echo "POKEMON_TCG_API_KEY=your_key_here" >> .env.local

# Oder in Supabase Secrets setzen (für Production)
supabase secrets set POKEMON_TCG_API_KEY=your_key_here
```

API Key beantragen: https://dev.pokemontcg.io/

### 3. Function deployen

```bash
# Lokal testen
supabase functions serve tcg-price-lookup

# In Production deployen
supabase functions deploy tcg-price-lookup
```

## Verwendung

### Request Format

```typescript
POST /functions/v1/tcg-price-lookup

{
  "cardName": "Charizard",           // Pflichtfeld
  "setName": "Base Set",             // Optional, verbessert Genauigkeit
  "cardNumber": "4",                 // Optional
  "game": "pokemon",                 // Aktuell nur "pokemon" unterstützt
  "grading": {                       // Optional
    "company": "PSA",                // PSA, BGS, CGC, SGC
    "grade": "10"                    // Grade als String (z.B. "10", "9.5")
  }
}
```

### Response Format

```typescript
{
  "cardName": "Charizard",
  "cardId": "base1-4",
  "setName": "Base Set",
  "cardNumber": "4",
  "rawPrice": {                      // Preis für ungraded Karte
    "min": 50.00,
    "max": 150.00,
    "avg": 92.00,
    "market": 100.00,
    "currency": "EUR"
  },
  "gradedPrice": {                   // Nur wenn grading angegeben
    "estimated": 1380.00,            // avg * multiplier
    "multiplier": 15,                // PSA 10 = 15x
    "currency": "EUR"
  },
  "source": "pokemontcg.io (TCGPlayer prices in EUR)",
  "lastUpdated": "2026-01-13T12:00:00.000Z",
  "message": "Cached result"         // Optional
}
```

### Beispiel-Aufrufe

#### Einfache Abfrage (ohne Grading)

```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/tcg-price-lookup' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "cardName": "Pikachu",
    "setName": "Base Set",
    "game": "pokemon"
  }'
```

#### Mit Grading

```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/tcg-price-lookup' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "cardName": "Charizard",
    "setName": "Base Set",
    "cardNumber": "4",
    "game": "pokemon",
    "grading": {
      "company": "PSA",
      "grade": "10"
    }
  }'
```

#### Aus dem Frontend (Next.js)

```typescript
const response = await fetch('/api/functions/tcg-price-lookup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cardName: 'Mew',
    setName: 'Legendary Collection',
    game: 'pokemon',
    grading: {
      company: 'BGS',
      grade: '9.5'
    }
  })
});

const data = await response.json();
console.log(data.gradedPrice.estimated); // Geschätzter Preis
```

## Grading Multiplikatoren

Die Function verwendet folgende Multiplikatoren für gegraduete Karten:

| Company | Grade | Multiplikator |
|---------|-------|---------------|
| PSA | 10 | 15x |
| PSA | 9 | 5x |
| PSA | 8 | 2.5x |
| PSA | 7 | 1.5x |
| BGS | 9.5+ | 12x |
| BGS | 9 | 4x |
| BGS | 8.5 | 2x |
| CGC/SGC | 9.5+ | 10x |
| CGC/SGC | 9 | 4x |
| CGC/SGC | 8.5 | 2x |

## Caching

- Preise werden **24 Stunden** gecacht
- Cache-Key: `{cardName}|{setName}|{cardNumber}`
- Bei erneutem Request mit gleichen Parametern wird der gecachte Wert zurückgegeben
- Grading-Berechnungen werden dynamisch durchgeführt (nicht gecacht)

## Rate Limits

**Ohne API Key:**
- 1000 Requests pro Stunde
- 20,000 Requests pro Tag

**Mit API Key:**
- Deutlich höhere Limits
- Empfohlen für Production

**Caching-Strategie minimiert API-Aufrufe!**

## Fehlerbehandlung

Die Function gibt aussagekräftige Fehlermeldungen zurück:

```typescript
// Karte nicht gefunden
{
  "cardName": "Unknown Card",
  "source": "pokemontcg.io",
  "lastUpdated": "2026-01-13T12:00:00.000Z",
  "message": "Card not found. Try with different spelling or set name."
}

// Keine Preisdaten verfügbar
{
  "cardName": "Pikachu",
  "cardId": "base1-58",
  "setName": "Base Set",
  "cardNumber": "58",
  "source": "pokemontcg.io",
  "lastUpdated": "2026-01-13T12:00:00.000Z",
  "message": "Card found but no pricing data available"
}

// Serverfehleer
{
  "error": "Failed to fetch price data",
  "details": "Pokémon TCG API error: 500 Internal Server Error"
}
```

## Erweiterungen für Yu-Gi-Oh! und Magic

Die Function ist vorbereitet für zukünftige Unterstützung von Yu-Gi-Oh! und Magic: The Gathering:

```typescript
// Aktuell wird ein Fehler zurückgegeben:
{
  "error": "Game type \"yugioh\" is not yet supported. Currently only \"pokemon\" is available."
}

// In Zukunft können weitere APIs integriert werden:
// - Yu-Gi-Oh!: ygoprodeck.com API
// - Magic: Scryfall API oder TCGPlayer
```

## Troubleshooting

### "Table tcg_price_cache does not exist"

Migration wurde nicht ausgeführt. Run:
```bash
supabase db push
```

### "Failed to fetch price data"

- Prüfe Internet-Verbindung
- Prüfe pokemontcg.io Status: https://pokemontcg.io
- Prüfe API Key (falls verwendet)

### "Card not found"

- Prüfe Schreibweise des Kartennamens
- Versuche englische Kartennamen (API unterstützt primär EN)
- Füge setName hinzu für genauere Ergebnisse

### Alte Cache-Einträge löschen

```sql
-- Alle Cache-Einträge älter als 24h löschen
DELETE FROM tcg_price_cache
WHERE updated_at < NOW() - INTERVAL '24 hours';

-- Kompletten Cache leeren
TRUNCATE tcg_price_cache;
```

## Integration in CollectR

Die Function kann in den Item-Formularen verwendet werden:

1. **Automatische Preisbefüllung** beim Erstellen neuer Karten
2. **Preis-Refresh-Button** in der Item-Detailansicht
3. **Bulk-Preis-Update** für Collections

Beispiel-Integration siehe: `src/components/GradingInput.tsx`

## Links

- pokemontcg.io Dokumentation: https://docs.pokemontcg.io
- API Key beantragen: https://dev.pokemontcg.io
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
