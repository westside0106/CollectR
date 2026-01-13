// Card Search API Integration for Deck Builder
// Supports Pokemon TCG, Yu-Gi-Oh!, and Magic: The Gathering

export interface CardSearchResult {
  id: string
  name: string
  type?: string
  subtype?: string
  rarity?: string
  set?: string
  imageUrl?: string
  game: 'pokemon' | 'yugioh' | 'magic'
}

// Pokemon TCG API (pokemontcg.io)
async function searchPokemonCards(query: string): Promise<CardSearchResult[]> {
  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=20`, {
      headers: {
        'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY || ''
      }
    })

    if (!response.ok) throw new Error('Pokemon API failed')

    const data = await response.json()

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
    console.error('Pokemon search error:', error)
    return []
  }
}

// Yu-Gi-Oh! API (ygoprodeck.com)
async function searchYuGiOhCards(query: string): Promise<CardSearchResult[]> {
  try {
    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=20&offset=0`)

    if (!response.ok) throw new Error('YGOPRODeck API failed')

    const data = await response.json()

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
    console.error('Yu-Gi-Oh search error:', error)
    return []
  }
}

// Magic: The Gathering API (Scryfall)
async function searchMagicCards(query: string): Promise<CardSearchResult[]> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name&dir=asc`)

    if (!response.ok) throw new Error('Scryfall API failed')

    const data = await response.json()

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
    console.error('Magic search error:', error)
    return []
  }
}

// Main search function
export async function searchCards(game: 'pokemon' | 'yugioh' | 'magic', query: string): Promise<CardSearchResult[]> {
  if (!query || query.length < 2) return []

  switch (game) {
    case 'pokemon':
      return searchPokemonCards(query)
    case 'yugioh':
      return searchYuGiOhCards(query)
    case 'magic':
      return searchMagicCards(query)
    default:
      return []
  }
}

// Get card details by ID
export async function getCardDetails(game: 'pokemon' | 'yugioh' | 'magic', cardId: string): Promise<CardSearchResult | null> {
  try {
    switch (game) {
      case 'pokemon': {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY || ''
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
  } catch (error) {
    console.error('Get card details error:', error)
    return null
  }
}
