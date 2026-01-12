'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AIAnalysisResult } from './AIAnalyzeButton'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  icon: string | null
  parent_id: string | null
  collection_id?: string
}

interface Collection {
  id: string
  name: string
  cover_image: string | null
}

interface BatchItem {
  id: string
  file: File
  preview: string
  analyzing: boolean
  analyzed: boolean
  result: AIAnalysisResult | null
  error: string | null
  selectedCategory: string | null
  selectedCollection: string
}

interface AIBatchUploadProps {
  collectionId: string
  collectionType?: string
  categories: Category[]
  onItemsCreated: (count: number) => void
  onClose: () => void
}

export function AIBatchUpload({
  collectionId,
  collectionType,
  categories,
  onItemsCreated,
  onClose
}: AIBatchUploadProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [allCategories, setAllCategories] = useState<Map<string, Category[]>>(new Map())
  const supabase = createClient()

  // Load all user collections on mount
  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load all collections
    const { data: collectionsData } = await supabase
      .from('collections')
      .select('id, name, cover_image')
      .eq('owner_id', user.id)
      .order('name')

    if (collectionsData) {
      setCollections(collectionsData)

      // Load categories for all collections
      const collectionIds = collectionsData.map(c => c.id)
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, icon, parent_id, collection_id')
        .in('collection_id', collectionIds)
        .order('name')

      if (categoriesData) {
        const categoryMap = new Map<string, Category[]>()
        categoriesData.forEach(cat => {
          const existing = categoryMap.get(cat.collection_id!) || []
          existing.push(cat)
          categoryMap.set(cat.collection_id!, existing)
        })
        // Add current collection's categories if not already loaded
        if (!categoryMap.has(collectionId) && categories.length > 0) {
          categoryMap.set(collectionId, categories)
        }
        setAllCategories(categoryMap)
      }
    }
  }

  // Get categories for a specific collection
  function getCategoriesForCollection(colId: string): Category[] {
    if (colId === collectionId) {
      return categories
    }
    return allCategories.get(colId) || []
  }

  // File Upload Handler
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const MAX_FILES = 10
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    const currentCount = batchItems.length
    const remainingSlots = MAX_FILES - currentCount

    const validFiles = files.slice(0, remainingSlots).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Ungültiger Dateityp: ${file.name}`)
        return false
      }
      if (file.size > MAX_SIZE) {
        alert(`Datei zu groß: ${file.name}`)
        return false
      }
      return true
    })

    const newItems: BatchItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      analyzing: false,
      analyzed: false,
      result: null,
      error: null,
      selectedCategory: null,
      selectedCollection: collectionId
    }))

    setBatchItems(prev => [...prev, ...newItems])
  }

  // Remove Item
  function removeItem(id: string) {
    setBatchItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  // Update collection for an item
  function updateItemCollection(itemId: string, newCollectionId: string) {
    setBatchItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, selectedCollection: newCollectionId, selectedCategory: null }
          : item
      )
    )
  }

  // Re-analyze a single item
  function reanalyzeItem(itemId: string) {
    setBatchItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, analyzed: false, result: null, error: null, selectedCategory: null }
          : item
      )
    )
  }

  // Analyze All Images with AI
  async function analyzeAll() {
    setAnalyzing(true)

    for (const item of batchItems) {
      if (item.analyzed) continue

      setBatchItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, analyzing: true, error: null } : i)
      )

      try {
        // Convert to Base64
        const base64 = await fileToBase64(item.file)

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: {
            imageBase64: base64,
            collectionType,
            existingAttributes: []
          }
        })

        if (error) throw new Error(error.message)
        if (data.error) throw new Error(data.error)

        // Find matching category in the selected collection
        const itemCategories = getCategoriesForCollection(item.selectedCollection)
        const matchedCategory = findMatchingCategory(data.category, itemCategories)

        setBatchItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  analyzing: false,
                  analyzed: true,
                  result: data,
                  selectedCategory: matchedCategory?.id || null
                }
              : i
          )
        )
      } catch (err: any) {
        console.error('AI Analysis error:', err)
        setBatchItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, analyzing: false, error: err.message || 'Analyse fehlgeschlagen' }
              : i
          )
        )
      }
    }

    setAnalyzing(false)
  }

  // Find matching category by name
  function findMatchingCategory(aiCategory: string | undefined, cats: Category[]): Category | null {
    if (!aiCategory) return null

    const normalized = aiCategory.toLowerCase()

    // Exact match
    let match = cats.find(c => c.name.toLowerCase() === normalized)
    if (match) return match

    // Partial match
    match = cats.find(c =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase())
    )

    return match || null
  }

  // Save All Items to Database
  async function saveAllItems() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Nicht eingeloggt')
      return
    }

    setSaving(true)

    try {
      let successCount = 0
      const collectionsUpdated = new Set<string>()

      for (const item of batchItems) {
        if (!item.result) continue

        // 1. Create Item
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            collection_id: item.selectedCollection,
            created_by: user.id,
            name: item.result.name || 'Unbekannt',
            description: item.result.description,
            category_id: item.selectedCategory,
            _computed_value: item.result.estimatedValue
              ? (item.result.estimatedValue.min + item.result.estimatedValue.max) / 2
              : null,
            _value_currency: item.result.estimatedValue?.currency || 'EUR',
            attributes: item.result.attributes || {},
            status: 'in_collection'
          })
          .select()
          .single()

        if (itemError) {
          console.error('Error creating item:', itemError)
          continue
        }

        collectionsUpdated.add(item.selectedCollection)

        // 2. Upload Image
        const fileName = `${newItem.id}/${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, item.file)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          continue
        }

        // 3. Get Public URL
        const { data: urlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(uploadData?.path ?? fileName)

        // 4. Create Image Record
        const { error: imageError } = await supabase
          .from('item_images')
          .insert({
            item_id: newItem.id,
            original_url: urlData.publicUrl,
            filename: item.file.name,
            size_bytes: item.file.size,
            mime_type: item.file.type,
            uploaded_by: user.id,
            is_primary: true
          })

        if (imageError) {
          console.error('Error creating image record:', imageError)
        }

        successCount++
      }

      if (successCount > 0) {
        onItemsCreated(successCount)
        onClose()
      } else {
        alert('Keine Items konnten erstellt werden')
      }
    } catch (err) {
      console.error('Error saving items:', err)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const MAX_FILES = 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ✨ KI Batch-Upload
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Lade bis zu {MAX_FILES} Bilder hoch und weise sie verschiedenen Sammlungen zu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Area */}
          {batchItems.length < MAX_FILES && (
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    JPEG, PNG, WebP (max. 5MB, {MAX_FILES - batchItems.length} verbleibend)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

          {/* Batch Items */}
          {batchItems.length > 0 && (
            <div className="space-y-4">
              {batchItems.map(item => {
                const itemCategories = getCategoriesForCollection(item.selectedCollection)

                return (
                  <div
                    key={item.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800"
                  >
                    <div className="flex gap-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <Image
                          src={item.preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {item.result?.name || item.file.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.analyzed && (
                              <button
                                onClick={() => reanalyzeItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Neu analysieren"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              title="Entfernen"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Status */}
                        {item.analyzing && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <span className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            <span>Analysiere...</span>
                          </div>
                        )}

                        {item.error && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            {item.error}
                          </div>
                        )}

                        {/* Selection Dropdowns - Always show */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Collection Selection */}
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Sammlung
                            </label>
                            <select
                              value={item.selectedCollection}
                              onChange={(e) => updateItemCollection(item.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                              {collections.map(col => (
                                <option key={col.id} value={col.id}>
                                  {col.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Category Selection */}
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Kategorie {!item.analyzed && <span className="text-slate-400">(nach Analyse)</span>}
                            </label>
                            <select
                              value={item.selectedCategory || ''}
                              onChange={(e) => {
                                setBatchItems(prev =>
                                  prev.map(i =>
                                    i.id === item.id ? { ...i, selectedCategory: e.target.value || null } : i
                                  )
                                )
                              }}
                              disabled={!item.analyzed && itemCategories.length === 0}
                              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                            >
                              <option value="">-- Optional --</option>
                              {itemCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Analysis Results */}
                        {item.analyzed && item.result && (
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                            {item.result.estimatedValue && (
                              <span>
                                Geschätzter Wert: {item.result.estimatedValue.min} - {item.result.estimatedValue.max} {item.result.estimatedValue.currency}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {batchItems.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {batchItems.length} Bild{batchItems.length !== 1 ? 'er' : ''} hochgeladen
              {batchItems.some(i => i.analyzed) && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  • {batchItems.filter(i => i.analyzed).length} analysiert
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!batchItems.every(i => i.analyzed) && (
                <button
                  onClick={analyzeAll}
                  disabled={analyzing || batchItems.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {analyzing ? 'Analysiere...' : '✨ Alle analysieren'}
                </button>
              )}

              {batchItems.some(i => i.analyzed) && (
                <button
                  onClick={saveAllItems}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {saving ? 'Speichere...' : `✓ ${batchItems.filter(i => i.analyzed).length} Items erstellen`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
