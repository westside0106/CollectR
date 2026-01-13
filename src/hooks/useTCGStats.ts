import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/types/database'

export type TCGGame = 'pokemon' | 'yugioh' | 'magic' | 'all'

interface TCGStats {
  totalCards: number
  totalValue: number
  totalDecks: number
  hotCards: number
  topCards: Array<{
    id: string
    name: string
    value: number
    rarity?: string
    set?: string
    grading?: any
  }>
  valueByRarity: Record<string, { count: number; value: number }>
  recentCards: Array<{
    id: string
    name: string
    created_at: string
    value: number
  }>
}

export function useTCGStats(game: TCGGame = 'all') {
  const [stats, setStats] = useState<TCGStats>({
    totalCards: 0,
    totalValue: 0,
    totalDecks: 0,
    hotCards: 0,
    topCards: [],
    valueByRarity: {},
    recentCards: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTCGStats() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Build query for TCG items
        let query = supabase
          .from('items')
          .select(`
            id,
            name,
            _computed_value,
            _value_currency,
            attributes,
            created_at,
            collection_id,
            status,
            collections!inner(owner_id)
          `)
          .eq('collections.owner_id', user.id)
          .eq('status', 'in_collection')

        // Fetch all items first, then filter by game in memory
        // (because PostgreSQL JSONB querying in Supabase can be tricky)
        const { data: allItems, error: itemsError } = await query

        if (itemsError) throw itemsError

        // Filter items by game type
        let tcgItems = allItems || []
        if (game !== 'all') {
          tcgItems = tcgItems.filter((item: any) => {
            const gameAttr = item.attributes?.game
            return gameAttr === game
          })
        } else {
          // For 'all', only include items that have a game attribute
          tcgItems = tcgItems.filter((item: any) => {
            const gameAttr = item.attributes?.game
            return gameAttr === 'pokemon' || gameAttr === 'yugioh' || gameAttr === 'magic'
          })
        }

        // Calculate total cards
        const totalCards = tcgItems.length

        // Calculate total value (convert to EUR if needed)
        const totalValue = tcgItems.reduce((sum: number, item: any) => {
          const value = item._computed_value || 0
          // TODO: Currency conversion if _value_currency !== 'EUR'
          return sum + value
        }, 0)

        // Get top cards (highest value)
        const topCards = tcgItems
          .filter((item: any) => item._computed_value && item._computed_value > 0)
          .sort((a: any, b: any) => (b._computed_value || 0) - (a._computed_value || 0))
          .slice(0, 10)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            value: item._computed_value || 0,
            rarity: item.attributes?.rarity,
            set: item.attributes?.set || item.attributes?.setName,
            grading: item.attributes?.grading
          }))

        // Get recent cards (last 5)
        const recentCards = tcgItems
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            value: item._computed_value || 0
          }))

        // Calculate hot cards (cards with high value or grading)
        const hotCards = tcgItems.filter((item: any) => {
          const value = item._computed_value || 0
          const grading = item.attributes?.grading
          const grade = grading?.grade ? parseFloat(grading.grade) : 0
          return value > 50 || grade >= 9
        }).length

        // Group by rarity
        const valueByRarity: Record<string, { count: number; value: number }> = {}
        tcgItems.forEach((item: any) => {
          const rarity = item.attributes?.rarity || 'Unknown'
          if (!valueByRarity[rarity]) {
            valueByRarity[rarity] = { count: 0, value: 0 }
          }
          valueByRarity[rarity].count++
          valueByRarity[rarity].value += item._computed_value || 0
        })

        // TODO: Count decks (when deck system is implemented)
        const totalDecks = 0

        setStats({
          totalCards,
          totalValue,
          totalDecks,
          hotCards,
          topCards,
          valueByRarity,
          recentCards
        })

        setError(null)
      } catch (err) {
        console.error('Error fetching TCG stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch TCG stats')
      } finally {
        setLoading(false)
      }
    }

    fetchTCGStats()
  }, [game])

  return { stats, loading, error }
}
