'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DashboardCharts, { CHART_COLORS } from '@/components/DashboardCharts'
import { useRealtimeRefresh } from '@/hooks'

interface ChartData {
  categoryDistribution: { label: string; value: number; color: string }[]
  collectionValues: { label: string; value: number; color: string }[]
  topItems: {
    id: string
    name: string
    collection_id: string
    collection_name: string
    purchase_price: number
    image_url?: string
  }[]
  statusDistribution: { label: string; value: number; color: string }[]
  collectionFinancials: {
    name: string
    spent: number
    value: number
    profit: number
    itemCount: number
  }[]
}

function DashboardContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalItems: 0,
    totalValue: 0,
    recentItems: [] as any[]
  })
  const [chartData, setChartData] = useState<ChartData>({
    categoryDistribution: [],
    collectionValues: [],
    topItems: [],
    statusDistribution: [],
    collectionFinancials: [],
  })

  const refreshData = useCallback(async () => {
    if (!user) return
    await Promise.all([
      loadDashboardStats(user.id),
      loadChartData(user.id)
    ])
  }, [user])

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  // Realtime: Live-Updates für Dashboard-Stats
  useRealtimeRefresh('items', refreshData)
  useRealtimeRefresh('collections', refreshData)

  async function checkUserAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    await Promise.all([
      loadDashboardStats(user.id),
      loadChartData(user.id)
    ])
    setLoading(false)
  }

  async function loadChartData(userId: string) {
    try {
      // Get user's collections
      const { data: collections } = await supabase
        .from('collections')
        .select('id, name')
        .eq('owner_id', userId)

      if (!collections || collections.length === 0) return

      const collectionIds = collections.map(c => c.id)
      const collectionMap = new Map(collections.map(c => [c.id, c.name]))

      // Get all items with categories for charts
      const { data: items } = await supabase
        .from('items')
        .select(`
          id,
          name,
          collection_id,
          category_id,
          purchase_price,
          estimated_value,
          status,
          categories(name)
        `)
        .in('collection_id', collectionIds)

      if (!items || items.length === 0) return

      // Category distribution
      const categoryCount = new Map<string, number>()
      items.forEach(item => {
        const catName = (item.categories as any)?.name || 'Ohne Kategorie'
        categoryCount.set(catName, (categoryCount.get(catName) || 0) + 1)
      })

      const categoryDistribution = Array.from(categoryCount.entries())
        .map(([label, value], index) => ({
          label,
          value,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      // Status distribution
      const STATUS_LABELS: Record<string, string> = {
        'in_collection': 'In Sammlung',
        'sold': 'Verkauft',
        'lent': 'Verliehen',
        'wishlist': 'Wunschliste',
      }
      const STATUS_COLORS: Record<string, string> = {
        'in_collection': '#10B981',
        'sold': '#EF4444',
        'lent': '#F59E0B',
        'wishlist': '#8B5CF6',
      }
      const statusCount = new Map<string, number>()
      items.forEach(item => {
        const status = item.status || 'in_collection'
        statusCount.set(status, (statusCount.get(status) || 0) + 1)
      })

      const statusDistribution = Array.from(statusCount.entries())
        .map(([status, value]) => ({
          label: STATUS_LABELS[status] || status,
          value,
          color: STATUS_COLORS[status] || '#6B7280'
        }))

      // Value by collection
      const collectionValueMap = new Map<string, number>()
      items.forEach(item => {
        if (item.purchase_price) {
          const current = collectionValueMap.get(item.collection_id) || 0
          collectionValueMap.set(item.collection_id, current + item.purchase_price)
        }
      })

      const collectionValues = Array.from(collectionValueMap.entries())
        .map(([collId, value], index) => ({
          label: collectionMap.get(collId) || 'Unbekannt',
          value,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      // Collection Financials (Ausgaben / Wert / Gewinn pro Sammlung)
      const financialsMap = new Map<string, { spent: number; value: number; itemCount: number }>()
      items.forEach(item => {
        const current = financialsMap.get(item.collection_id) || { spent: 0, value: 0, itemCount: 0 }
        financialsMap.set(item.collection_id, {
          spent: current.spent + (item.purchase_price || 0),
          value: current.value + (item.estimated_value || item.purchase_price || 0),
          itemCount: current.itemCount + 1,
        })
      })

      const collectionFinancials = Array.from(financialsMap.entries())
        .map(([collId, data]) => ({
          name: collectionMap.get(collId) || 'Unbekannt',
          spent: data.spent,
          value: data.value,
          profit: data.value - data.spent,
          itemCount: data.itemCount,
        }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 6)

      // Top 5 valuable items
      const { data: topItemsData } = await supabase
        .from('items')
        .select(`
          id,
          name,
          collection_id,
          purchase_price,
          collections(name)
        `)
        .in('collection_id', collectionIds)
        .not('purchase_price', 'is', null)
        .order('purchase_price', { ascending: false })
        .limit(5)

      // Get images for top items
      let topItems: ChartData['topItems'] = []
      if (topItemsData && topItemsData.length > 0) {
        const itemIds = topItemsData.map(i => i.id)
        const { data: images } = await supabase
          .from('item_images')
          .select('item_id, url')
          .in('item_id', itemIds)
          .order('sort_order')

        const imageMap = new Map<string, string>()
        images?.forEach(img => {
          if (!imageMap.has(img.item_id)) {
            imageMap.set(img.item_id, img.url)
          }
        })

        topItems = topItemsData.map(item => ({
          id: item.id,
          name: item.name,
          collection_id: item.collection_id,
          collection_name: (item.collections as any)?.name || 'Unbekannt',
          purchase_price: item.purchase_price,
          image_url: imageMap.get(item.id)
        }))
      }

      setChartData({
        categoryDistribution,
        collectionValues,
        topItems,
        statusDistribution,
        collectionFinancials,
      })
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  async function loadDashboardStats(userId: string) {
    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    const { data: collections } = await supabase
      .from('collections')
      .select('id')
      .eq('owner_id', userId)

    let totalItems = 0
    let totalValue = 0
    let recentItems: any[] = []

    if (collections && collections.length > 0) {
      const collectionIds = collections.map(c => c.id)
      
      const { count: itemsCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .in('collection_id', collectionIds)
      
      totalItems = itemsCount || 0

      const { data: itemsWithValue } = await supabase
        .from('items')
        .select('purchase_price')
        .in('collection_id', collectionIds)
        .not('purchase_price', 'is', null)

      if (itemsWithValue) {
        totalValue = itemsWithValue.reduce((sum, item) => sum + (item.purchase_price || 0), 0)
      }

      const { data: recent } = await supabase
        .from('items')
        .select('*, collections(name)')
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false })
        .limit(5)

      recentItems = recent || []
    }

    setStats({
      totalCollections: collectionsCount || 0,
      totalItems,
      totalValue,
      recentItems
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📦 CollectR</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCollections}</div>
            <div className="text-gray-600 dark:text-gray-400">Sammlungen</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalItems}</div>
            <div className="text-gray-600 dark:text-gray-400">Artikel</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Gesamtwert</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/collections"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            📁 Sammlungen verwalten
          </Link>
          <Link
            href="/collections/new"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            ➕ Neue Sammlung
          </Link>
        </div>

        {/* Charts Section */}
        <DashboardCharts
          categoryDistribution={chartData.categoryDistribution}
          collectionValues={chartData.collectionValues}
          topItems={chartData.topItems}
          statusDistribution={chartData.statusDistribution}
          collectionFinancials={chartData.collectionFinancials}
        />

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Kürzlich hinzugefügt</h2>
          {stats.recentItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Noch keine Artikel vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/collections/${item.collection_id}/items/${item.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center">
                      📷
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {(item.collections as any)?.name}
                    </div>
                  </div>
                  {item.purchase_price && (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      {item.purchase_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Buttons Skeleton */}
        <div className="flex gap-4 mb-8">
          <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-12 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
              <div className="flex items-end justify-center gap-3 h-48">
                <div className="w-12 h-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="w-12 h-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="w-12 h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="w-12 h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Items Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
