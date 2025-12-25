'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
}

interface DuplicateItem {
  id: string
  name: string
  collection_id: string
  collection_name: string
  barcode?: string
  match_type: 'exact_barcode' | 'exact_name' | 'similar_name'
}

interface ItemData {
  name: string
  description?: string
  barcode?: string
  notes?: string
  attributes?: Record<string, any>
  coverUrl?: string
}

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  itemData: ItemData
  itemType: 'book' | 'vinyl'
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  itemData,
  itemType
}: AddToCollectionModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCollections()
      setDuplicates([])
      setIgnoreDuplicates(false)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  // Check for duplicates when collection is selected
  useEffect(() => {
    if (selectedCollection && !ignoreDuplicates) {
      checkForDuplicates()
    }
  }, [selectedCollection])

  async function loadCollections() {
    setLoadingCollections(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Bitte zuerst einloggen')
      setLoadingCollections(false)
      return
    }

    const { data } = await supabase
      .from('collections')
      .select('id, name')
      .eq('owner_id', user.id)
      .order('name')

    setCollections(data || [])
    setLoadingCollections(false)
  }

  async function checkForDuplicates() {
    if (!selectedCollection) return

    setCheckingDuplicates(true)
    const foundDuplicates: DuplicateItem[] = []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all user's collection IDs
    const { data: userCollections } = await supabase
      .from('collections')
      .select('id, name')
      .eq('owner_id', user.id)

    if (!userCollections || userCollections.length === 0) {
      setCheckingDuplicates(false)
      return
    }

    const collectionIds = userCollections.map(c => c.id)
    const collectionNameMap = new Map(userCollections.map(c => [c.id, c.name]))

    // Check by barcode (exact match - highest priority)
    if (itemData.barcode) {
      const { data: barcodeMatches } = await supabase
        .from('items')
        .select('id, name, collection_id, barcode')
        .in('collection_id', collectionIds)
        .eq('barcode', itemData.barcode)

      if (barcodeMatches && barcodeMatches.length > 0) {
        barcodeMatches.forEach(item => {
          foundDuplicates.push({
            id: item.id,
            name: item.name,
            collection_id: item.collection_id,
            collection_name: collectionNameMap.get(item.collection_id) || 'Unbekannt',
            barcode: item.barcode,
            match_type: 'exact_barcode'
          })
        })
      }
    }

    // Check by exact name match
    const { data: nameMatches } = await supabase
      .from('items')
      .select('id, name, collection_id, barcode')
      .in('collection_id', collectionIds)
      .ilike('name', itemData.name)

    if (nameMatches && nameMatches.length > 0) {
      nameMatches.forEach(item => {
        // Avoid duplicates from barcode search
        if (!foundDuplicates.some(d => d.id === item.id)) {
          foundDuplicates.push({
            id: item.id,
            name: item.name,
            collection_id: item.collection_id,
            collection_name: collectionNameMap.get(item.collection_id) || 'Unbekannt',
            barcode: item.barcode,
            match_type: 'exact_name'
          })
        }
      })
    }

    // Check for similar names (fuzzy match - first 3 words)
    const nameWords = itemData.name.toLowerCase().split(/\s+/).slice(0, 3)
    if (nameWords.length > 0 && nameWords[0].length > 3) {
      const searchPattern = `%${nameWords[0]}%`

      const { data: similarMatches } = await supabase
        .from('items')
        .select('id, name, collection_id, barcode')
        .in('collection_id', collectionIds)
        .ilike('name', searchPattern)
        .limit(10)

      if (similarMatches && similarMatches.length > 0) {
        similarMatches.forEach(item => {
          // Avoid duplicates from previous searches
          if (!foundDuplicates.some(d => d.id === item.id)) {
            // Check if at least 2 words match
            const itemWords = item.name.toLowerCase().split(/\s+/)
            const matchingWords = nameWords.filter(w =>
              itemWords.some(iw => iw.includes(w) || w.includes(iw))
            )

            if (matchingWords.length >= 2 ||
                (matchingWords.length === 1 && nameWords.length === 1)) {
              foundDuplicates.push({
                id: item.id,
                name: item.name,
                collection_id: item.collection_id,
                collection_name: collectionNameMap.get(item.collection_id) || 'Unbekannt',
                barcode: item.barcode,
                match_type: 'similar_name'
              })
            }
          }
        })
      }
    }

    setDuplicates(foundDuplicates)
    setCheckingDuplicates(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCollection) return

    // Block if duplicates found and not ignored
    if (duplicates.length > 0 && !ignoreDuplicates) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')

      // Item erstellen
      const { data: item, error: insertError } = await supabase
        .from('items')
        .insert({
          collection_id: selectedCollection,
          name: itemData.name,
          description: itemData.description || null,
          barcode: itemData.barcode || null,
          notes: itemData.notes || null,
          attributes: itemData.attributes || null,
          status: 'in_collection',
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Cover-Bild als externe URL speichern (falls vorhanden)
      if (itemData.coverUrl && item) {
        await supabase.from('item_images').insert({
          item_id: item.id,
          original_url: itemData.coverUrl,
          is_primary: true,
        })
      }

      setSuccess(true)

      // Nach 1.5s zur Item-Seite navigieren
      setTimeout(() => {
        router.push(`/collections/${selectedCollection}/items/${item.id}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
      setLoading(false)
    }
  }

  function getMatchTypeLabel(type: DuplicateItem['match_type']) {
    switch (type) {
      case 'exact_barcode': return 'Gleicher Barcode'
      case 'exact_name': return 'Gleicher Name'
      case 'similar_name': return 'Ähnlicher Name'
    }
  }

  function getMatchTypeColor(type: DuplicateItem['match_type']) {
    switch (type) {
      case 'exact_barcode': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'exact_name': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'similar_name': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {itemType === 'book' ? '📚' : '💿'}
            </div>
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">Erfolgreich hinzugefügt!</h3>
            <p className="text-gray-600 dark:text-gray-300">Weiterleitung zur Item-Seite...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Zur Sammlung hinzufügen
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {itemData.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingCollections ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Du hast noch keine Sammlungen.</p>
                <button
                  onClick={() => router.push('/collections/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Erste Sammlung erstellen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sammlung auswählen
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => {
                      setSelectedCollection(e.target.value)
                      setIgnoreDuplicates(false)
                    }}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Bitte auswählen --</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duplicate Warning */}
                {checkingDuplicates && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Prüfe auf Duplikate...
                  </div>
                )}

                {duplicates.length > 0 && !ignoreDuplicates && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                          Mögliche Duplikate gefunden
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Dieses Item existiert möglicherweise bereits in deiner Sammlung:
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {duplicates.map(dup => (
                        <Link
                          key={dup.id}
                          href={`/collections/${dup.collection_id}/items/${dup.id}`}
                          className="block bg-white dark:bg-slate-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-600 transition border border-amber-200 dark:border-amber-800"
                          onClick={onClose}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {dup.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                in "{dup.collection_name}"
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getMatchTypeColor(dup.match_type)}`}>
                              {getMatchTypeLabel(dup.match_type)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIgnoreDuplicates(true)}
                      className="w-full text-sm text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline"
                    >
                      Trotzdem hinzufügen (kein Duplikat)
                    </button>
                  </div>
                )}

                {/* Preview */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Wird hinzugefügt:</p>
                  <div className="flex gap-3">
                    {itemData.coverUrl && (
                      <img
                        src={itemData.coverUrl}
                        alt=""
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{itemData.name}</p>
                      {itemData.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{itemData.description}</p>
                      )}
                      {itemData.barcode && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Barcode: {itemData.barcode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-gray-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedCollection || (duplicates.length > 0 && !ignoreDuplicates)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                  >
                    {loading ? 'Speichere...' : 'Hinzufügen'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
