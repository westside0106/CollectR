'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { useDebounce, useRealtimeRefresh, usePullToRefresh } from '@/hooks'
import { CollectionGoals } from '@/components/CollectionGoals'
import { ShareModal } from '@/components/ShareModal'
import { AIBatchUpload } from '@/components/AIBatchUpload'
import { useToast } from '@/components/Toast'
import { ItemCardSkeleton } from '@/components/Skeleton'
import { TCGBulkPriceUpdate } from '@/components/TCGBulkPriceUpdate'

type ViewMode = 'grid' | 'list'
type TabMode = 'items' | 'goals'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CollectionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { showToast } = useToast()

  const [collection, setCollection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAIBatchUpload, setShowAIBatchUpload] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [activeTab, setActiveTab] = useState<TabMode>('items')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('collectionViewMode') as ViewMode) || 'grid'
    }
    return 'grid'
  })

  // Bulk Operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at:desc')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get('tags')
    return tagsParam ? tagsParam.split(',') : []
  })
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [availableAttributes, setAvailableAttributes] = useState<{
    id: string
    name: string
    display_name: string
    type: string
    options: any
    category_id: string
  }[]>([])
  const [attributeFilters, setAttributeFilters] = useState<Record<string, any>>(() => {
    const filtersParam = searchParams.get('attrFilters')
    if (!filtersParam) return {}
    try {
      return JSON.parse(decodeURIComponent(filtersParam))
    } catch {
      return {}
    }
  })

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('collectionViewMode', viewMode)
  }, [viewMode])

  // Check if TCG price updates are enabled for this collection
  const tcgPriceUpdatesEnabled = useMemo(() => {
    return collection?.settings?.tcgPriceUpdates === true
  }, [collection])

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedStatus) params.set('status', selectedStatus)
    if (sortBy !== 'created_at:desc') params.set('sort', sortBy)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    if (Object.keys(attributeFilters).length > 0) {
      params.set('attrFilters', encodeURIComponent(JSON.stringify(attributeFilters)))
    }

    const queryString = params.toString()
    router.replace(`/collections/${id}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [debouncedSearch, selectedCategory, selectedStatus, sortBy, minPrice, maxPrice, selectedTags, attributeFilters, id, router])

  const loadData = useCallback(async () => {
    setLoading(true)

    // User holen um Owner-Status zu prüfen
    const { data: { user } } = await supabase.auth.getUser()

    const { data: collectionData } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single()

    if (collectionData) {
      setCollection(collectionData)
      setIsOwner(user?.id === collectionData.owner_id)
    }

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('collection_id', id)
      .order('sort_order')

    if (categoriesData) setCategories(categoriesData)

    // Load all tags used in this collection
    const { data: tagsData } = await supabase
      .from('item_tags')
      .select('tag_id, tags(id, name, color), items!inner(collection_id)')
      .eq('items.collection_id', id)

    if (tagsData) {
      // Extract unique tags
      const uniqueTags = new Map<string, { id: string; name: string; color: string }>()
      tagsData.forEach((it: any) => {
        if (it.tags && !uniqueTags.has(it.tags.id)) {
          uniqueTags.set(it.tags.id, it.tags)
        }
      })
      setAvailableTags(Array.from(uniqueTags.values()).sort((a, b) => a.name.localeCompare(b.name)))
    }

    // Load all attribute definitions for this collection's categories
    if (categoriesData && categoriesData.length > 0) {
      const categoryIds = categoriesData.map(c => c.id)
      const { data: attributesData } = await supabase
        .from('attribute_definitions')
        .select('id, name, display_name, type, options, category_id')
        .in('category_id', categoryIds)
        .order('sort_order')

      if (attributesData) {
        setAvailableAttributes(attributesData)
      }
    }

    let query = supabase
      .from('items')
      .select('*, item_images(*), item_tags(tag_id, tags(id, name, color))')
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
  }, [id, selectedCategory, selectedStatus, sortBy, minPrice, maxPrice, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime: Live-Updates wenn Items hinzugefügt/geändert/gelöscht werden
  useRealtimeRefresh('items', loadData, `collection_id=eq.${id}`)

  // Pull-to-Refresh
  const { isRefreshing: isPullRefreshing, isPulling, pullDistance, shouldRefresh } = usePullToRefresh({
    onRefresh: async () => {
      await loadData()
    },
    threshold: 80
  })

  const filteredItems = useMemo(() => {
    let result = items

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query)
      )
    }

    // Filter by selected tags (item must have ALL selected tags)
    if (selectedTags.length > 0) {
      result = result.filter(item => {
        const itemTagIds = item.item_tags?.map((it: any) => it.tag_id) || []
        return selectedTags.every(tagId => itemTagIds.includes(tagId))
      })
    }

    // Filter by custom attributes
    if (Object.keys(attributeFilters).length > 0) {
      result = result.filter(item => {
        const itemAttrs = item.attributes || {}

        return Object.entries(attributeFilters).every(([attrName, filterValue]) => {
          if (filterValue === undefined || filterValue === null || filterValue === '') return true

          const attr = availableAttributes.find(a => a.name === attrName)
          if (!attr) return true

          const itemValue = itemAttrs[attrName]

          switch (attr.type) {
            case 'text':
              // Text: contains search
              return itemValue && String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())

            case 'number':
              // Number: supports min/max
              if (typeof filterValue === 'object') {
                const { min, max } = filterValue
                const numValue = Number(itemValue)
                if (min !== undefined && min !== '' && numValue < Number(min)) return false
                if (max !== undefined && max !== '' && numValue > Number(max)) return false
                return true
              }
              return Number(itemValue) === Number(filterValue)

            case 'select':
              // Select: exact match or array of allowed values
              if (Array.isArray(filterValue)) {
                return filterValue.length === 0 || filterValue.includes(itemValue)
              }
              return itemValue === filterValue

            case 'checkbox':
              // Checkbox: boolean match
              return Boolean(itemValue) === Boolean(filterValue)

            case 'date':
              // Date: supports from/to range
              if (typeof filterValue === 'object') {
                const { from, to } = filterValue
                if (from && itemValue < from) return false
                if (to && itemValue > to) return false
                return true
              }
              return itemValue === filterValue

            case 'tags':
              // Tags: check if any filter tag is in item tags
              if (Array.isArray(filterValue) && filterValue.length > 0) {
                const itemTags = Array.isArray(itemValue) ? itemValue : []
                return filterValue.some(tag => itemTags.includes(tag))
              }
              return true

            default:
              return true
          }
        })
      })
    }

    return result
  }, [items, debouncedSearch, selectedTags, attributeFilters, availableAttributes])

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

  // Bulk Operations Handlers
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`${selectedItems.size} Item(s) wirklich löschen?`)) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .in('id', Array.from(selectedItems))

      if (error) throw error

      showToast(`${selectedItems.size} Item(s) gelöscht!`)
      setSelectedItems(new Set())
      setBulkEditMode(false)
      loadData()
    } catch (error) {
      console.error('Bulk delete error:', error)
      showToast('Fehler beim Löschen', 'error')
    }
  }

  const handleBulkEdit = async (updates: { category_id?: string; status?: string }) => {
    if (selectedItems.size === 0) return

    try {
      const { error } = await supabase
        .from('items')
        .update(updates)
        .in('id', Array.from(selectedItems))

      if (error) throw error

      showToast(`${selectedItems.size} Item(s) aktualisiert!`)
      setSelectedItems(new Set())
      setBulkEditMode(false)
      setShowBulkEditModal(false)
      loadData()
    } catch (error) {
      console.error('Bulk edit error:', error)
      showToast('Fehler beim Aktualisieren', 'error')
    }
  }

  if (loading && !collection) {
    return (
      <div className="p-8 dark:bg-slate-900 min-h-screen">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Search/Filter Skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="h-12 flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-12 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>

        {/* Items Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return <div className="p-8 dark:text-white">Sammlung nicht gefunden</div>
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 dark:bg-slate-900 min-h-screen" data-pull-refresh>
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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
        <div className="w-full sm:w-auto">
          <Link
            href="/collections"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
          >
            ← Alle Sammlungen
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">{collection.description}</p>
          )}
        </div>
        <div className="flex overflow-x-auto gap-2 sm:gap-3 w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 text-sm"
            title="Sammlung teilen"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Teilen</span>
          </button>

          {/* More Menu */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Menu button clicked, current state:', showMenu)
                setShowMenu(!showMenu)
              }}
              className="px-3 sm:px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200 text-sm touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Mehr Optionen"
            >
              ⋯
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1 overflow-hidden">
                  <Link
                    href={`/collections/${id}/import`}
                    className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    📥 Import (CSV/JSON)
                  </Link>
                  <Link
                    href={`/collections/${id}/export`}
                    className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    📤 Export
                  </Link>
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <Link
                    href={`/collections/${id}/categories`}
                    className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-sm text-slate-700 dark:text-slate-200 transition-colors touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    🏷️ Kategorien verwalten
                  </Link>
                </div>
              </>
            )}
          </div>

          <Link
            href={`/collections/${id}/scan`}
            className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap"
          >
            📷 Scannen
          </Link>
          <button
            onClick={() => setShowAIBatchUpload(true)}
            className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm whitespace-nowrap"
          >
            ✨ KI Batch-Upload
          </button>
          {tcgPriceUpdatesEnabled && (
            <TCGBulkPriceUpdate
              collectionId={id}
              onComplete={() => loadData()}
            />
          )}
          <Link
            href={`/collections/${id}/items/new`}
            className="flex-shrink-0 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            + Neues Item
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 sm:mb-6">
        <div>
          <span className="text-xl sm:text-2xl font-bold dark:text-white">{stats.totalItems}</span>
          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">Items</span>
        </div>
        <div className="sm:border-l border-slate-200 dark:border-slate-700 sm:pl-6">
          <span className="text-xl sm:text-2xl font-bold dark:text-white">{stats.totalValue.toFixed(2)}</span>
          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">EUR</span>
        </div>
        <div className="sm:border-l border-slate-200 dark:border-slate-700 sm:pl-6">
          <span className="text-xl sm:text-2xl font-bold dark:text-white">{categories.length}</span>
          <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 ml-2">Kategorien</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4 sm:mb-6 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'items'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Items
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'goals'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ziele
        </button>
      </div>

      {/* Goals Tab Content */}
      {activeTab === 'goals' && (
        <CollectionGoals
          collectionId={id}
          itemCount={items.length}
          totalValue={items.reduce((sum, item) => sum + (item.purchase_price || 0), 0)}
          categoryCounts={categoryCounts}
        />
      )}

      {/* Items Tab Content */}
      {activeTab === 'items' && (
        <>
          {/* Search */}
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Items durchsuchen..."
            />
          </div>

          {/* Bulk Actions Bar */}
          {bulkEditMode && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Alle auswählen ({filteredItems.length})
                </span>
              </label>
              <div className="flex-1" />
              {selectedItems.size > 0 && (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedItems.size} ausgewählt
                  </span>
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Löschen
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setBulkEditMode(false)
                  setSelectedItems(new Set())
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition text-sm font-medium"
              >
                Abbrechen
              </button>
            </div>
          )}

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
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              availableAttributes={availableAttributes}
              attributeFilters={attributeFilters}
              onAttributeFiltersChange={setAttributeFilters}
            />

            {/* View Toggle & Bulk Edit Button */}
            <div className="flex gap-2">
              {!bulkEditMode && filteredItems.length > 0 && (
                <button
                  onClick={() => setBulkEditMode(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
                  title="Mehrere Items auswählen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="hidden sm:inline">Auswählen</span>
                </button>
              )}
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
          </div>

          {/* Items Grid/List */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Laden...</div>
          ) : filteredItems.length === 0 ? (
            <EmptyState collectionId={id} hasFilters={!!(debouncedSearch || selectedCategory || selectedStatus || selectedTags.length > 0 || Object.keys(attributeFilters).length > 0)} onClearFilters={() => {
              setSearchQuery('')
              setSelectedCategory('')
              setSelectedStatus('')
              setMinPrice('')
              setMaxPrice('')
              setSelectedTags([])
              setAttributeFilters({})
            }} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  collectionId={id}
                  bulkEditMode={bulkEditMode}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelect={() => toggleItemSelection(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    {bulkEditMode && <th className="w-12"></th>}
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Item</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Preis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      collectionId={id}
                      bulkEditMode={bulkEditMode}
                      isSelected={selectedItems.has(item.id)}
                      onToggleSelect={() => toggleItemSelection(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          collectionId={id}
          collectionName={collection.name}
          isOwner={isOwner}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* AI Batch Upload Modal */}
      {showAIBatchUpload && (
        <AIBatchUpload
          collectionId={id}
          collectionType={getCollectionType(collection?.name)}
          categories={categories}
          onItemsCreated={(count) => {
            showToast(`${count} Item${count !== 1 ? 's' : ''} erfolgreich erstellt!`)
            loadData()
          }}
          onClose={() => setShowAIBatchUpload(false)}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <BulkEditModal
          selectedCount={selectedItems.size}
          categories={categories}
          onClose={() => setShowBulkEditModal(false)}
          onSave={handleBulkEdit}
        />
      )}
    </div>
  )
}

// Bulk Edit Modal Component
function BulkEditModal({
  selectedCount,
  categories,
  onClose,
  onSave
}: {
  selectedCount: number
  categories: any[]
  onClose: () => void
  onSave: (updates: { category_id?: string; status?: string }) => void
}) {
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updates: { category_id?: string; status?: string } = {}
    if (category) updates.category_id = category
    if (status) updates.status = status

    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    onSave(updates)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {selectedCount} Item(s) bearbeiten
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Kategorie ändern (optional)
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">-- Nicht ändern --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Status ändern (optional)
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">-- Nicht ändern --</option>
              <option value="in_collection">In Sammlung</option>
              <option value="wishlist">Wunschliste</option>
              <option value="sold">Verkauft</option>
              <option value="ordered">Bestellt</option>
              <option value="lost">Verloren</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!category && !status}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper: Detect collection type from name
function getCollectionType(name: string | undefined): string | undefined {
  if (!name) return undefined
  const normalized = name.toLowerCase()
  if (normalized.includes('hot wheels') || normalized.includes('modellauto')) return 'hot-wheels'
  if (normalized.includes('münz')) return 'coins'
  if (normalized.includes('briefmark')) return 'stamps'
  if (normalized.includes('vinyl') || normalized.includes('schallplatte')) return 'vinyl'
  if (normalized.includes('lego')) return 'lego'
  if (normalized.includes('uhr')) return 'watches'
  return undefined
}

function ItemCard({ item, collectionId, bulkEditMode, isSelected, onToggleSelect }: {
  item: any;
  collectionId: string;
  bulkEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const primaryImage = item.item_images?.find((img: any) => img.is_primary) ?? item.item_images?.[0]

  const cardContent = (
    <>
      <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative">
        {primaryImage ? (
          <img src={primaryImage.thumbnail_url ?? primaryImage.original_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300 dark:text-slate-500">📷</div>
        )}

        {/* Checkbox in Bulk Mode */}
        {bulkEditMode && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelect?.()
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 rounded border-2 border-white bg-white/90 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}

        {item.status !== 'in_collection' && (
          <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
            item.status === 'sold' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
            item.status === 'for_sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
            item.status === 'wishlist' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' :
            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {item.status === 'sold' ? 'Verkauft' :
             item.status === 'for_sale' ? 'Zu verkaufen' :
             item.status === 'wishlist' ? 'Wunschliste' : item.status}
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
    </>
  )

  if (bulkEditMode) {
    return (
      <div
        onClick={onToggleSelect}
        className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border-2 transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
        }`}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Link
      href={`/collections/${collectionId}/items/${item.id}`}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
    >
      {cardContent}
    </Link>
  )
}

function ItemRow({ item, collectionId, bulkEditMode, isSelected, onToggleSelect }: {
  item: any;
  collectionId: string;
  bulkEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const primaryImage = item.item_images?.find((img: any) => img.is_primary) ?? item.item_images?.[0]

  const statusLabels: Record<string, string> = {
    'in_collection': 'In Sammlung',
    'for_sale': 'Zu verkaufen',
    'sold': 'Verkauft',
    'wishlist': 'Wunschliste',
    'ordered': 'Bestellt',
    'lost': 'Verloren',
  }

  return (
    <tr className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
      {bulkEditMode && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </td>
      )}
      <td className="px-4 py-3">
        {bulkEditMode ? (
          <div className="flex items-center gap-3 cursor-pointer" onClick={onToggleSelect}>
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
              <div className="font-medium text-slate-900 dark:text-white">
                {item.name}
              </div>
              {item.barcode && (
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.barcode}</div>
              )}
            </div>
          </div>
        ) : (
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
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          item.status === 'in_collection' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
          item.status === 'for_sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
          item.status === 'sold' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
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
