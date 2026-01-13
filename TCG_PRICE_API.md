# TCG Preis-API Integration - Anleitung

## Übersicht

Für automatische Preisabfragen bei Trading Cards gibt es mehrere APIs. Hier sind die wichtigsten mit Anleitung zum API-Key erhalten.

---

## 🎯 TCGplayer API (Empfohlen für USA)

**Website:** https://www.tcgplayer.com/
**Developer Portal:** https://docs.tcgplayer.com/

### Features:
- ✅ Größte TCG-Datenbank (Magic, Pokémon, Yu-Gi-Oh!, etc.)
- ✅ Live Marktpreise
- ✅ Preishistorie
- ✅ Card-Suche nach Name/Set
- ⚠️ Hauptsächlich US-Markt

### API-Key erhalten:

1. **Account erstellen:**
   - Gehe zu: https://www.tcgplayer.com/
   - Registriere dich mit E-Mail

2. **Developer Account:**
   - Navigiere zu: https://store.tcgplayer.com/admin/settings/API
   - ODER direkt: https://developer.tcgplayer.com/
   - Klicke "Create an App"

3. **App erstellen:**
   - **App Name:** z.B. "CollectR Price Checker"
   - **Description:** "Personal collection management app"
   - **Category:** "Other"
   - **Speichern**

4. **API Keys:**
   - **Public Key** (Client ID)
   - **Private Key** (Client Secret)
   - ⚠️ NIEMALS im Frontend nutzen! Nur im Backend/Supabase Function

5. **Environment Variable setzen:**
   ```bash
   # In Vercel/Supabase
   TCGPLAYER_PUBLIC_KEY=your_public_key_here
   TCGPLAYER_PRIVATE_KEY=your_private_key_here
   ```

### Rate Limits:
- **Free Tier:** 300 Requests/Tag
- **Pro Tier:** 25.000+ Requests/Tag ($19/Monat)

### Beispiel API Call:

```typescript
// Supabase Edge Function
const authResponse = await fetch('https://api.tcgplayer.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: Deno.env.get('TCGPLAYER_PUBLIC_KEY'),
    client_secret: Deno.env.get('TCGPLAYER_PRIVATE_KEY')
  })
})

const { access_token } = await authResponse.json()

// Card-Suche
const searchResponse = await fetch(
  'https://api.tcgplayer.com/catalog/products?categoryId=1&productName=Charizard',
  {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  }
)

const products = await searchResponse.json()
```

---

## 🇪🇺 Cardmarket API (Empfohlen für Europa)

**Website:** https://www.cardmarket.com/
**Developer Portal:** https://api.cardmarket.com/ws/documentation

### Features:
- ✅ Europas größter TCG-Marktplatz
- ✅ EUR-Preise
- ✅ Magic, Pokémon, Yu-Gi-Oh!, etc.
- ✅ Verkäufer-Ratings
- ⚠️ OAuth 1.0a (komplex)

### API-Key erhalten:

1. **Account erstellen:**
   - https://www.cardmarket.com/
   - Registriere dich

2. **Seller Account:**
   - Du brauchst einen **Verkäufer-Account** (kostenlos)
   - Navigiere zu: "Verkaufen" → "Konto"

3. **API Zugang beantragen:**
   - E-Mail an: api@cardmarket.com
   - Betreff: "API Access Request"
   - Inhalt:
     ```
     Hallo Cardmarket Team,

     ich entwickle eine private Sammlungsverwaltungs-App (CollectR)
     und möchte die Cardmarket API nutzen, um automatisch Kartenpreise
     abzurufen.

     App-Name: CollectR
     Zweck: Persönliche Sammlungsverwaltung mit Preisabfrage
     Geschätzter Traffic: <100 Requests/Tag

     Vielen Dank!
     ```

4. **API Credentials erhalten:**
   - Nach Freischaltung erhältst du:
     - **App Token**
     - **App Secret**
     - **Access Token**
     - **Access Token Secret**

5. **Environment Variables:**
   ```bash
   CARDMARKET_APP_TOKEN=your_app_token
   CARDMARKET_APP_SECRET=your_app_secret
   CARDMARKET_ACCESS_TOKEN=your_access_token
   CARDMARKET_ACCESS_TOKEN_SECRET=your_access_token_secret
   ```

### Rate Limits:
- **Requests:** 5.000/Tag (kostenlos)
- **Request Interval:** Min. 100ms zwischen Requests

### Authentifizierung (OAuth 1.0a):

