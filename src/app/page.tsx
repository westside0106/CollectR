'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { useDebounce } from '@/hooks/useDebounce'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CollectionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // State
  const [collection, setCollection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State (aus URL oder default)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at:desc')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  // Debounced search für Performance
  const debouncedSearch = useDebounce(searchQuery, 300)

  // URL aktualisieren bei Filter-Änderung
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

  // Daten laden
  useEffect(() => {
    async function loadData() {
      setLoading(true)

      // Collection laden
      const { data: collectionData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single()

      if (collectionData) setCollection(collectionData)

      // Kategorien laden
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('collection_id', id)
        .order('sort_order')

      if (categoriesData) setCategories(categoriesData)

      // Items laden (mit Filtern)
      let query = supabase
        .from('items')
        .select('*, item_images(*)')
        .eq('collection_id', id)

      // Filter anwenden
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus)
      }
      if (minPrice) {
        query = query.gte('purchase_price', parseFloat(minPrice))
      }
      if (maxPrice) {
        query = query.lte('purchase_price', parseFloat(maxPrice))
      }

      // Sortierung
      const [sortField, sortDir] = sortBy.split(':')
      query = query.order(sortField, { ascending: sortDir === 'asc', nullsFirst: false })

      const { data: itemsData } = await query

      setItems(itemsData || [])
      setLoading(false)
    }

    loadData()
  }, [id, selectedCategory, selectedStatus, sortBy, minPrice, maxPrice])

  // Client-seitige Suche (für schnellere UX)
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

  // Statistiken
  const stats = useMemo(() => {
    const totalItems = filteredItems.length
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.purchase_price || 0), 0)
    return { totalItems, totalValue }
  }, [filteredItems])

  if (loading && !collection) {
    return <div className="p-8">Laden...</div>
  }

  if (!collection) {
    return <div className="p-8">Sammlung nicht gefunden</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            href="/collections"
            className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
          >
            ← Alle Sammlungen
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-slate-500 mt-1">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/collections/${id}/scan`}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <span>📷</span>
            <span>Scannen</span>
          </Link>
          <Link
            href={`/collections/${id}/categories`}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Kategorien
          </Link>
          <Link
            href={`/collections/${id}/items/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>Neues Item</span>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-6 mb-6 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <span className="text-2xl font-bold">{stats.totalItems}</span>
          <span className="text-slate-500 ml-2">Items</span>
          {debouncedSearch && items.length !== filteredItems.length && (
            <span className="text-slate-400 ml-1">(von {items.length})</span>
          )}
        </div>
        <div className="border-l border-slate-200 pl-6">
          <span className="text-2xl font-bold">{stats.totalValue.toFixed(2)}</span>
          <span className="text-slate-500 ml-2">EUR Gesamtwert</span>
        </div>
        <div className="border-l border-slate-200 pl-6">
          <span className="text-2xl font-bold">{categories.length}</span>
          <span className="text-slate-500 ml-2">Kategorien</span>
        </div>
      </div>

      {/* Suchleiste */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Items durchsuchen (Name, Beschreibung, Barcode)..."
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
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
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Laden...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          collectionId={id}
          hasFilters={!!(debouncedSearch || selectedCategory || selectedStatus || minPrice || maxPrice)}
          onClearFilters={() => {
            setSearchQuery('')
            setSelectedCategory('')
            setSelectedStatus('')
            setMinPrice('')
            setMaxPrice('')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} collectionId={id} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, collectionId }: { item: any; collectionId: string }) {
  const primaryImage = item.item_images?.find((img: any) => img.is_primary)
    ?? item.item_images?.[0]

  return (
    <Link
      href={`/collections/${collectionId}/items/${item.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-100 relative">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnail_url ?? primaryImage.original_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
            📷
          </div>
        )}
        {item.status !== 'in_collection' && (
          <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
            item.status === 'sold' ? 'bg-green-100 text-green-700' :
            item.status === 'wishlist' ? 'bg-purple-100 text-purple-700' :
            item.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {item.status === 'sold' ? 'Verkauft' :
             item.status === 'wishlist' ? 'Wunschliste' :
             item.status === 'ordered' ? 'Bestellt' : item.status}
          </span>
        )}
        {item.barcode && (
          <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded font-mono">
            {item.barcode}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium group-hover:text-blue-600 transition-colors line-clamp-1">
          {item.name}
        </h3>
        {item.purchase_price && (
          <p className="text-slate-500 text-sm mt-1">
            {item.purchase_price.toFixed(2)} {item.purchase_currency}
          </p>
        )}
      </div>
    </Link>
  )
}

function EmptyState({
  collectionId,
  hasFilters,
  onClearFilters
}: {
  collectionId: string
  hasFilters: boolean
  onClearFilters: () => void
}) {
  if (hasFilters) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <span className="text-6xl">🔍</span>
        <h3 className="text-xl font-semibold mt-4">Keine Items gefunden</h3>
        <p className="text-slate-500 mt-2">Versuche andere Suchbegriffe oder Filter</p>
        <button
          onClick={onClearFilters}
          className="inline-block mt-6 bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Filter zurücksetzen
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <span className="text-6xl">🏷️</span>
      <h3 className="text-xl font-semibold mt-4">Noch keine Items</h3>
      <p className="text-slate-500 mt-2">Füge dein erstes Item zu dieser Sammlung hinzu!</p>
      <div className="flex gap-4 justify-center mt-6">
        <Link
          href={`/collections/${collectionId}/scan`}
          className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
        >
          📷 Barcode scannen
        </Link>
        <Link
          href={`/collections/${collectionId}/items/new`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Manuell hinzufügen
        </Link>
      </div>
    </div>
  )
}
