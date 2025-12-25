'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { useDebounce } from '@/hooks/useDebounce'
import { CollectionGoals } from '@/components/CollectionGoals'

type ViewMode = 'grid' | 'list'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CollectionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [collection, setCollection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('collectionViewMode') as ViewMode) || 'grid'
    }
    return 'grid'
  })

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at:desc')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('collectionViewMode', viewMode)
  }, [viewMode])

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedStatus) params.set('status', selectedStatus)
    if (sortBy !== 'created_at:desc') params.set('sort', sortBy)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)

    const queryString = params.toString()
    router.replace(`/collections/${id}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [debouncedSearch, selectedCategory, selectedStatus, sortBy, minPrice, maxPrice, id, router])

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: collectionData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single()

      if (collectionData) setCollection(collectionData)

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('collection_id', id)
        .order('sort_order')

      if (categoriesData) setCategories(categoriesData)

      let query = supabase
        .from('items')
        .select('*, item_images(*)')
        .eq('collection_id', id)

      if (selectedCategory) query = query.eq('category_id', selectedCategory)
      if (selectedStatus) query = query.eq('status', selectedStatus)
      if (minPrice) query = query.gte('purchase_price', parseFloat(minPrice))
      if (maxPrice) query = query.lte('purchase_price', parseFloat(maxPrice))

      const [sortField, sortDir] = sortBy.split(':')
      query = query.order(sortField, { ascending: sortDir === 'asc', nullsFirst: false })

      const { data: itemsData } = await query

      setItems(itemsData || [])
      setLoading(false)
    }

    loadData()
  }, [id, selectedCategory, selectedStatus, sortBy, minPrice, maxPrice])

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items

    const query = debouncedSearch.toLowerCase()
    return items.filter(item =>
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    )
  }, [items, debouncedSearch])

  const stats = useMemo(() => {
    const totalItems = filteredItems.length
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.purchase_price || 0), 0)
    return { totalItems, totalValue }
  }, [filteredItems])

  // Calculate category counts for goals
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach(item => {
      if (item.category_id) {
        counts.set(item.category_id, (counts.get(item.category_id) || 0) + 1)
      }
    })
    return counts
  }, [items])

  if (loading && !collection) {
    return <div className="p-8 dark:text-white">Laden...</div>
  }

  if (!collection) {
    return <div className="p-8 dark:text-white">Sammlung nicht gefunden</div>
  }

  return (
    <div className="p-8 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            href="/collections"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
          >
            ← Alle Sammlungen
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{collection.name}</h1>
          {collection.description && (
            <p className="text-slate-500 dark:text-slate-400 mt-1">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              ⋯
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <Link
                    href={`/collections/${id}/import`}
                    className="block px-4 py-2 hover:bg-slate-50 text-sm"
                    onClick={() => setShowMenu(false)}
                  >
                    📥 Import (CSV/JSON)
                  </Link>
                  <Link
                    href={`/collections/${id}/export`}
                    className="block px-4 py-2 hover:bg-slate-50 text-sm"
                    onClick={() => setShowMenu(false)}
                  >
                    📤 Export
                  </Link>
                  <hr className="my-1" />
                  <Link
                    href={`/collections/${id}/categories`}
                    className="block px-4 py-2 hover:bg-slate-50 text-sm"
                    onClick={() => setShowMenu(false)}
                  >
                    🏷️ Kategorien verwalten
                  </Link>
                </div>
              </>
            )}
          </div>
          
          <Link
            href={`/collections/${id}/scan`}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            📷 Scannen
          </Link>
          <Link
            href={`/collections/${id}/items/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            + Neues Item
          </Link>
        </div>
      </div>

      {/* Stats Bar & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 flex gap-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-2xl font-bold dark:text-white">{stats.totalItems}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">Items</span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-6">
            <span className="text-2xl font-bold dark:text-white">{stats.totalValue.toFixed(2)}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">EUR</span>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-6">
            <span className="text-2xl font-bold dark:text-white">{categories.length}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">Kategorien</span>
          </div>
        </div>

        {/* Collection Goals */}
        <CollectionGoals
          collectionId={id}
          itemCount={items.length}
          totalValue={items.reduce((sum, item) => sum + (item.purchase_price || 0), 0)}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Items durchsuchen..."
        />
      </div>

      {/* Filters & View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => {
            setMinPrice(min)
            setMaxPrice(max)
          }}
        />

        {/* View Toggle */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Kachelansicht"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Listenansicht"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Items Grid/List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Laden...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState collectionId={id} hasFilters={!!(debouncedSearch || selectedCategory || selectedStatus)} onClearFilters={() => {
          setSearchQuery('')
          setSelectedCategory('')
          setSelectedStatus('')
          setMinPrice('')
          setMaxPrice('')
        }} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} collectionId={id} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Item</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Preis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredItems.map((item) => (
                <ItemRow key={item.id} item={item} collectionId={id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, collectionId }: { item: any; collectionId: string }) {
  const primaryImage = item.item_images?.find((img: any) => img.is_primary) ?? item.item_images?.[0]

  return (
    <Link
      href={`/collections/${collectionId}/items/${item.id}`}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
    >
      <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative">
        {primaryImage ? (
          <img src={primaryImage.thumbnail_url ?? primaryImage.original_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300 dark:text-slate-500">📷</div>
        )}
        {item.status !== 'in_collection' && (
          <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
            item.status === 'sold' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
            item.status === 'wishlist' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' :
            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {item.status === 'sold' ? 'Verkauft' : item.status === 'wishlist' ? 'Wunschliste' : item.status}
          </span>
        )}
        {item.barcode && (
          <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded font-mono">
            {item.barcode}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{item.name}</h3>
        {item.purchase_price && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{item.purchase_price.toFixed(2)} {item.purchase_currency}</p>
        )}
      </div>
    </Link>
  )
}

function ItemRow({ item, collectionId }: { item: any; collectionId: string }) {
  const primaryImage = item.item_images?.find((img: any) => img.is_primary) ?? item.item_images?.[0]

  const statusLabels: Record<string, string> = {
    'in_collection': 'In Sammlung',
    'sold': 'Verkauft',
    'wishlist': 'Wunschliste',
    'ordered': 'Bestellt',
    'lost': 'Verloren',
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/collections/${collectionId}/items/${item.id}`} className="flex items-center gap-3">
          {primaryImage ? (
            <img
              src={primaryImage.thumbnail_url ?? primaryImage.original_url}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
              📷
            </div>
          )}
          <div>
            <div className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
              {item.name}
            </div>
            {item.barcode && (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.barcode}</div>
            )}
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          item.status === 'in_collection' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
          item.status === 'sold' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
          item.status === 'wishlist' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' :
          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
        }`}>
          {statusLabels[item.status] || item.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {item.purchase_price ? (
          <span className="font-medium text-green-600 dark:text-green-400">
            {item.purchase_price.toFixed(2)} {item.purchase_currency || 'EUR'}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">-</span>
        )}
      </td>
    </tr>
  )
}

function EmptyState({ collectionId, hasFilters, onClearFilters }: { collectionId: string; hasFilters: boolean; onClearFilters: () => void }) {
  if (hasFilters) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <span className="text-6xl">🔍</span>
        <h3 className="text-xl font-semibold mt-4">Keine Items gefunden</h3>
        <button onClick={onClearFilters} className="mt-6 bg-slate-600 text-white px-6 py-3 rounded-lg">Filter zurücksetzen</button>
      </div>
    )
  }

  return (
    <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <span className="text-6xl">🏷️</span>
      <h3 className="text-xl font-semibold mt-4">Noch keine Items</h3>
      <div className="flex gap-4 justify-center mt-6">
        <Link href={`/collections/${collectionId}/import`} className="bg-slate-600 text-white px-6 py-3 rounded-lg">📥 Importieren</Link>
        <Link href={`/collections/${collectionId}/items/new`} className="bg-blue-600 text-white px-6 py-3 rounded-lg">+ Manuell</Link>
      </div>
    </div>
  )
}
