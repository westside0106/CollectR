import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || ''

interface PriceData {
  cardName: string
  setName?: string
  imageUrl?: string
  prices: {
    market?: number
    low?: number
    mid?: number
    high?: number
  }
  currency: string
  source: string
  lastUpdated: string
}

// Pokemon TCG API - Get prices from cardmarket (EUR) and tcgplayer (USD)
async function getPokemonPrices(query: string): Promise<PriceData[]> {
  try {
    const headers: Record<string, string> = {}
    if (POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = POKEMON_TCG_API_KEY
    }

    const searchQueries = [
      `name:"${query}"`,
      `name:${query}*`,
    ]

    for (const searchQuery of searchQueries) {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=10`,
        { headers }
      )

      if (!response.ok) continue

      const data = await response.json()

      if (data.data && data.data.length > 0) {
        return data.data.map((card: any) => {
          // Prefer Cardmarket (EUR) over TCGPlayer (USD)
          const cardmarket = card.cardmarket?.prices
          const tcgplayer = card.tcgplayer?.prices

          let prices: any = {}

          if (cardmarket) {
            // Cardmarket has EUR prices
            prices = {
              market: cardmarket.averageSellPrice || cardmarket.avg1 || cardmarket.avg7 || cardmarket.avg30,
              low: cardmarket.lowPrice,
              mid: cardmarket.averageSellPrice,
              high: cardmarket.trendPrice
            }
          } else if (tcgplayer?.holofoil || tcgplayer?.normal || tcgplayer?.reverseHolofoil) {
            // TCGPlayer has USD prices - convert to EUR (approximate rate 1 USD = 0.92 EUR)
            const priceData = tcgplayer.holofoil || tcgplayer.normal || tcgplayer.reverseHolofoil
            prices = {
              market: priceData.market ? priceData.market * 0.92 : undefined,
              low: priceData.low ? priceData.low * 0.92 : undefined,
              mid: priceData.mid ? priceData.mid * 0.92 : undefined,
              high: priceData.high ? priceData.high * 0.92 : undefined
            }
          }

          return {
            cardName: card.name,
            setName: card.set?.name,
            imageUrl: card.images?.small,
            prices,
            currency: 'EUR',
            source: cardmarket ? 'Cardmarket' : 'TCGPlayer',
            lastUpdated: new Date().toISOString()
          }
        }).filter((p: PriceData) => p.prices.market || p.prices.low || p.prices.mid || p.prices.high)
      }
    }

    return []
  } catch (error) {
    console.error('[Pokemon Prices] Error:', error)
    return []
  }
}

// Yu-Gi-Oh! API - Get prices from YGOPRODeck
async function getYuGiOhPrices(query: string): Promise<PriceData[]> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=10&offset=0`
    )

    if (!response.ok) return []

    const data = await response.json()

    if (!data.data || data.data.length === 0) return []

    return data.data.map((card: any) => {
      const cardPrices = card.card_prices?.[0] || {}

      // YGOPRODeck returns prices in USD, convert to EUR
      const cardmarketPrice = parseFloat(cardPrices.cardmarket_price || '0')
      const tcgplayerPrice = parseFloat(cardPrices.tcgplayer_price || '0')
      const ebayPrice = parseFloat(cardPrices.ebay_price || '0')
      const amazonPrice = parseFloat(cardPrices.amazon_price || '0')

      const market = cardmarketPrice || tcgplayerPrice * 0.92 || ebayPrice * 0.92 || amazonPrice * 0.92

      return {
        cardName: card.name,
        setName: card.card_sets?.[0]?.set_name,
        imageUrl: card.card_images?.[0]?.image_url_small,
        prices: {
          market: market || undefined,
          low: market ? market * 0.8 : undefined,
          mid: market || undefined,
          high: market ? market * 1.2 : undefined
        },
        currency: 'EUR',
        source: cardmarketPrice ? 'Cardmarket' : 'TCGPlayer',
        lastUpdated: new Date().toISOString()
      }
    }).filter((p: PriceData) => p.prices.market)
  } catch (error) {
    console.error('[Yu-Gi-Oh! Prices] Error:', error)
    return []
  }
}

// Magic: The Gathering API - Get prices from Scryfall
async function getMagicPrices(query: string): Promise<PriceData[]> {
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name&dir=asc`
    )

    if (!response.ok) return []

    const data = await response.json()

    if (!data.data || data.data.length === 0) return []

    return data.data.slice(0, 10).map((card: any) => {
      const prices = card.prices || {}

      // Prefer EUR prices, fallback to USD converted
      const eurPrice = parseFloat(prices.eur || '0')
      const usdPrice = parseFloat(prices.usd || '0')
      const eurFoilPrice = parseFloat(prices.eur_foil || '0')
      const usdFoilPrice = parseFloat(prices.usd_foil || '0')

      const market = eurPrice || eurFoilPrice || (usdPrice * 0.92) || (usdFoilPrice * 0.92)

      return {
        cardName: card.name,
        setName: card.set_name,
        imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
        prices: {
          market: market || undefined,
          low: market ? market * 0.85 : undefined,
          mid: market || undefined,
          high: market ? market * 1.15 : undefined
        },
        currency: 'EUR',
        source: 'Scryfall',
        lastUpdated: new Date().toISOString()
      }
    }).filter((p: PriceData) => p.prices.market)
  } catch (error) {
    console.error('[Magic Prices] Error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game')
    const query = searchParams.get('query')

    if (!game || !['pokemon', 'yugioh', 'magic'].includes(game)) {
      return NextResponse.json(
        { error: 'Invalid game type. Must be pokemon, yugioh, or magic' },
        { status: 400 }
      )
    }

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    let results: PriceData[]

    switch (game) {
      case 'pokemon':
        results = await getPokemonPrices(query)
        break
      case 'yugioh':
        results = await getYuGiOhPrices(query)
        break
      case 'magic':
        results = await getMagicPrices(query)
        break
      default:
        results = []
    }

    console.log(`[Card Prices] ${game} - "${query}" - Found ${results.length} results with prices`)

    return NextResponse.json(results)

  } catch (error) {
    console.error('[Card Prices Error]', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch card prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
