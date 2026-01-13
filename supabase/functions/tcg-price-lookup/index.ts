// TCG Price Lookup Function
// Fetches pricing data from multiple TCG APIs
// - Pokémon: pokemontcg.io
// - Yu-Gi-Oh!: ygoprodeck.com
// - Magic: scryfall.com
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2'
const YUGIOH_API_BASE = 'https://db.ygoprodeck.com/api/v7'
const SCRYFALL_API_BASE = 'https://api.scryfall.com'
const CACHE_DURATION_HOURS = 24

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

interface PriceData {
  low?: number
  mid?: number
  high?: number
  market?: number
}

interface PokemonCard {
  id: string
  name: string
  set: {
    name: string
    series: string
  }
  number: string
  rarity?: string
  tcgplayer?: {
    prices?: {
      holofoil?: PriceData
      reverseHolofoil?: PriceData
      normal?: PriceData
      '1stEditionHolofoil'?: PriceData
      unlimitedHolofoil?: PriceData
    }
  }
}

interface PriceLookupResponse {
  cardName: string
  cardId?: string
  setName?: string
  cardNumber?: string
  rawPrice?: {
    min: number
    max: number
    avg: number
    market?: number
    currency: string
  }
  gradedPrice?: {
    estimated: number
    multiplier: number
    currency: string
  }
  source: string
  lastUpdated: string
  message?: string
}

// Helper function to calculate grading multiplier
function getGradingMultiplier(company: string, grade: string): number {
  const gradeNum = parseFloat(grade)

  if (company === 'PSA') {
    if (gradeNum === 10) return 15 // PSA 10 = 15x
    if (gradeNum === 9) return 5   // PSA 9 = 5x
    if (gradeNum === 8) return 2.5 // PSA 8 = 2.5x
    if (gradeNum >= 7) return 1.5  // PSA 7 = 1.5x
    return 1
  }

  if (company === 'BGS') {
    if (gradeNum >= 9.5) return 12 // BGS 9.5+ = 12x (Black Label 10 would be higher)
    if (gradeNum === 9) return 4   // BGS 9 = 4x
    if (gradeNum === 8.5) return 2 // BGS 8.5 = 2x
    return 1
  }

  if (company === 'CGC' || company === 'SGC') {
    if (gradeNum >= 9.5) return 10 // CGC/SGC 9.5+ = 10x
    if (gradeNum === 9) return 4   // CGC/SGC 9 = 4x
    if (gradeNum === 8.5) return 2 // CGC/SGC 8.5 = 2x
    return 1
  }

  return 1
}

