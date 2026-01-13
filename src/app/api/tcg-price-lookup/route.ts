import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2'
const YUGIOH_API_BASE = 'https://db.ygoprodeck.com/api/v7'
const SCRYFALL_API_BASE = 'https://api.scryfall.com'
const USD_TO_EUR = 0.92

interface PriceResult {
  cardName: string
  setName?: string
  cardNumber?: string
  rawPrice?: {
    min: number
    max: number
    avg: number
    market?: number
    low?: number
    mid?: number
    high?: number
  }
  source: string
  lastUpdated: string
  message?: string
}

// Fetch Pokemon card price
async function fetchPokemonPrice(cardName: string, setName?: string, cardNumber?: string): Promise<PriceResult> {
  let query = `name:"${cardName}"`

  if (setName) {
    query += ` set.name:"${setName}"`
  }

  if (cardNumber) {
    query += ` number:${cardNumber}`
  }

  const url = `${POKEMON_TCG_API_BASE}/cards?q=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Pokemon API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    return {
      cardName,
      source: 'pokemontcg.io',
      lastUpdated: new Date().toISOString(),
      message: 'Card not found'
    }
  }

  const card = data.data[0]
  const prices = card.tcgplayer?.prices
  let priceData = prices?.holofoil || prices?.['1stEditionHolofoil'] || prices?.normal || prices?.reverseHolofoil

  if (!priceData) {
    return {
      cardName: card.name,
      setName: card.set.name,
      cardNumber: card.number,
      source: 'pokemontcg.io',
      lastUpdated: new Date().toISOString(),
      message: 'No pricing data available'
    }
  }

  const low = priceData.low ? priceData.low * USD_TO_EUR : 0
  const high = priceData.high ? priceData.high * USD_TO_EUR : 0
  const market = priceData.market ? priceData.market * USD_TO_EUR : 0
  const avg = market || ((low + high) / 2)

  return {
    cardName: card.name,
    setName: card.set.name,
    cardNumber: card.number,
    rawPrice: {
      min: Math.round(low * 100) / 100,
      max: Math.round(high * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      market: market ? Math.round(market * 100) / 100 : undefined,
      low: Math.round(low * 100) / 100,
      high: Math.round(high * 100) / 100
    },
    source: 'pokemontcg.io',
    lastUpdated: new Date().toISOString()
  }
}

// Fetch Yu-Gi-Oh! card price
async function fetchYugiohPrice(cardName: string): Promise<PriceResult> {
  const url = `${YUGIOH_API_BASE}/cardinfo.php?fname=${encodeURIComponent(cardName)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`YuGiOh API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    return {
      cardName,
      source: 'ygoprodeck.com',
      lastUpdated: new Date().toISOString(),
      message: 'Card not found'
    }
  }

  const card = data.data[0]
  const prices = card.card_prices?.[0]

  if (!prices) {
    return {
      cardName: card.name,
      source: 'ygoprodeck.com',
      lastUpdated: new Date().toISOString(),
      message: 'No pricing data available'
    }
  }

  let avgPrice = 0
  if (prices.cardmarket_price) {
    avgPrice = parseFloat(prices.cardmarket_price)
  } else if (prices.tcgplayer_price) {
    avgPrice = parseFloat(prices.tcgplayer_price) * USD_TO_EUR
  }

  return {
    cardName: card.name,
    setName: card.card_sets?.[0]?.set_name,
    cardNumber: card.card_sets?.[0]?.set_code,
    rawPrice: {
      min: Math.round((avgPrice * 0.8) * 100) / 100,
      max: Math.round((avgPrice * 1.2) * 100) / 100,
      avg: Math.round(avgPrice * 100) / 100,
      market: Math.round(avgPrice * 100) / 100,
      low: Math.round((avgPrice * 0.8) * 100) / 100,
      high: Math.round((avgPrice * 1.2) * 100) / 100
    },
    source: 'ygoprodeck.com',
    lastUpdated: new Date().toISOString()
  }
}

// Fetch Magic: The Gathering card price
async function fetchMagicPrice(cardName: string, setName?: string, cardNumber?: string): Promise<PriceResult> {
  let query = cardName

  if (setName) {
    query += ` set:${setName}`
  }

  if (cardNumber) {
    query += ` number:${cardNumber}`
  }

  const url = `${SCRYFALL_API_BASE}/cards/named?fuzzy=${encodeURIComponent(query)}`
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      return {
        cardName,
        source: 'scryfall.com',
        lastUpdated: new Date().toISOString(),
        message: 'Card not found'
      }
    }
    throw new Error(`Scryfall API error: ${response.status}`)
  }

  const card = await response.json()
  const prices = card.prices

  if (!prices || (!prices.eur && !prices.usd)) {
    return {
      cardName: card.name,
      setName: card.set_name,
      cardNumber: card.collector_number,
      source: 'scryfall.com',
      lastUpdated: new Date().toISOString(),
      message: 'No pricing data available'
    }
  }

  let avgPrice = 0
  if (prices.eur) {
    avgPrice = parseFloat(prices.eur)
  } else if (prices.usd) {
    avgPrice = parseFloat(prices.usd) * USD_TO_EUR
  }

  return {
    cardName: card.name,
    setName: card.set_name,
    cardNumber: card.collector_number,
    rawPrice: {
      min: Math.round((avgPrice * 0.85) * 100) / 100,
      max: Math.round((avgPrice * 1.15) * 100) / 100,
      avg: Math.round(avgPrice * 100) / 100,
      market: Math.round(avgPrice * 100) / 100,
      low: Math.round((avgPrice * 0.85) * 100) / 100,
      high: Math.round((avgPrice * 1.15) * 100) / 100
    },
    source: 'scryfall.com',
    lastUpdated: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardName, setName, cardNumber, game } = body

    if (!cardName) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    const gameType = game || 'pokemon'

    let result: PriceResult

    switch (gameType) {
      case 'yugioh':
        result = await fetchYugiohPrice(cardName)
        break
      case 'magic':
        result = await fetchMagicPrice(cardName, setName, cardNumber)
        break
      case 'pokemon':
      default:
        result = await fetchPokemonPrice(cardName, setName, cardNumber)
        break
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
