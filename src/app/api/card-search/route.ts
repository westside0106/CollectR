import { NextRequest, NextResponse } from 'next/server'

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || ''

interface CardSearchResult {
  id: string
  name: string
  type?: string
  subtype?: string
  rarity?: string
  set?: string
  imageUrl?: string
  game: 'pokemon' | 'yugioh' | 'magic'
}

// Pokemon TCG API
async function searchPokemonCards(query: string): Promise<CardSearchResult[]> {
  try {
    if (!POKEMON_TCG_API_KEY) {
      console.warn('[Pokemon TCG] API key not configured')
    }

    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=20`,
      {
        headers: {
          'X-Api-Key': POKEMON_TCG_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error(`[Pokemon TCG] API error: ${response.status} ${response.statusText}`)
      throw new Error(`Pokemon API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[Pokemon TCG] Found ${data.data?.length || 0} cards for "${query}"`)

    return (data.data || []).map((card: any) => ({
      id: card.id,
      name: card.name,
      type: card.supertype,
      subtype: card.subtypes?.join(', '),
      rarity: card.rarity,
      set: card.set?.name,
      imageUrl: card.images?.small,
      game: 'pokemon' as const
    }))
  } catch (error) {
    console.error('[Pokemon TCG] Search failed:', error)
    throw error
  }
}

// Yu-Gi-Oh! API
async function searchYuGiOhCards(query: string): Promise<CardSearchResult[]> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=20&offset=0`
    )

    if (!response.ok) {
      console.error(`[Yu-Gi-Oh!] API error: ${response.status} ${response.statusText}`)
      throw new Error(`YGOPRODeck API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[Yu-Gi-Oh!] Found ${data.data?.length || 0} cards for "${query}"`)

    return (data.data || []).map((card: any) => ({
      id: card.id.toString(),
      name: card.name,
      type: card.type,
      subtype: card.race,
      rarity: card.card_sets?.[0]?.set_rarity || 'Common',
      set: card.card_sets?.[0]?.set_name,
      imageUrl: card.card_images?.[0]?.image_url_small,
      game: 'yugioh' as const
    }))
  } catch (error) {
    console.error('[Yu-Gi-Oh!] Search failed:', error)
    throw error
  }
}

// Magic: The Gathering API
async function searchMagicCards(query: string): Promise<CardSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name&dir=asc`
    )

    if (!response.ok) {
      console.error(`[Magic] API error: ${response.status} ${response.statusText}`)
      throw new Error(`Scryfall API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[Magic] Found ${data.data?.length || 0} cards for "${query}"`)

    return (data.data || []).slice(0, 20).map((card: any) => ({
      id: card.id,
      name: card.name,
      type: card.type_line,
      subtype: card.type_line.split('—')[1]?.trim(),
      rarity: card.rarity,
      set: card.set_name,
      imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
      game: 'magic' as const
    }))
  } catch (error) {
    console.error('[Magic] Search failed:', error)
    throw error
  }
}

// Get card details by ID
async function getCardDetails(game: string, cardId: string): Promise<CardSearchResult | null> {
  switch (game) {
    case 'pokemon': {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
        headers: {
          'X-Api-Key': POKEMON_TCG_API_KEY
        }
      })
      if (!response.ok) return null
      const data = await response.json()
      const card = data.data
      return {
        id: card.id,
        name: card.name,
        type: card.supertype,
        subtype: card.subtypes?.join(', '),
        rarity: card.rarity,
        set: card.set?.name,
        imageUrl: card.images?.small,
        game: 'pokemon'
      }
    }

    case 'yugioh': {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`)
      if (!response.ok) return null
      const data = await response.json()
      const card = data.data[0]
      return {
        id: card.id.toString(),
        name: card.name,
        type: card.type,
        subtype: card.race,
        rarity: card.card_sets?.[0]?.set_rarity || 'Common',
        set: card.card_sets?.[0]?.set_name,
        imageUrl: card.card_images?.[0]?.image_url_small,
        game: 'yugioh'
      }
    }

    case 'magic': {
      const response = await fetch(`https://api.scryfall.com/cards/${cardId}`)
      if (!response.ok) return null
      const card = await response.json()
      return {
        id: card.id,
        name: card.name,
        type: card.type_line,
        subtype: card.type_line.split('—')[1]?.trim(),
        rarity: card.rarity,
        set: card.set_name,
        imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small,
        game: 'magic'
      }
    }

    default:
      return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game')
    const query = searchParams.get('query')
    const cardId = searchParams.get('cardId')

    // Validate game type
    if (!game || !['pokemon', 'yugioh', 'magic'].includes(game)) {
      return NextResponse.json(
        { error: 'Invalid game type. Must be pokemon, yugioh, or magic' },
        { status: 400 }
      )
    }

    // Get card details by ID
    if (cardId) {
      const card = await getCardDetails(game, cardId)
      if (!card) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(card)
    }

    // Search cards by query
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    let results: CardSearchResult[]

    switch (game) {
      case 'pokemon':
        results = await searchPokemonCards(query)
        break
      case 'yugioh':
        results = await searchYuGiOhCards(query)
        break
      case 'magic':
        results = await searchMagicCards(query)
        break
      default:
        results = []
    }

    console.log(`[Card Search] ${game} - "${query}" - Found ${results.length} results`)

    return NextResponse.json(results)

  } catch (error) {
    console.error('[Card Search Error]', error)
    return NextResponse.json(
      {
        error: 'Failed to search cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
