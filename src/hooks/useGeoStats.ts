'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type GeoCategory = 'minerals' | 'fossils' | 'crystals' | 'meteorites' | 'artifacts' | 'all'

export interface GeoStats {
  totalSpecimens: number
  totalValue: number
  categories: number
  rareFinds: number
  locations: number
  topSpecimens: Array<{
    id: string
    name: string
    value: number
    category: string
    location?: string
  }>
  valueByCategory: Record<string, number>
  recentSpecimens: Array<{
    id: string
    name: string
    addedAt: string
    category: string
  }>
}

export function useGeoStats(category: GeoCategory = 'all') {
  const [stats, setStats] = useState<GeoStats>({
    totalSpecimens: 0,
    totalValue: 0,
    categories: 0,
    rareFinds: 0,
    locations: 0,
    topSpecimens: [],
    valueByCategory: {},
    recentSpecimens: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGeoStats() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Build query for Geo items
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

        const { data: allItems, error: itemsError } = await query

        if (itemsError) throw itemsError

        // Filter items by geo category
        let geoItems = allItems || []
        if (category !== 'all') {
          geoItems = geoItems.filter((item: any) => {
            const geoType = item.attributes?.geoType
            return geoType === category
          })
        } else {
          // For 'all', only include items that have a geoType attribute
          geoItems = geoItems.filter((item: any) => {
            const geoType = item.attributes?.geoType
            return geoType === 'minerals' ||
                   geoType === 'fossils' ||
                   geoType === 'crystals' ||
                   geoType === 'meteorites' ||
                   geoType === 'artifacts'
          })
        }

        // Calculate total specimens
        const totalSpecimens = geoItems.length

        // Calculate total value
        const totalValue = geoItems.reduce((sum: number, item: any) => {
          const value = item._computed_value || 0
          return sum + value
        }, 0)

        // Count unique categories
        const uniqueCategories = new Set<string>()
        geoItems.forEach((item: any) => {
          const geoType = item.attributes?.geoType
          if (geoType) {
            uniqueCategories.add(geoType)
          }
        })
        const categories = uniqueCategories.size

        // Count rare finds (items marked as rare or with high value)
        const rareFinds = geoItems.filter((item: any) => {
          const isRare = item.attributes?.rarity === 'rare' || item.attributes?.rarity === 'very_rare'
          const highValue = (item._computed_value || 0) > 100
          return isRare || highValue
        }).length

        // Count unique locations
        const uniqueLocations = new Set<string>()
        geoItems.forEach((item: any) => {
          const location = item.attributes?.location || item.attributes?.findLocation
          if (location) {
            uniqueLocations.add(location)
          }
        })
        const locations = uniqueLocations.size

        // Get top specimens by value (top 10)
        const topSpecimens = geoItems
          .filter((item: any) => item._computed_value && item._computed_value > 0)
          .sort((a: any, b: any) => (b._computed_value || 0) - (a._computed_value || 0))
          .slice(0, 10)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            value: item._computed_value || 0,
            category: item.attributes?.geoType || 'unknown',
            location: item.attributes?.location || item.attributes?.findLocation
          }))

        // Calculate value by category
        const valueByCategory: Record<string, number> = {}
        geoItems.forEach((item: any) => {
          const geoType = item.attributes?.geoType || 'unknown'
          const value = item._computed_value || 0
          valueByCategory[geoType] = (valueByCategory[geoType] || 0) + value
        })

        // Get recent specimens (last 5)
        const recentSpecimens = geoItems
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            addedAt: item.created_at,
            category: item.attributes?.geoType || 'unknown'
          }))

        setStats({
          totalSpecimens,
          totalValue,
          categories,
          rareFinds,
          locations,
          topSpecimens,
          valueByCategory,
          recentSpecimens
        })

        setError(null)
      } catch (err) {
        console.error('Error fetching Geo stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch Geo stats')
      } finally {
        setLoading(false)
      }
    }

    fetchGeoStats()
  }, [category])

  return { stats, loading, error }
}
