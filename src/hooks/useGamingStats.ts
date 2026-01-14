'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type GamePlatform = 'playstation' | 'xbox' | 'nintendo' | 'pc' | 'retro' | 'all'

export interface GamingStats {
  totalGames: number
  totalValue: number
  platforms: number
  wishlistCount: number
  topGames: Array<{
    name: string
    value: number
    platform: string
  }>
  valueByPlatform: Record<string, number>
  recentGames: Array<{
    name: string
    addedAt: string
  }>
}

export function useGamingStats(platform: GamePlatform = 'all') {
  const [stats, setStats] = useState<GamingStats>({
    totalGames: 0,
    totalValue: 0,
    platforms: 0,
    wishlistCount: 0,
    topGames: [],
    valueByPlatform: {},
    recentGames: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Build query for items with game platform attribute
        let query = supabase
          .from('items')
          .select('name, attributes, estimated_value, estimated_value_currency, created_at, collection_id')
          .eq('owner_id', user.id)

        // Filter by specific platform if not 'all'
        if (platform !== 'all') {
          // Items with attributes.platform = specific platform
          query = query.contains('attributes', { platform })
        } else {
          // Items with any platform attribute
          query = query.not('attributes->platform', 'is', null)
        }

        const { data: items, error } = await query

        if (error) throw error

        if (!items || items.length === 0) {
          setStats({
            totalGames: 0,
            totalValue: 0,
            platforms: 0,
            wishlistCount: 0,
            topGames: [],
            valueByPlatform: {},
            recentGames: []
          })
          setLoading(false)
          return
        }

        // Calculate total games
        const totalGames = items.length

        // Calculate total value
        let totalValue = 0
        items.forEach(item => {
          const value = item.estimated_value || 0
          // TODO: Currency conversion if estimated_value_currency !== 'EUR'
          totalValue += value
        })

        // Count unique platforms
        const uniquePlatforms = new Set<string>()
        items.forEach(item => {
          const platform = item.attributes?.platform
          if (platform) {
            uniquePlatforms.add(platform)
          }
        })
        const platforms = uniquePlatforms.size

        // Calculate value by platform
        const valueByPlatform: Record<string, number> = {}
        items.forEach(item => {
          const platform = item.attributes?.platform || 'unknown'
          const value = item.estimated_value || 0
          valueByPlatform[platform] = (valueByPlatform[platform] || 0) + value
        })

        // Get top games by value (top 5)
        const topGames = items
          .filter(item => item.estimated_value && item.estimated_value > 0)
          .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
          .slice(0, 5)
          .map(item => ({
            name: item.name,
            value: item.estimated_value || 0,
            platform: item.attributes?.platform || 'unknown'
          }))

        // Get recent games (last 5)
        const recentGames = items
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(item => ({
            name: item.name,
            addedAt: item.created_at
          }))

        // Count wishlist items
        // TODO: Implement wishlist counting when wishlist feature is added
        const wishlistCount = 0

        setStats({
          totalGames,
          totalValue,
          platforms,
          wishlistCount,
          topGames,
          valueByPlatform,
          recentGames
        })

      } catch (error) {
        console.error('Error fetching gaming stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [platform, supabase])

  return { stats, loading }
}