// Fetch from Yu-Gi-Oh! API (ygoprodeck.com)
async function fetchYugiohPrice(request: PriceLookupRequest): Promise<PriceLookupResponse> {
  const query = request.cardName.trim()

  const url = `${YUGIOH_API_BASE}/cardinfo.php?fname=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Yu-Gi-Oh! API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    return {
      cardName: request.cardName,
      source: 'ygoprodeck.com',
      lastUpdated: new Date().toISOString(),
      message: 'Card not found. Try with different spelling.'
    }
  }

  // Take the first matching card
  const card = data.data[0]

  // Extract prices from card_prices (TCGPlayer, CardMarket, etc.)
  const prices = card.card_prices?.[0]

  if (!prices) {
    return {
      cardName: card.name,
      cardId: card.id.toString(),
      source: 'ygoprodeck.com',
      lastUpdated: new Date().toISOString(),
      message: 'Card found but no pricing data available'
    }
  }

  // Use CardMarket prices (EUR) if available, otherwise TCGPlayer (USD → EUR)
  const USD_TO_EUR = 0.92
  let avgPrice = 0

  if (prices.cardmarket_price) {
    avgPrice = parseFloat(prices.cardmarket_price)
  } else if (prices.tcgplayer_price) {
    avgPrice = parseFloat(prices.tcgplayer_price) * USD_TO_EUR
  }

  const result: PriceLookupResponse = {
    cardName: card.name,
    cardId: card.id.toString(),
    setName: card.card_sets?.[0]?.set_name,
    cardNumber: card.card_sets?.[0]?.set_code,
    rawPrice: {
      min: Math.round((avgPrice * 0.8) * 100) / 100,
      max: Math.round((avgPrice * 1.2) * 100) / 100,
      avg: Math.round(avgPrice * 100) / 100,
      market: Math.round(avgPrice * 100) / 100,
      currency: 'EUR'
    },
    source: 'ygoprodeck.com',
    lastUpdated: new Date().toISOString()
  }

  // Calculate graded price if grading info provided
  if (request.grading && avgPrice > 0) {
    const multiplier = getGradingMultiplier(request.grading.company, request.grading.grade)
    const estimatedGradedPrice = avgPrice * multiplier

    result.gradedPrice = {
      estimated: Math.round(estimatedGradedPrice * 100) / 100,
      multiplier: multiplier,
      currency: 'EUR'
    }
  }

  return result
}

// Fetch from Scryfall API (Magic: The Gathering)
async function fetchMagicPrice(request: PriceLookupRequest): Promise<PriceLookupResponse> {
  // Build search query
  let query = request.cardName.trim()

  if (request.setName) {
    query += ` set:${request.setName}`
  }

  if (request.cardNumber) {
    query += ` number:${request.cardNumber}`
  }

  const url = `${SCRYFALL_API_BASE}/cards/named?fuzzy=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      return {
        cardName: request.cardName,
        source: 'scryfall.com',
        lastUpdated: new Date().toISOString(),
        message: 'Card not found. Try with different spelling or set name.'
      }
    }
    throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`)
  }

  const card = await response.json()

  // Extract prices
  const prices = card.prices

  if (!prices || (!prices.eur && !prices.usd)) {
    return {
      cardName: card.name,
      cardId: card.id,
      setName: card.set_name,
      cardNumber: card.collector_number,
      source: 'scryfall.com',
      lastUpdated: new Date().toISOString(),
      message: 'Card found but no pricing data available'
    }
  }

  // Prefer EUR prices, fallback to USD converted to EUR
  const USD_TO_EUR = 0.92
  let avgPrice = 0

  if (prices.eur) {
    avgPrice = parseFloat(prices.eur)
  } else if (prices.usd) {
    avgPrice = parseFloat(prices.usd) * USD_TO_EUR
  }

  const result: PriceLookupResponse = {
    cardName: card.name,
    cardId: card.id,
    setName: card.set_name,
    cardNumber: card.collector_number,
    rawPrice: {
      min: Math.round((avgPrice * 0.85) * 100) / 100,
      max: Math.round((avgPrice * 1.15) * 100) / 100,
      avg: Math.round(avgPrice * 100) / 100,
      market: Math.round(avgPrice * 100) / 100,
      currency: 'EUR'
    },
    source: 'scryfall.com',
    lastUpdated: new Date().toISOString()
  }

  // Calculate graded price if grading info provided
  if (request.grading && avgPrice > 0) {
    const multiplier = getGradingMultiplier(request.grading.company, request.grading.grade)
    const estimatedGradedPrice = avgPrice * multiplier

    result.gradedPrice = {
      estimated: Math.round(estimatedGradedPrice * 100) / 100,
      multiplier: multiplier,
      currency: 'EUR'
    }
  }

  return result
}

// Check cache in Supabase
async function checkCache(
  supabase: any,
  cardName: string,
  setName?: string,
  cardNumber?: string
): Promise<PriceLookupResponse | null> {
  const cacheKey = `${cardName}|${setName || ''}|${cardNumber || ''}`

  const { data, error } = await supabase
    .from('tcg_price_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gte('updated_at', new Date(Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000).toISOString())
    .single()

  if (error || !data) return null

  return {
    cardName: data.card_name,
    cardId: data.card_id,
    setName: data.set_name,
    cardNumber: data.card_number,
    rawPrice: data.raw_price,
    source: data.source,
    lastUpdated: data.updated_at,
    message: 'Cached result'
  }
}

// Save to cache
async function saveToCache(
  supabase: any,
  request: PriceLookupRequest,
  response: PriceLookupResponse
): Promise<void> {
  const cacheKey = `${request.cardName}|${request.setName || ''}|${request.cardNumber || ''}`

  await supabase
    .from('tcg_price_cache')
    .upsert({
      cache_key: cacheKey,
      card_name: response.cardName,
      card_id: response.cardId,
      set_name: response.setName,
      card_number: response.cardNumber,
      raw_price: response.rawPrice,
      source: response.source,
      updated_at: new Date().toISOString()
    })
}

// Fetch from Pokémon TCG API
async function fetchPokemonPrice(request: PriceLookupRequest): Promise<PriceLookupResponse> {
  // Build search query
  let query = `name:"${request.cardName}"`

  if (request.setName) {
    query += ` set.name:"${request.setName}"`
  }

  if (request.cardNumber) {
    query += ` number:${request.cardNumber}`
  }

  const apiKey = Deno.env.get('POKEMON_TCG_API_KEY') || ''
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['X-Api-Key'] = apiKey
  }

  const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Pokémon TCG API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    return {
      cardName: request.cardName,
      source: 'pokemontcg.io',
      lastUpdated: new Date().toISOString(),
      message: 'Card not found. Try with different spelling or set name.'
    }
  }

  // Take the first matching card
  const card: PokemonCard = data.data[0]

  // Extract prices from tcgplayer data
  const prices = card.tcgplayer?.prices
  let priceData: PriceData | undefined

  // Priority: holofoil > 1stEditionHolofoil > reverseHolofoil > normal
  if (prices) {
    priceData = prices.holofoil ||
                prices['1stEditionHolofoil'] ||
                prices.unlimitedHolofoil ||
                prices.reverseHolofoil ||
                prices.normal
  }

  if (!priceData) {
    return {
      cardName: card.name,
      cardId: card.id,
      setName: card.set.name,
      cardNumber: card.number,
      source: 'pokemontcg.io',
      lastUpdated: new Date().toISOString(),
      message: 'Card found but no pricing data available'
    }
  }

  // Convert USD to EUR (approximate rate: 1 USD = 0.92 EUR)
  const USD_TO_EUR = 0.92

  const low = priceData.low ? priceData.low * USD_TO_EUR : 0
  const high = priceData.high ? priceData.high * USD_TO_EUR : 0
  const market = priceData.market ? priceData.market * USD_TO_EUR : 0
  const avg = market || ((low + high) / 2)

  const result: PriceLookupResponse = {
    cardName: card.name,
    cardId: card.id,
    setName: card.set.name,
    cardNumber: card.number,
    rawPrice: {
      min: Math.round(low * 100) / 100,
      max: Math.round(high * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      market: market ? Math.round(market * 100) / 100 : undefined,
      currency: 'EUR'
    },
    source: 'pokemontcg.io (TCGPlayer prices in EUR)',
    lastUpdated: new Date().toISOString()
  }

  // Calculate graded price if grading info provided
  if (request.grading && avg > 0) {
    const multiplier = getGradingMultiplier(request.grading.company, request.grading.grade)
    const estimatedGradedPrice = avg * multiplier

    result.gradedPrice = {
      estimated: Math.round(estimatedGradedPrice * 100) / 100,
      multiplier: multiplier,
      currency: 'EUR'
    }
  }

  return result
}

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request
    const requestData: PriceLookupRequest = await req.json()

    // Validate request
    if (!requestData.cardName) {
      return new Response(
        JSON.stringify({ error: 'cardName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default to pokemon if game type not specified
    const gameType = requestData.game || 'pokemon'

    // Validate game type
    if (!['pokemon', 'yugioh', 'magic'].includes(gameType)) {
      return new Response(
        JSON.stringify({
          error: `Game type "${gameType}" is not supported. Available: pokemon, yugioh, magic`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cache first
    const cachedResult = await checkCache(
      supabase,
      requestData.cardName,
      requestData.setName,
      requestData.cardNumber
    )

    if (cachedResult) {
      // If grading info provided, calculate graded price
      if (requestData.grading && cachedResult.rawPrice?.avg) {
        const multiplier = getGradingMultiplier(requestData.grading.company, requestData.grading.grade)
        const estimatedGradedPrice = cachedResult.rawPrice.avg * multiplier

        cachedResult.gradedPrice = {
          estimated: Math.round(estimatedGradedPrice * 100) / 100,
          multiplier: multiplier,
          currency: 'EUR'
        }
      }

      return new Response(
        JSON.stringify(cachedResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch from appropriate API based on game type
    let result: PriceLookupResponse

    switch (gameType) {
      case 'yugioh':
        result = await fetchYugiohPrice(requestData)
        break
      case 'magic':
        result = await fetchMagicPrice(requestData)
        break
      case 'pokemon':
      default:
        result = await fetchPokemonPrice(requestData)
        break
    }

    // Save to cache (only if we have price data)
    if (result.rawPrice) {
      await saveToCache(supabase, requestData, result)
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in tcg-price-lookup:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/tcg-price-lookup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"cardName":"Charizard","setName":"Base Set","game":"pokemon"}'

  Example with grading:
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/tcg-price-lookup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"cardName":"Charizard","setName":"Base Set","game":"pokemon","grading":{"company":"PSA","grade":"10"}}'

*/
