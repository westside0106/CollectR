'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import { ImageUpload } from '@/components/ImageUpload'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewItemPage({ params }: PageProps) {
  const { id: collectionId } = use(params)
  const router = useRouter()
  const supabase = createClient()

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
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseLocation, setPurchaseLocation] = useState('')
  const [barcode, setBarcode] = useState('')
  const [notes, setNotes] = useState('')
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  
  // NEU: State für Bilder (vor dem Upload)
  const [pendingImages, setPendingImages] = useState<{ url: string; file?: File }[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Attribute laden wenn Kategorie gewählt
  useEffect(() => {
    async function loadAttributes() {
      if (!categoryId) {
        setAttributes([])
        return
      }

      const { data } = await supabase
        .from('attribute_definitions')
        .select('*, attribute_options(*)')
        .eq('category_id', categoryId)
        .order('sort_order')

      setAttributes(data || [])
    }
    loadAttributes()
  }, [categoryId])

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

      router.push(`/collections/${collectionId}/items/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Neues Item</h1>
        <p className="text-slate-500 mt-1">{collection?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NEU: Bilder-Upload Sektion */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <ImageUpload 
            onImagesChange={(images) => setPendingImages(images)}
          />
        </div>

        {/* Basis-Infos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold mb-4">Basis-Informationen</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="z.B. '67 Camaro"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Keine --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN/UPC..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Kauf-Infos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold mb-4">Kauf-Informationen</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kaufpreis (€)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kaufdatum</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Gekauft bei</label>
              <input
                type="text"
                value={purchaseLocation}
                onChange={(e) => setPurchaseLocation(e.target.value)}
                placeholder="z.B. eBay, Flohmarkt..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamische Attribute */}
        {attributes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="font-semibold mb-4">Kategorie-Attribute</h2>
            
            <div className="space-y-4">
              {attributes.map(attr => (
                <div key={attr.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {attr.display_name}
                    {attr.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {attr.type === 'text' && (
                    <input
                      type="text"
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {attr.type === 'select' && (
                    <select
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="w-5 h-5 rounded border-slate-300"
                      />
                      <span className="text-slate-600">Ja</span>
                    </label>
                  )}

                  {attr.type === 'date' && (
                    <input
                      type="date"
                      value={attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value})}
                      required={attr.required}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {attr.type === 'tags' && (
                    <input
                      type="text"
                      value={Array.isArray(attributeValues[attr.name]) ? attributeValues[attr.name].join(', ') : attributeValues[attr.name] || ''}
                      onChange={(e) => setAttributeValues({...attributeValues, [attr.name]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="Komma-getrennt"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notizen */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold mb-4">Notizen</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Weitere Notizen..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
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
            className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
