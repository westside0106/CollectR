'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Collection {
  id: string
  name: string
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

  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCollection) return

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {itemType === 'book' ? '📚' : '💿'}
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Erfolgreich hinzugefügt!</h3>
            <p className="text-gray-600">Weiterleitung zur Item-Seite...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Zur Sammlung hinzufügen
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {itemData.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
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
                <p className="text-gray-600 mb-4">Du hast noch keine Sammlungen.</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sammlung auswählen
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Bitte auswählen --</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Wird hinzugefügt:</p>
                  <div className="flex gap-3">
                    {itemData.coverUrl && (
                      <img
                        src={itemData.coverUrl}
                        alt=""
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{itemData.name}</p>
                      {itemData.description && (
                        <p className="text-sm text-gray-600 truncate">{itemData.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedCollection}
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
