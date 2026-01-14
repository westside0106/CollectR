'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type OfficialCategory = 'certificates' | 'autographs' | 'documents' | 'tickets' | 'memorabilia' | 'all'

export interface OfficialStats {
  totalDocuments: number
  certificates: number
  totalValue: number
  expiringSoon: number
  topDocuments: Array<{
    id: string
    name: string
    value: number
    category: string
    expiryDate?: string
  }>
  valueByCategory: Record<string, number>
  recentDocuments: Array<{
    id: string
    name: string
    addedAt: string
    category: string
  }>
}

export function useOfficialStats(category: OfficialCategory = 'all') {
  const [stats, setStats] = useState<OfficialStats>({
    totalDocuments: 0,
    certificates: 0,
    totalValue: 0,
    expiringSoon: 0,
    topDocuments: [],
    valueByCategory: {},
    recentDocuments: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOfficialStats() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        // Build query for Official documents
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

        // Filter items by official category
        let officialItems = allItems || []
        if (category !== 'all') {
          officialItems = officialItems.filter((item: any) => {
            const officialType = item.attributes?.officialType || item.attributes?.documentType
            return officialType === category
          })
        } else {
          // For 'all', only include items that have an officialType or documentType
          officialItems = officialItems.filter((item: any) => {
            const officialType = item.attributes?.officialType || item.attributes?.documentType
            return officialType === 'certificates' ||
                   officialType === 'autographs' ||
                   officialType === 'documents' ||
                   officialType === 'tickets' ||
                   officialType === 'memorabilia'
          })
        }

        // Calculate total documents
        const totalDocuments = officialItems.length

        // Count certificates specifically
        const certificates = officialItems.filter((item: any) => {
          const officialType = item.attributes?.officialType || item.attributes?.documentType
          return officialType === 'certificates'
        }).length

        // Calculate total value
        const totalValue = officialItems.reduce((sum: number, item: any) => {
          const value = item._computed_value || 0
          return sum + value
        }, 0)

        // Count documents expiring soon (within 90 days)
        const ninetyDaysFromNow = new Date()
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

        const expiringSoon = officialItems.filter((item: any) => {
          const expiryDate = item.attributes?.expiryDate || item.attributes?.validUntil
          if (!expiryDate) return false

          const expiry = new Date(expiryDate)
          const now = new Date()
          return expiry >= now && expiry <= ninetyDaysFromNow
        }).length

        // Get top documents by value (top 10)
        const topDocuments = officialItems
          .filter((item: any) => item._computed_value && item._computed_value > 0)
          .sort((a: any, b: any) => (b._computed_value || 0) - (a._computed_value || 0))
          .slice(0, 10)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            value: item._computed_value || 0,
            category: item.attributes?.officialType || item.attributes?.documentType || 'unknown',
            expiryDate: item.attributes?.expiryDate || item.attributes?.validUntil
          }))

        // Calculate value by category
        const valueByCategory: Record<string, number> = {}
        officialItems.forEach((item: any) => {
          const officialType = item.attributes?.officialType || item.attributes?.documentType || 'unknown'
          const value = item._computed_value || 0
          valueByCategory[officialType] = (valueByCategory[officialType] || 0) + value
        })

        // Get recent documents (last 5)
        const recentDocuments = officialItems
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            addedAt: item.created_at,
            category: item.attributes?.officialType || item.attributes?.documentType || 'unknown'
          }))

        setStats({
          totalDocuments,
          certificates,
          totalValue,
          expiringSoon,
          topDocuments,
          valueByCategory,
          recentDocuments
        })

        setError(null)
      } catch (err) {
        console.error('Error fetching Official stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch Official stats')
      } finally {
        setLoading(false)
      }
    }

    fetchOfficialStats()
  }, [category])

  return { stats, loading, error }
}
