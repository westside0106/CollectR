'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ShopStats {
  activeListings: number
  revenue30d: number
  totalOrders: number
  itemsInStock: number
  topSellingItems: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  revenueByMonth: Record<string, number>
}

export function useShopStats() {
  const [stats, setStats] = useState<ShopStats>({
    activeListings: 0,
    revenue30d: 0,
    totalOrders: 0,
    itemsInStock: 0,
    topSellingItems: [],
    revenueByMonth: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchShopStats() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Query items marked for sale (status = 'for_sale' or has listing_price)
        const { data: allItems, error: itemsError } = await supabase
          .from('items')
          .select(`
            id,
            name,
            status,
            _computed_value,
            _value_currency,
            attributes,
            created_at,
            collection_id,
            collections!inner(owner_id)
          `)
          .eq('collections.owner_id', user.id)

        if (itemsError) throw itemsError

        // Calculate active listings (items for sale)
        const forSaleItems = (allItems || []).filter((item: any) => {
          return item.status === 'for_sale' ||
                 item.attributes?.listingStatus === 'active' ||
                 item.attributes?.forSale === true
        })
        const activeListings = forSaleItems.length

        // Calculate items in stock (in_collection status)
        const itemsInStock = (allItems || []).filter((item: any) =>
          item.status === 'in_collection'
        ).length

        // Get sold items for revenue calculation
        const soldItems = (allItems || []).filter((item: any) =>
          item.status === 'sold'
        )

        // Calculate revenue from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const revenue30d = soldItems
          .filter((item: any) => {
            const soldDate = item.attributes?.soldDate
            if (!soldDate) return false
            return new Date(soldDate) >= thirtyDaysAgo
          })
          .reduce((sum: number, item: any) => {
            const salePrice = item.attributes?.salePrice || item._computed_value || 0
            return sum + salePrice
          }, 0)

        // Count total orders (sold items)
        const totalOrders = soldItems.length

        // Calculate top selling items
        // Group sold items by name to find bestsellers
        const salesByItem = new Map<string, { count: number; revenue: number; id: string }>()
        soldItems.forEach((item: any) => {
          const key = item.name
          const existing = salesByItem.get(key) || { count: 0, revenue: 0, id: item.id }
          const salePrice = item.attributes?.salePrice || item._computed_value || 0
          salesByItem.set(key, {
            count: existing.count + 1,
            revenue: existing.revenue + salePrice,
            id: existing.id
          })
        })

        const topSellingItems = Array.from(salesByItem.entries())
          .map(([name, data]) => ({
            id: data.id,
            name,
            sales: data.count,
            revenue: data.revenue
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        // Calculate revenue by month (last 6 months)
        const revenueByMonth: Record<string, number> = {}
        soldItems.forEach((item: any) => {
          const soldDate = item.attributes?.soldDate
          if (!soldDate) return

          const date = new Date(soldDate)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const salePrice = item.attributes?.salePrice || item._computed_value || 0

          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + salePrice
        })

        setStats({
          activeListings,
          revenue30d,
          totalOrders,
          itemsInStock,
          topSellingItems,
          revenueByMonth
        })

        setError(null)
      } catch (err) {
        console.error('Error fetching Shop stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch Shop stats')
      } finally {
        setLoading(false)
      }
    }

    fetchShopStats()
  }, [])

  return { stats, loading, error }
}
