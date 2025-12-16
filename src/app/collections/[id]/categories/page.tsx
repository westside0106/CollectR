'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'

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
  show_in_list: boolean
}

const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Zahl' },
  { value: 'select', label: 'Auswahl (Dropdown)' },
  { value: 'checkbox', label: 'Checkbox (Ja/Nein)' },
  { value: 'date', label: 'Datum' },
  { value: 'tags', label: 'Tags (Mehrfach)' },
  { value: 'currency', label: 'Währung' },
]

const EMOJI_OPTIONS = ['📦', '🚗', '🏠', '🎮', '📚', '🎨', '⌚', '💎', '🎸', '📷', '🧸', '🏺']

export default function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = use(params)
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewAttribute, setShowNewAttribute] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // NEU: Error und Success States
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Kategorien laden
  useEffect(() => {
    loadCategories()
  }, [collectionId])

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order')
    
    if (error) {
      console.error('Error loading categories:', error)
      setError(`Fehler beim Laden: ${error.message}`)
    } else if (data) {
      setCategories(data)
    }
  }

  // Attribute laden wenn Kategorie gewählt
  useEffect(() => {
    if (selectedCategory) {
      loadAttributes(selectedCategory.id)
    } else {
      setAttributes([])
    }
  }, [selectedCategory])

  async function loadAttributes(categoryId: string) {
    const { data, error } = await supabase
      .from('attribute_definitions')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order')
    
    if (error) {
      console.error('Error loading attributes:', error)
    } else if (data) {
      setAttributes(data)
    }
  }

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const icon = formData.get('icon') as string || '📦'
    
    console.log('Creating category:', { collection_id: collectionId, name, icon })
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        collection_id: collectionId,
        name: name,
        icon: icon,
        sort_order: categories.length,
      })
      .select()
      .single()

    console.log('Insert result:', { data, error })

    if (error) {
      console.error('Error creating category:', error)
      setError(`Fehler: ${error.message}`)
      
      // Spezifische Fehlermeldungen
      if (error.code === '42501') {
        setError('Keine Berechtigung. Bitte prüfe die RLS Policies in Supabase.')
      } else if (error.code === '23503') {
        setError('Die Collection existiert nicht oder du hast keinen Zugriff.')
      }
    } else {
      setSuccess('Kategorie erstellt!')
      await loadCategories()
      setShowNewCategory(false)
      // Form zurücksetzen
      e.currentTarget.reset()
    }
    
    setLoading(false)
  }

  async function createAttribute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCategory) return
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const type = formData.get('type') as string
    const choicesRaw = formData.get('choices') as string
    
    let options: any = {}
    if (type === 'select' && choicesRaw) {
      options.choices = choicesRaw.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (type === 'number') {
      const min = formData.get('min')
      const max = formData.get('max')
      if (min) options.min = parseInt(min as string)
      if (max) options.max = parseInt(max as string)
    }
    
    const { data, error } = await supabase
      .from('attribute_definitions')
      .insert({
        category_id: selectedCategory.id,
        name: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.get('name') as string,
        type,
        options,
        required: formData.get('required') === 'on',
        show_in_list: formData.get('show_in_list') === 'on',
        sort_order: attributes.length,
      })
      .select()

    if (error) {
      console.error('Error creating attribute:', error)
      setError(`Fehler: ${error.message}`)
    } else {
      setSuccess('Attribut erstellt!')
      await loadAttributes(selectedCategory.id)
      setShowNewAttribute(false)
      e.currentTarget.reset()
    }
    
    setLoading(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm('Kategorie wirklich löschen?')) return
    
    const { error } = await supabase.from('categories').delete().eq('id', id)
    
    if (error) {
      setError(`Fehler beim Löschen: ${error.message}`)
    } else {
      await loadCategories()
      if (selectedCategory?.id === id) setSelectedCategory(null)
    }
  }

  async function deleteAttribute(id: string) {
    if (!confirm('Attribut wirklich löschen?')) return
    
    const { error } = await supabase.from('attribute_definitions').delete().eq('id', id)
    
    if (error) {
      setError(`Fehler beim Löschen: ${error.message}`)
    } else if (selectedCategory) {
      await loadAttributes(selectedCategory.id)
    }
  }

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Kategorien verwalten</h1>
        <p className="text-slate-500 mt-1">Erstelle Kategorien und definiere ihre Attribute</p>
      </div>

      {/* NEU: Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kategorien Liste */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Kategorien</h2>
            <button
              onClick={() => setShowNewCategory(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Neue Kategorie
            </button>
          </div>

          {showNewCategory && (
            <form onSubmit={createCategory} className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex gap-2 mb-3">
                <select name="icon" className="px-3 py-2 rounded border border-slate-300" defaultValue="📦">
                  {EMOJI_OPTIONS.map(emoji => (
                    <option key={emoji} value={emoji}>{emoji}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="name"
                  placeholder="Kategorie-Name"
                  required
                  minLength={1}
                  className="flex-1 px-3 py-2 rounded border border-slate-300"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Erstelle...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}

          {categories.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Noch keine Kategorien. Erstelle deine erste!
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCategory?.id === cat.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon || '📁'}</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Attribute für gewählte Kategorie */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedCategory ? `Attribute: ${selectedCategory.name}` : 'Attribute'}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setShowNewAttribute(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Neues Attribut
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <p className="text-slate-500 text-center py-8">
              Wähle eine Kategorie aus, um ihre Attribute zu bearbeiten
            </p>
          ) : (
            <>
              {showNewAttribute && (
                <form onSubmit={createAttribute} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Attribut-Name (z.B. Produktionsjahr)"
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300"
                  />
                  <select name="type" required className="w-full px-3 py-2 rounded border border-slate-300">
                    {ATTRIBUTE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="choices"
                    placeholder="Optionen für Auswahl (komma-getrennt)"
                    className="w-full px-3 py-2 rounded border border-slate-300"
                  />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="required" className="rounded" />
                      <span className="text-sm">Pflichtfeld</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="show_in_list" defaultChecked className="rounded" />
                      <span className="text-sm">In Liste anzeigen</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                    >
                      {loading ? 'Erstelle...' : 'Erstellen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewAttribute(false)}
                      className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}

              {attributes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Noch keine Attribute. Diese erscheinen beim Erstellen von Items.
                </p>
              ) : (
                <div className="space-y-2">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{attr.display_name}</span>
                        <span className="text-slate-500 text-sm ml-2">
                          ({ATTRIBUTE_TYPES.find(t => t.value === attr.type)?.label})
                        </span>
                        {attr.required && (
                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                            Pflicht
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAttribute(attr.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* NEU: Debug Info (nur für Entwicklung) */}
      <details className="mt-8 text-xs text-slate-400">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto">
          Collection ID: {collectionId}
          {'\n'}Categories loaded: {categories.length}
          {'\n'}Selected: {selectedCategory?.name || 'none'}
        </pre>
      </details>
    </div>
  )
}
