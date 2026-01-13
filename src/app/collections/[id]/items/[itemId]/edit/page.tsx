'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import { ImageUpload } from '@/components/ImageUpload'
import { useToast } from '@/components/Toast'
import { CategorySelect } from '@/components/CategorySelect'
import { DuplicateWarning } from '@/components/DuplicateWarning'
import GradingInput, { type GradingValue } from '@/components/GradingInput'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  parent_id: string | null
  sort_order: number
}

interface AttributeDefinition {
  id: string
  name: string
  display_name: string
  type: string
  options: any
  required: boolean
}

export default function EditItemPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id: collectionId, itemId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<any>(null)
  const [itemName, setItemName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  const [existingImages, setExistingImages] = useState<any[]>([])

  // Item und Kategorien laden
  useEffect(() => {
    async function loadData() {
      // Item laden
      const { data: itemData } = await supabase
        .from('items')
        .select('*, item_images(*)')
        .eq('id', itemId)
        .single()

      if (itemData) {
        setItem(itemData)
        setItemName(itemData.name || '')
        setSelectedCategory(itemData.category_id || '')
        setAttributeValues(itemData.attributes || {})
        setExistingImages(itemData.item_images || [])
      }

      // Kategorien laden
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('collection_id', collectionId)
        .order('sort_order')

      if (catData) setCategories(catData)

      setLoading(false)
    }
    loadData()
  }, [collectionId, itemId])

  // Attribute laden wenn Kategorie gewählt (inkl. Parent-Kategorie)
  useEffect(() => {
    async function loadAttributes() {
      if (!selectedCategory) {
        setAttributes([])
        return
      }

      // Finde die gewählte Kategorie
      const category = categories.find(cat => cat.id === selectedCategory)
      const categoryIds = [selectedCategory]

      // Wenn Kategorie einen Parent hat, füge Parent-ID hinzu
      if (category?.parent_id) {
        categoryIds.push(category.parent_id)
      }

      // Lade Attribute von gewählter Kategorie UND Parent (falls vorhanden)
      const { data } = await supabase
        .from('attribute_definitions')
        .select('*')
        .in('category_id', categoryIds)
        .order('sort_order')

      if (data) setAttributes(data)
    }
    loadAttributes()
  }, [selectedCategory, categories])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const { error: updateError } = await supabase
      .from('items')
      .update({
        category_id: selectedCategory || null,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        purchase_price: formData.get('purchase_price') ? parseFloat(formData.get('purchase_price') as string) : null,
        _computed_value: formData.get('estimated_value') ? parseFloat(formData.get('estimated_value') as string) : null,
        purchase_date: formData.get('purchase_date') as string || null,
        purchase_location: formData.get('purchase_location') as string || null,
        notes: formData.get('notes') as string || null,
        status: formData.get('status') as string,
        attributes: attributeValues,
      })
      .eq('id', itemId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    showToast('Item gespeichert!')
    router.push(`/collections/${collectionId}/items/${itemId}`)
    router.refresh()
  }

  function updateAttributeValue(name: string, value: any) {
    setAttributeValues(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl dark:bg-slate-900 min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Form Sections Skeleton */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-20 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="w-32 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return <div className="p-8 dark:bg-slate-900 dark:text-white min-h-screen">Item nicht gefunden</div>
  }

  return (
    <div className="p-8 max-w-3xl dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}/items/${itemId}`}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zum Item
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Item bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bilder */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <ImageUpload
            itemId={itemId}
            existingImages={existingImages}
          />
        </section>

        {/* Basis-Informationen */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Basis-Informationen</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <DuplicateWarning
                itemName={itemName}
                collectionId={collectionId}
                currentItemId={itemId}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Beschreibung
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={item.description || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kategorie
                </label>
                <CategorySelect
                  categories={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Keine Kategorie"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={item.status}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="in_collection">📦 In Sammlung</option>
                <option value="wishlist">⭐ Wunschliste</option>
                <option value="ordered">📬 Bestellt</option>
                <option value="sold">💰 Verkauft</option>
                <option value="lost">❌ Verloren</option>
              </select>
            </div>
          </div>
        </section>

        {/* Kauf-Informationen */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Kauf-Informationen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchase_price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kaufpreis / EK (€)
              </label>
              <input
                type="number"
                id="purchase_price"
                name="purchase_price"
                step="0.01"
                min="0"
                defaultValue={item.purchase_price || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="estimated_value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Geschätzter Wert / VK (€)
              </label>
              <input
                type="number"
                id="estimated_value"
                name="estimated_value"
                step="0.01"
                min="0"
                defaultValue={item._computed_value || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kaufdatum
              </label>
              <input
                type="date"
                id="purchase_date"
                name="purchase_date"
                defaultValue={item.purchase_date || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="purchase_location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gekauft bei
              </label>
              <input
                type="text"
                id="purchase_location"
                name="purchase_location"
                defaultValue={item.purchase_location || ''}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Dynamische Attribute */}
        {attributes.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Kategorie-Attribute</h2>

            <div className="space-y-4">
              {attributes.map((attr) => (
                <DynamicField
                  key={attr.id}
                  attribute={attr}
                  value={attributeValues[attr.name]}
                  onChange={(value) => updateAttributeValue(attr.name, value)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Notizen */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Notizen</h2>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={item.notes || ''}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </section>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichere...' : 'Änderungen speichern'}
          </button>
          <Link
            href={`/collections/${collectionId}/items/${itemId}`}
            className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}

function DynamicField({
  attribute,
  value,
  onChange
}: {
  attribute: AttributeDefinition
  value: any
  onChange: (value: any) => void
}) {
  const { name, display_name, type, options, required } = attribute

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
  const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"

  switch (type) {
    case 'text':
      // Spezielle Behandlung für Grading-Attribute
      if (name === 'grading' || display_name?.toLowerCase().includes('grading')) {
        return (
          <div>
            <label className={labelClasses}>
              {display_name} {required && '*'}
            </label>
            <GradingInput
              value={value}
              onChange={onChange}
              required={required}
            />
          </div>
        )
      }

      return (
        <div>
          <label className={labelClasses}>
            {display_name} {required && '*'}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={required}
          />
        </div>
      )

    case 'number':
      return (
        <div>
          <label className={labelClasses}>
            {display_name} {required && '*'}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
            min={options?.min}
            max={options?.max}
            className={inputClasses}
            required={required}
          />
        </div>
      )

    case 'select':
      return (
        <div>
          <label className={labelClasses}>
            {display_name} {required && '*'}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={required}
          >
            <option value="">Bitte wählen...</option>
            {options?.choices?.map((choice: string) => (
              <option key={choice} value={choice}>{choice}</option>
            ))}
          </select>
        </div>
      )

    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={name}
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
          />
          <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {display_name}
          </label>
        </div>
      )

    case 'date':
      return (
        <div>
          <label className={labelClasses}>
            {display_name} {required && '*'}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={required}
          />
        </div>
      )

    case 'tags':
      return (
        <div>
          <label className={labelClasses}>
            {display_name}
          </label>
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Komma-getrennt"
            className={inputClasses}
          />
        </div>
      )

    default:
      return null
  }
}
