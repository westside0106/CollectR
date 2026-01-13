'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import { ImageUpload } from '@/components/ImageUpload'
import { useToast } from '@/components/Toast'
import { AIAnalyzeButton, AIAnalysisResult } from '@/components/AIAnalyzeButton'
import { AIResultModal } from '@/components/AIResultModal'
import { CategorySelect } from '@/components/CategorySelect'
import { DuplicateWarning } from '@/components/DuplicateWarning'
import GradingInput, { type GradingValue } from '@/components/GradingInput'
import { TCGPriceLookupButton, PriceResultDisplay } from '@/components/TCGPriceLookupButton'
import { autoCreateAttributesWithMessage } from '@/lib/autoCreateAttributes'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewItemPage({ params }: PageProps) {
  const { id: collectionId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [collection, setCollection] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [attributes, setAttributes] = useState<any[]>([])
  
  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('in_collection')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseLocation, setPurchaseLocation] = useState('')
  const [barcode, setBarcode] = useState('')
  const [notes, setNotes] = useState('')
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  
  // NEU: State für Bilder (vor dem Upload)
  const [pendingImages, setPendingImages] = useState<{ url: string; file?: File }[]>([])

  // KI-Analyse State
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  // TCG Price Lookup State
  const [priceResult, setPriceResult] = useState<any | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Collection-Typ für KI-Analyse ermitteln
  const getCollectionType = (): string | undefined => {
    const collectionName = collection?.name?.toLowerCase() || ''
    if (collectionName.includes('hot wheels') || collectionName.includes('modellauto')) return 'hot-wheels'
    if (collectionName.includes('münz')) return 'coins'
    if (collectionName.includes('briefmark')) return 'stamps'
    if (collectionName.includes('vinyl') || collectionName.includes('schallplatte')) return 'vinyl'
    if (collectionName.includes('lego')) return 'lego'
    if (collectionName.includes('uhr')) return 'watches'
    return undefined
  }

  // KI-Ergebnisse anwenden
  async function applyAiResult(result: Partial<AIAnalysisResult>) {
    if (result.name) setName(result.name)
    if (result.description) setDescription(result.description)
    if (result.estimatedValue) {
      // Mittleren Wert als Schätzung nehmen
      const avgValue = (result.estimatedValue.min + result.estimatedValue.max) / 2
      setEstimatedValue(avgValue.toFixed(2))
    }
    if (result.attributes) {
      setAttributeValues(prev => ({ ...prev, ...result.attributes }))

      // Auto-create attribute definitions for the category if one is selected
      if (categoryId) {
        const message = await autoCreateAttributesWithMessage(supabase, categoryId, result.attributes)
        if (message) {
          showToast(message)
          // Reload attributes to show the new ones
          loadAttributesForCategory(categoryId)
        }
      }
    }
    setAiApplied(true)
    showToast('KI-Vorschläge übernommen!')
  }

  // KI neu analysieren
  function handleReanalyze() {
    setAiResult(null)
    setAiApplied(false)
  }

  // Handler für KI-Analyse Ergebnis
  function handleAiResult(result: AIAnalysisResult) {
    setAiResult(result)
    setShowAiModal(true)
  }

  useEffect(() => {
    async function loadData() {
      // User holen
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        router.push('/login')
        return
      }

      // Collection laden
      const { data: col } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single()
      setCollection(col)

      // Kategorien laden
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('collection_id', collectionId)
        .order('sort_order')
      setCategories(cats || [])
    }
    loadData()
  }, [collectionId])

  // Funktion zum Laden der Attribute (kann auch manuell aufgerufen werden)
  async function loadAttributesForCategory(catId: string) {
    if (!catId) {
      setAttributes([])
      return
    }

    // Finde die gewählte Kategorie
    const selectedCategory = categories.find(cat => cat.id === catId)
    const categoryIds = [catId]

    // Wenn Kategorie einen Parent hat, füge Parent-ID hinzu
    if (selectedCategory?.parent_id) {
      categoryIds.push(selectedCategory.parent_id)
    }

    // Lade Attribute von gewählter Kategorie UND Parent (falls vorhanden)
    const { data } = await supabase
      .from('attribute_definitions')
      .select('*, attribute_options(*)')
      .in('category_id', categoryIds)
      .order('sort_order')

    setAttributes(data || [])
  }

  // Attribute laden wenn Kategorie gewählt (inkl. Parent-Kategorie)
  useEffect(() => {
    loadAttributesForCategory(categoryId)
  }, [categoryId, categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) {
      setError('Nicht eingeloggt')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Item erstellen
      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          collection_id: collectionId,
          category_id: categoryId || null,
          name,
          description: description || null,
          status,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          _computed_value: estimatedValue ? parseFloat(estimatedValue) : null,
          _value_currency: 'EUR',
          purchase_date: purchaseDate || null,
          purchase_location: purchaseLocation || null,
          barcode: barcode || null,
          notes: notes || null,
          attributes: Object.keys(attributeValues).length > 0 ? attributeValues : null,
          created_by: userId,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // 2. NEU: Bilder hochladen falls vorhanden
      if (pendingImages.length > 0 && data) {
        for (let i = 0; i < pendingImages.length; i++) {
          const img = pendingImages[i]
          if (img.file) {
            const fileName = `${data.id}/${Date.now()}-${img.file.name}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('item-images')
              .upload(fileName, img.file)

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from('item-images')
                .getPublicUrl(uploadData.path)

              // In DB speichern
              await supabase.from('item_images').insert({
                item_id: data.id,
                original_url: urlData.publicUrl,
                is_primary: i === 0, // Erstes Bild ist Hauptbild
              })
            }
          }
        }
      }

      showToast('Item erstellt!')
      router.push(`/collections/${collectionId}/items/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl dark:bg-slate-900 min-h-screen">
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Neues Item</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{collection?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NEU: Bilder-Upload Sektion */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4 mb-4">
            <ImageUpload
              onImagesChange={(images) => setPendingImages(images)}
            />
          </div>

          {/* KI-Analyse Button - nur wenn Bild vorhanden */}
          {pendingImages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 flex-wrap">
                <AIAnalyzeButton
                  imageUrl={pendingImages[0].url}
                  imageFile={pendingImages[0].file}
                  collectionType={getCollectionType()}
                  existingAttributes={attributes.map(a => a.display_name)}
                  onResult={handleAiResult}
                />
                {aiApplied && (
                  <button
                    type="button"
                    onClick={handleReanalyze}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Ändern
                  </button>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {aiApplied ? 'KI-Ergebnisse wurden übernommen' : 'KI analysiert das Bild und füllt Felder automatisch aus'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Basis-Infos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold mb-4 dark:text-white">Basis-Informationen</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="z.B. '67 Camaro"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <DuplicateWarning
                itemName={name}
                collectionId={collectionId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategorie</label>
                <CategorySelect
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="in_collection">📦 In Sammlung</option>
                  <option value="wishlist">⭐ Wunschliste</option>
                  <option value="ordered">📬 Bestellt</option>
                  <option value="sold">💰 Verkauft</option>
                  <option value="lost">❌ Verloren</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN/UPC..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Kauf-Infos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold mb-4 dark:text-white">Kauf-Informationen</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kaufpreis / EK (€)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Geschätzter Wert / VK (€)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* TCG Price Lookup Button - nur bei Trading Cards mit Grading */}
                {attributes.some(attr => attr.name === 'grading' || attr.display_name?.toLowerCase().includes('grading')) && name && (
                  <div className="space-y-2">
                    <TCGPriceLookupButton
                      cardName={name}
                      setName={attributeValues['set'] || attributeValues['edition'] || ''}
                      cardNumber={attributeValues['card_number'] || attributeValues['number'] || ''}
                      grading={
                        attributeValues['grading'] && typeof attributeValues['grading'] === 'object'
                          ? {
                              company: attributeValues['grading'].company,
                              grade: attributeValues['grading'].grade
                            }
                          : undefined
                      }
                      onPriceFound={(price, result) => {
                        setEstimatedValue(price.toFixed(2))
                        setPriceResult(result)
                      }}
                      disabled={!name}
                    />

                    {priceResult && (
                      <PriceResultDisplay
                        result={priceResult}
                        onDismiss={() => setPriceResult(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kaufdatum</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gekauft bei</label>
              <input
                type="text"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
                placeholder="z.B. eBay, Flohmarkt..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* KI-generierte Attribute (falls vorhanden) */}
        {aiApplied && aiResult?.attributes && Object.keys(aiResult.attributes).length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 shadow-sm border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✨</span>
              <h2 className="font-semibold dark:text-white">KI-erkannte Attribute</h2>
              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full">
                Automatisch erkannt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(aiResult.attributes).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {typeof value === 'boolean' ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={attributeValues[key] ?? value}
                        onChange={(e) => setAttributeValues({...attributeValues, [key]: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                      <span className="text-slate-600 dark:text-slate-300">{value ? 'Ja' : 'Nein'}</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={attributeValues[key] ?? value}
                      onChange={(e) => setAttributeValues({...attributeValues, [key]: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamische Attribute */}
        {attributes.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold mb-4 dark:text-white">Kategorie-Attribute</h2>

            <div className="space-y-4">
              {attributes.map(attr => (
                <div key={attr.id}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {attr.display_name}
                    {attr.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {attr.type === 'text' && !(attr.name === 'grading' || attr.display_name?.toLowerCase().includes('grading')) && (
                    <input
                      type="text"
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {attr.type === 'number' && (
                    <input
                      type="number"
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value ? parseFloat(e.target.value) : ''})}
                      required={attr.required}
                      min={attr.options?.min}
                      max={attr.options?.max}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {attr.type === 'select' && (
                    <select
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Auswählen --</option>
                      {attr.options?.choices?.map((choice: string) => (
                        <option key={choice} value={choice}>{choice}</option>
                      ))}
                      {attr.attribute_options?.map((opt: any) => (
                        <option key={opt.id} value={opt.value}>{opt.display_value}</option>
                      ))}
                    </select>
                  )}

                  {attr.type === 'checkbox' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={attributeValues[attr.name] || false}
                        onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                      <span className="text-slate-600 dark:text-slate-300">Ja</span>
                    </label>
                  )}

                  {attr.type === 'date' && (
                    <input
                      type="date"
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {attr.type === 'tags' && (
                    <input
                      type="text"
                      value={Array.isArray(attributeValues[attr.name]) ? attributeValues[attr.name].join(', ') : attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="Komma-getrennt"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {/* TCG Grading Input - spezielle Behandlung für "grading" Attribut */}
                  {(attr.name === 'grading' || attr.display_name?.toLowerCase().includes('grading')) && (
                    <GradingInput
                      value={attributeValues[attr.name]}
                      onChange={(val) => setAttributeValues({...attributeValues, [attr.name]: val})}
                      required={attr.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notizen */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold mb-4 dark:text-white">Notizen</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Weitere Notizen..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !userId}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Speichere...' : 'Item erstellen'}
          </button>
          <Link
            href={`/collections/${collectionId}`}
            className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>

      {/* KI-Ergebnis Modal */}
      {showAiModal && aiResult && (
        <AIResultModal
          result={aiResult}
          onApply={applyAiResult}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  )
}
