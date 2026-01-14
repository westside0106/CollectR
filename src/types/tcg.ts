/**
 * TCG (Trading Card Game) Type Definitions
 */

export type TCGGame = 'pokemon' | 'yugioh' | 'magic'

export interface DetectedCard {
  name: string
  set?: string
  rarity?: string
  game: TCGGame
  imageUrl?: string
  aiDescription?: string
  aiTags?: string[]
  price?: number | null
}

export interface CardSearchResult {
  id: string
  name: string
  type?: string
  subtype?: string
  rarity?: string
  set?: string
  imageUrl?: string
  game: TCGGame
}

export interface DeckCard {
  id: string
  name: string
  count: number
}

export interface TCGStats {
  totalCards: number
  totalValue: number
  totalDecks: number
  hotCards: number
  topCards: Array<{
    name: string
    value: number
    rarity: string
  }>
  valueByRarity: Record<string, number>
  recentCards: Array<{
    name: string
    addedAt: string
  }>
}

export interface PriceData {
  low?: number
  mid?: number
  high?: number
  market?: number
}

export interface GradedCard {
  company: 'PSA' | 'BGS' | 'CGC' | 'SGC'
  grade: string
  basePrice: number
  multiplier: number
  estimatedValue: number
}
