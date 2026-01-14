// Card Search API Integration for Deck Builder
// Supports Pokemon TCG, Yu-Gi-Oh!, and Magic: The Gathering
// Uses server-side API routes to protect API keys

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

// Main search function - calls server API route
export async function searchCards(game: 'pokemon' | 'yugioh' | 'magic', query: string): Promise<CardSearchResult[]> {
  if (!query || query.length < 2) return []

  try {
    const response = await fetch(`/api/card-search?game=${game}&query=${encodeURIComponent(query)}`)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data
  } catch (error) {
    return []
  }
}

// Get card details by ID - calls server API route
export async function getCardDetails(game: 'pokemon' | 'yugioh' | 'magic', cardId: string): Promise<CardSearchResult | null> {
  try {
    const response = await fetch(`/api/card-search?game=${game}&cardId=${encodeURIComponent(cardId)}`)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
}
