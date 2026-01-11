import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  imageBase64: string
  collectionType?: string // z.B. "hot-wheels", "coins", "stamps"
  existingAttributes?: string[] // Vorhandene Attribute der Kategorie
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const { imageBase64, collectionType, existingAttributes } = await req.json() as AnalyzeRequest

    if (!imageBase64) {
      throw new Error('No image provided')
    }

    // Baue den Prompt basierend auf Sammlungstyp
    const systemPrompt = buildSystemPrompt(collectionType, existingAttributes)

    // Claude API Call
    // Detect media type from base64 string
    let mediaType = 'image/jpeg'
    if (imageBase64.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (imageBase64.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    } else if (imageBase64.startsWith('data:image/gif')) {
      mediaType = 'image/gif'
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                type: 'text',
                text: systemPrompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text || ''

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response')
    }

    const result = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function buildSystemPrompt(collectionType?: string, existingAttributes?: string[]): string {
  const basePrompt = `Analysiere dieses Bild eines Sammlerstücks und extrahiere alle erkennbaren Informationen.

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "name": "Name/Bezeichnung des Items",
  "description": "Kurze Beschreibung (optional)",
  "category": "Erkannte Kategorie",
  "estimatedValue": { "min": 0, "max": 0, "currency": "EUR" },
  "attributes": {
    // Spezifische Attribute je nach Sammlungstyp
  },
  "confidence": 0.0-1.0
}`

  const typeSpecificPrompts: Record<string, string> = {
    'hot-wheels': `
Du analysierst ein Hot Wheels / Matchbox Modellauto.
Extrahiere wenn möglich:
- Name des Modells (z.B. "'67 Camaro", "Twin Mill")
- Serie (z.B. "Redline", "Treasure Hunt", "Super Treasure Hunt")
- Jahr (Produktionsjahr wenn erkennbar)
- Farbe (inkl. Spectraflame, Metallic, etc.)
- Verpackungszustand (OVP/Blister, Lose, etc.)
- Besonderheiten (TH-Logo, Gummi-Reifen, etc.)
- Geschätzter Sammlerwert in EUR`,

    'coins': `
Du analysierst eine Münze.
Extrahiere wenn möglich:
- Land/Herkunft
- Nominal (Wert auf der Münze)
- Prägejahr
- Material (Gold, Silber, Kupfer, etc.)
- Erhaltungsgrad (PP, ST, VZ, SS, etc.)
- Besonderheiten (Fehlprägung, Jubiläum, etc.)
- Geschätzter Sammlerwert in EUR`,

    'stamps': `
Du analysierst eine Briefmarke.
Extrahiere wenn möglich:
- Land/Herkunft
- Ausgabejahr
- Motiv/Thema
- Nominal
- Zustand (Postfrisch, Gestempelt, etc.)
- Katalognummer wenn erkennbar
- Geschätzter Sammlerwert in EUR`,

    'vinyl': `
Du analysierst eine Schallplatte.
Extrahiere wenn möglich:
- Künstler/Band
- Album/Titel
- Label
- Erscheinungsjahr
- Zustand Vinyl (M, NM, VG+, VG, G, etc.)
- Zustand Cover
- Pressung/Edition
- Geschätzter Sammlerwert in EUR`,

    'lego': `
Du analysierst ein LEGO Set.
Extrahiere wenn möglich:
- Set-Nummer
- Set-Name
- Thema (Star Wars, City, Technic, etc.)
- Jahr
- Zustand (MISB, NIB, Komplett, etc.)
- Teileanzahl wenn erkennbar
- Geschätzter Sammlerwert in EUR`,

    'watches': `
Du analysierst eine Uhr.
Extrahiere wenn möglich:
- Marke
- Modell/Referenznummer
- Baujahr (geschätzt)
- Uhrwerk (Automatik, Quarz, etc.)
- Gehäusematerial
- Zustand
- Box & Papiere vorhanden?
- Geschätzter Sammlerwert in EUR`,
  }

  let prompt = basePrompt
  if (collectionType && typeSpecificPrompts[collectionType]) {
    prompt += '\n\n' + typeSpecificPrompts[collectionType]
  }

  if (existingAttributes && existingAttributes.length > 0) {
    prompt += `\n\nFülle wenn möglich diese vordefinierten Attribute aus: ${existingAttributes.join(', ')}`
  }

  prompt += '\n\nWenn du etwas nicht erkennen kannst, lass das Feld weg oder setze null. Sei bei der Wertschätzung konservativ.'

  return prompt
}
