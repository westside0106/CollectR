'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DashboardCharts, { CHART_COLORS } from '@/components/DashboardCharts'
import { useRealtimeRefresh, usePullToRefresh } from '@/hooks'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { DashboardSkeleton } from '@/components/Skeleton'
import {
  DashboardTile,
  TileSkeleton,
  DashboardSettings,
  StatsTile,
  QuickActionsTile,
  RemindersTile,
  RecentItemsTile,
  TopItemsTile,
  CollectionListTile,
  TCGHighlightsTile,
} from '@/components/dashboard'

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

interface RecentItem {
  id: string
  name: string
  collection_id: string
  collection_name: string
  thumbnail: string | null
  purchase_price: number | null
  created_at: string
}

function DashboardContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalItems: 0,
    totalValue: 0,
    recentItems: [] as RecentItem[]
  })
  const [chartData, setChartData] = useState<ChartData>({
    categoryDistribution: [],
    collectionValues: [],
    topItems: [],
    statusDistribution: [],
    collectionFinancials: [],
  })

  // Dashboard config hook
  const {
    visibleTiles,
    hiddenTiles,
    toggleTile,
    updateTileSize,
    resetConfig,
    isLoaded: configLoaded,
  } = useDashboardConfig()

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

  // Pull-to-Refresh
  const { isRefreshing: isPullRefreshing, isPulling, pullDistance, shouldRefresh } = usePullToRefresh({
    onRefresh: async () => {
      if (user) {
        await Promise.all([
          loadDashboardStats(user.id),
          loadChartData(user.id)
        ])
      }
    },
    threshold: 80
  })

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
          value: current.value + ((item as any).estimated_value || item.purchase_price || 0),
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
    let recentItems: RecentItem[] = []

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
        .select('id, name, collection_id, thumbnail, purchase_price, created_at, collections(name)')
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false })
        .limit(5)

      recentItems = (recent || []).map(item => ({
        id: item.id,
        name: item.name,
        collection_id: item.collection_id,
        collection_name: (item.collections as any)?.name || 'Unbekannt',
        thumbnail: item.thumbnail,
        purchase_price: item.purchase_price,
        created_at: item.created_at,
      }))
    }

    setStats({
      totalCollections: collectionsCount || 0,
      totalItems,
      totalValue,
      recentItems
    })
  }

  // Render tile content based on type
  function renderTileContent(tileType: string) {
    switch (tileType) {
      case 'stats':
        return (
          <StatsTile
            totalCollections={stats.totalCollections}
            totalItems={stats.totalItems}
            totalValue={stats.totalValue}
          />
        )
      case 'quick_actions':
        return <QuickActionsTile />
      case 'reminders':
        return <RemindersTile />
      case 'recent_items':
        return <RecentItemsTile items={stats.recentItems} />
      case 'top_items':
        return <TopItemsTile items={chartData.topItems} />
      case 'collection_list':
        return <CollectionListTile />
      case 'tcg_highlights':
        return <TCGHighlightsTile />
      case 'chart_category':
        return chartData.categoryDistribution.length > 0 ? (
          <DashboardCharts
            categoryDistribution={chartData.categoryDistribution}
            collectionValues={[]}
            topItems={[]}
            statusDistribution={[]}
            collectionFinancials={[]}
          />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Keine Kategorien vorhanden
          </div>
        )
      case 'chart_status':
        return chartData.statusDistribution.length > 0 ? (
          <DashboardCharts
            categoryDistribution={[]}
            collectionValues={[]}
            topItems={[]}
            statusDistribution={chartData.statusDistribution}
            collectionFinancials={[]}
          />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Keine Status-Daten vorhanden
          </div>
        )
      case 'chart_financial':
        return chartData.collectionFinancials.length > 0 ? (
          <DashboardCharts
            categoryDistribution={[]}
            collectionValues={[]}
            topItems={[]}
            statusDistribution={[]}
            collectionFinancials={chartData.collectionFinancials}
          />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Keine Finanzdaten vorhanden
          </div>
        )
      default:
        return null
    }
  }

  if (loading || !configLoaded) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors" data-pull-refresh>
      {/* Pull-to-Refresh Indicator */}
      {(isPulling || isPullRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300 pointer-events-none"
          style={{
            transform: `translateY(${isPullRefreshing ? '60px' : Math.min(pullDistance, 80)}px)`,
            opacity: isPullRefreshing ? 1 : pullDistance / 80
          }}
        >
          <div className={`bg-white dark:bg-slate-800 rounded-full p-3 shadow-lg border-2 ${
            shouldRefresh || isPullRefreshing
              ? 'border-blue-500 dark:border-blue-400'
              : 'border-slate-300 dark:border-slate-600'
          }`}>
            <svg
              className={`w-6 h-6 ${
                isPullRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto container-responsive py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              <span className="text-blue-600 dark:text-blue-400">Collectors</span>phere
            </h1>
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
              HUB
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                         rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              title="Dashboard anpassen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-xs sm:text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <span className="hidden sm:inline">Abmelden</span>
              <span className="sm:hidden">Aus</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Tile Grid */}
      <main className="max-w-7xl mx-auto container-responsive py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleTiles.map(tile => (
            <DashboardTile
              key={tile.id}
              tile={tile}
            >
              {renderTileContent(tile.type)}
            </DashboardTile>
          ))}
        </div>

        {visibleTiles.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎨</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Dashboard ist leer
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 px-4">
              Alle Kacheln sind ausgeblendet
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Dashboard anpassen
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <DashboardSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        visibleTiles={visibleTiles}
        hiddenTiles={hiddenTiles}
        onToggleTile={toggleTile}
        onUpdateSize={updateTileSize}
        onReset={resetConfig}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
