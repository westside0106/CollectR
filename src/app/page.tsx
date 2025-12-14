'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Dashboard content component that uses useSearchParams
function DashboardContent() {
  const searchParams = useSearchParams()
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

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  async function checkUserAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    await loadDashboardStats(user.id)
    setLoading(false)
  }

  async function loadDashboardStats(userId: string) {
    // Count collections
    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    // Count items and sum values
    const { data: collections } = await supabase
      .from('collections')
      .select('id')
      .eq('owner_id', userId)

    let totalItems = 0
    let totalValue = 0
    let recentItems: any[] = []

    if (collections && collections.length > 0) {
      const collectionIds = collections.map(c => c.id)
      
      // Count items
      const { count: itemsCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .in('collection_id', collectionIds)
      
      totalItems = itemsCount || 0

      // Sum values
      const { data: itemsWithValue } = await supabase
        .from('items')
        .select('purchase_price')
        .in('collection_id', collectionIds)
        .not('purchase_price', 'is', null)

      if (itemsWithValue) {
        totalValue = itemsWithValue.reduce((sum, item) => sum + (item.purchase_price || 0), 0)
      }

      // Recent items
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">📦 CollectR</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.totalCollections}</div>
            <div className="text-gray-600">Sammlungen</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{stats.totalItems}</div>
            <div className="text-gray-600">Artikel</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">
              {stats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-gray-600">Gesamtwert</div>
          </div>
        </div>

        {/* Quick Actions */}
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

        {/* Recent Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Kürzlich hinzugefügt</h2>
          {stats.recentItems.length === 0 ? (
            <p className="text-gray-500">Noch keine Artikel vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/collections/${item.collection_id}/items/${item.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      📷
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {(item.collections as any)?.name}
                    </div>
                  </div>
                  {item.purchase_price && (
                    <div className="text-green-600 font-medium">
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

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Laden...</p>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