```typescript
// OAuth 1.0a Signature (komplex!)
import { createHmac } from 'crypto'

function generateOAuthSignature(method: string, url: string, params: any) {
  const appToken = Deno.env.get('CARDMARKET_APP_TOKEN')
  const appSecret = Deno.env.get('CARDMARKET_APP_SECRET')
  const accessToken = Deno.env.get('CARDMARKET_ACCESS_TOKEN')
  const accessSecret = Deno.env.get('CARDMARKET_ACCESS_TOKEN_SECRET')

  const nonce = Math.random().toString(36).substring(2)
  const timestamp = Math.floor(Date.now() / 1000)

  const oauthParams = {
    oauth_consumer_key: appToken,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    ...params
  }

  // Parameter sortieren & URL-encoden
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
    .join('&')

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`
  const signingKey = `${encodeURIComponent(appSecret)}&${encodeURIComponent(accessSecret)}`

  const signature = createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64')

  return {
    ...oauthParams,
    oauth_signature: signature
  }
}

// API Call
const oauthHeader = generateOAuthSignature('GET', 'https://api.cardmarket.com/ws/v2.0/products/find', {
  search: 'Charizard',
  idGame: 1 // 1 = Magic, 3 = Pokémon, 6 = Yu-Gi-Oh!
})

const authString = Object.entries(oauthHeader)
  .map(([key, val]) => `${key}="${encodeURIComponent(val as string)}"`)
  .join(', ')

const response = await fetch(
  'https://api.cardmarket.com/ws/v2.0/products/find?search=Charizard&idGame=3',
  {
    headers: {
      'Authorization': `OAuth ${authString}`
    }
  }
)
```

**Tipp:** Nutze eine OAuth 1.0a Library wie `oauth-1.0a` (npm) für die Signatur-Generierung.

---

## 💎 Pokémon TCG API (Kostenlos, aber limitiert)

**Website:** https://pokemontcg.io/
**Docs:** https://docs.pokemontcg.io/

### Features:
- ✅ **Komplett kostenlos**
- ✅ Keine Registrierung nötig
- ✅ Card-Datenbank (Name, Set, Rarity, etc.)
- ⚠️ **KEINE Preise** (nur Card-Daten)
- ⚠️ Nur Pokémon (kein Magic/Yu-Gi-Oh)

### API-Key (optional für höhere Limits):

1. **Kostenlos ohne Key:**
   - 20.000 Requests/Tag
   - Kein API Key nötig

2. **Mit API Key (höhere Limits):**
   - https://dev.pokemontcg.io/
   - "Get a Key" klicken
   - E-Mail eingeben
   - Bestätigungs-Mail erhalten

3. **Environment Variable:**
   ```bash
   POKEMON_TCG_API_KEY=your_api_key_here
   ```

### Beispiel API Call:

```typescript
const response = await fetch(
  'https://api.pokemontcg.io/v2/cards?q=name:Charizard set.name:"Base Set"',
  {
    headers: {
      'X-Api-Key': Deno.env.get('POKEMON_TCG_API_KEY') // Optional
    }
  }
)

const { data } = await response.json()

// data[0].tcgplayer.prices.holofoil.market // Preis (wenn vorhanden)
```

**Hinweis:** Preise sind von TCGplayer - aber oft veraltet oder fehlen.

---

## 🔗 eBay API (für Verkaufspreise)

**Website:** https://developer.ebay.com/

### Features:
- ✅ Reale Verkaufspreise (Sold Listings)
- ✅ Weltweit
- ✅ Alle TCG-Typen
- ⚠️ Komplex zu implementieren

### API-Key erhalten:

1. **Developer Account:**
   - https://developer.ebay.com/signin
   - eBay Account erstellen/nutzen

2. **App erstellen:**
   - Navigiere zu: https://developer.ebay.com/my/keys
   - "Create Application Key"
   - **Environment:** Production (nicht Sandbox!)
   - App-Name: "CollectR"

3. **API Keys:**
   - **App ID (Client ID)**
   - **Cert ID (Client Secret)**

4. **OAuth Token erhalten:**
   ```bash
   # Environment Variables
   EBAY_CLIENT_ID=your_app_id
   EBAY_CLIENT_SECRET=your_cert_id
   ```

5. **API Call:**
   ```typescript
   // OAuth Token
   const authResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       'Authorization': `Basic ${btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`)}`
     },
     body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
   })

   const { access_token } = await authResponse.json()

   // Search Sold Listings
   const searchResponse = await fetch(
     'https://api.ebay.com/buy/browse/v1/item_summary/search?q=Charizard+PSA+10&filter=buyingOptions:{FIXED_PRICE}|conditions:{NEW}|itemLocationCountry:US',
     {
       headers: {
         'Authorization': `Bearer ${access_token}`,
         'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' // oder EBAY_DE
       }
     }
   )
   ```

### Rate Limits:
- **Community Edition:** 5.000 Calls/Tag (kostenlos)
- **Elevated Edition:** 25.000+ Calls/Tag (auf Anfrage)

---

## 📋 Vergleich & Empfehlung

| API | Region | TCGs | Preise | Kostenlos | Komplexität |
|-----|--------|------|--------|-----------|-------------|
| **TCGplayer** | USA | ✅ Alle | ✅ Live | ⚠️ 300/Tag | ⭐⭐ Mittel |
| **Cardmarket** | EU | ✅ Alle | ✅ Live | ✅ 5.000/Tag | ⭐⭐⭐ Hoch (OAuth) |
| **Pokémon TCG API** | Global | ⚠️ Nur Pokémon | ⚠️ Veraltet | ✅ Unbegrenzt | ⭐ Einfach |
| **eBay API** | Global | ✅ Alle | ✅ Sold Prices | ⚠️ 5.000/Tag | ⭐⭐⭐ Hoch |

### Empfehlung für CollectR:

**Option 1: Cardmarket API (EU-Nutzer)**
- Beste Preis-Genauigkeit für EUR
- Kostenlos & großzügig (5.000/Tag)
- OAuth 1.0a ist komplex, aber lohnt sich

**Option 2: TCGplayer API (US-Nutzer)**
- Einfacher als Cardmarket
- Gute Dokumentation
- 300 Requests/Tag reicht für persönliche Nutzung

**Option 3: Hybrid (Empfohlen!)**
- **Cardmarket** für EUR-Preise
- **TCGplayer** als Fallback
- **eBay API** für Sold Listings bei rare Cards

---

## 🚀 Implementation in CollectR

### Schritt 1: Supabase Edge Function erstellen

```bash
supabase functions new tcg-price-lookup
```

### Schritt 2: Environment Variables setzen

```bash
# Lokal (.env.local)
TCGPLAYER_PUBLIC_KEY=xxx
TCGPLAYER_PRIVATE_KEY=xxx
CARDMARKET_APP_TOKEN=xxx
CARDMARKET_APP_SECRET=xxx
CARDMARKET_ACCESS_TOKEN=xxx
CARDMARKET_ACCESS_TOKEN_SECRET=xxx

# Vercel
vercel env add TCGPLAYER_PUBLIC_KEY
vercel env add TCGPLAYER_PRIVATE_KEY
# ... etc

# Supabase
supabase secrets set TCGPLAYER_PUBLIC_KEY=xxx
supabase secrets set TCGPLAYER_PRIVATE_KEY=xxx
```

### Schritt 3: API Function Code

Erstelle: `supabase/functions/tcg-price-lookup/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface PriceLookupRequest {
  cardName: string
  setName?: string
  cardNumber?: string
  game: 'pokemon' | 'yugioh' | 'magic'
  grading?: {
    company: 'PSA' | 'BGS' | 'CGC' | 'SGC'
    grade: string
  }
}

serve(async (req) => {
  const { cardName, setName, game, grading } = await req.json() as PriceLookupRequest

  // TODO: Implement Cardmarket/TCGplayer lookup
  // 1. Search card by name + set
  // 2. Get price data
  // 3. If graded, apply grading multiplier
  // 4. Return price estimate

  return new Response(
    JSON.stringify({
      cardName,
      rawPrice: { min: 5.00, max: 50.00, avg: 25.00, currency: 'EUR' },
      gradedPrice: grading ? { min: 50.00, max: 500.00, avg: 250.00, currency: 'EUR' } : null,
      source: 'cardmarket',
      lastUpdated: new Date().toISOString()
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Schritt 4: Frontend Integration

In `src/app/collections/[id]/scan/page.tsx`:

```typescript
async function lookupCardPrice(cardName: string) {
  const response = await fetch('/api/tcg-price-lookup', {
    method: 'POST',
    body: JSON.stringify({ cardName, game: 'pokemon' })
  })

  const priceData = await response.json()

  // Auto-fill estimated_value Feld
  setEstimatedValue(priceData.rawPrice.avg)
}
```

---

## 💡 Best Practices

1. **Caching:** Cache Preis-Abfragen für 24h (in Supabase Tabelle)
2. **Rate Limiting:** Max 1 Request/Sekunde
3. **Fallbacks:** Wenn eine API down ist, nutze andere
4. **User Input:** Lass User Preise manuell überschreiben
5. **Disclaimer:** "Preise sind Schätzungen, keine Garantie"

---

## 📞 Support & Kontakt

**TCGplayer Support:** support@tcgplayer.com
**Cardmarket Support:** api@cardmarket.com
**eBay Developer:** https://developer.ebay.com/support

---

**Status:** 📝 Anleitung komplett
**Letzte Aktualisierung:** 2026-01-13
