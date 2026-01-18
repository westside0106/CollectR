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

const COLOR_OPTIONS = [
  { value: null, label: 'Keine', color: '#94a3b8' },
  { value: '#ef4444', label: 'Rot', color: '#ef4444' },
  { value: '#f97316', label: 'Orange', color: '#f97316' },
  { value: '#eab308', label: 'Gelb', color: '#eab308' },
  { value: '#22c55e', label: 'Grün', color: '#22c55e' },
  { value: '#06b6d4', label: 'Cyan', color: '#06b6d4' },
  { value: '#3b82f6', label: 'Blau', color: '#3b82f6' },
  { value: '#8b5cf6', label: 'Violett', color: '#8b5cf6' },
  { value: '#ec4899', label: 'Pink', color: '#ec4899' },
]

// Vorlagen für beliebte Sammlungstypen
const CATEGORY_TEMPLATES = [
  {
    name: 'Hot Wheels / Modellautos',
    categories: [
      { name: 'Mainline', icon: '🚗', attributes: [
        { name: 'serie', display_name: 'Serie', type: 'text' },
        { name: 'produktionsjahr', display_name: 'Produktionsjahr', type: 'number', options: { min: 1968, max: 2030 } },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint/OVP', 'Sehr gut', 'Gut', 'Gebraucht', 'Beschädigt'] } },
        { name: 'treasure_hunt', display_name: 'Treasure Hunt', type: 'checkbox' },
      ]},
      { name: 'Premium', icon: '⭐', attributes: [
        { name: 'serie', display_name: 'Serie', type: 'text' },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint/OVP', 'Sehr gut', 'Gut', 'Gebraucht', 'Beschädigt'] } },
      ]},
      { name: 'Super Treasure Hunt', icon: '💎', attributes: [
        { name: 'produktionsjahr', display_name: 'Produktionsjahr', type: 'number' },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint/OVP', 'Sehr gut', 'Gut', 'Gebraucht', 'Beschädigt'] } },
      ]},
    ]
  },
  {
    name: 'Münzen',
    categories: [
      { name: 'Umlaufmünzen', icon: '🪙', attributes: [
        { name: 'land', display_name: 'Land', type: 'text' },
        { name: 'jahr', display_name: 'Prägejahr', type: 'number' },
        { name: 'nennwert', display_name: 'Nennwert', type: 'text' },
        { name: 'zustand', display_name: 'Erhaltung', type: 'select', options: { choices: ['PP (Polierte Platte)', 'ST (Stempelglanz)', 'VZ (Vorzüglich)', 'SS (Sehr schön)', 'S (Schön)', 'SGE (Sehr gut erhalten)'] } },
        { name: 'material', display_name: 'Material', type: 'select', options: { choices: ['Gold', 'Silber', 'Kupfer', 'Nickel', 'Bronze', 'Andere'] } },
      ]},
      { name: 'Gedenkmünzen', icon: '🏅', attributes: [
        { name: 'anlass', display_name: 'Anlass', type: 'text' },
        { name: 'jahr', display_name: 'Prägejahr', type: 'number' },
        { name: 'zustand', display_name: 'Erhaltung', type: 'select', options: { choices: ['PP (Polierte Platte)', 'ST (Stempelglanz)', 'VZ (Vorzüglich)', 'SS (Sehr schön)'] } },
        { name: 'auflage', display_name: 'Auflage', type: 'number' },
      ]},
      { name: 'Antike Münzen', icon: '🏛️', attributes: [
        { name: 'epoche', display_name: 'Epoche', type: 'text' },
        { name: 'herrscher', display_name: 'Herrscher', type: 'text' },
        { name: 'zustand', display_name: 'Erhaltung', type: 'select', options: { choices: ['VZ', 'SS', 'S', 'SGE', 'GE'] } },
      ]},
    ]
  },
  {
    name: 'Trading Cards',
    categories: [
      { name: 'Pokémon', icon: '⚡', attributes: [
        { name: 'set', display_name: 'Set/Edition', type: 'text' },
        { name: 'kartennummer', display_name: 'Kartennummer', type: 'text' },
        { name: 'seltenheit', display_name: 'Seltenheit', type: 'select', options: { choices: ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Secret Rare'] } },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint (10)', 'Near Mint (9)', 'Excellent (7-8)', 'Good (5-6)', 'Played (3-4)', 'Poor (1-2)'] } },
        { name: 'grading', display_name: 'PSA/BGS Grading', type: 'text' },
      ]},
      { name: 'Yu-Gi-Oh!', icon: '🃏', attributes: [
        { name: 'set', display_name: 'Set', type: 'text' },
        { name: 'seltenheit', display_name: 'Seltenheit', type: 'select', options: { choices: ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare', 'Ultimate Rare'] } },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint', 'Near Mint', 'Excellent', 'Good', 'Played'] } },
      ]},
      { name: 'Magic: The Gathering', icon: '🧙', attributes: [
        { name: 'set', display_name: 'Set', type: 'text' },
        { name: 'seltenheit', display_name: 'Seltenheit', type: 'select', options: { choices: ['Common', 'Uncommon', 'Rare', 'Mythic Rare'] } },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played'] } },
        { name: 'foil', display_name: 'Foil', type: 'checkbox' },
      ]},
    ]
  },
  {
    name: 'LEGO',
    categories: [
      { name: 'Sets', icon: '🧱', attributes: [
        { name: 'setnummer', display_name: 'Set-Nummer', type: 'text' },
        { name: 'thema', display_name: 'Thema', type: 'text' },
        { name: 'teile', display_name: 'Teilezahl', type: 'number' },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['MISB (Neu/Versiegelt)', 'Geöffnet/Komplett', 'Geöffnet/Unvollständig', 'Nur Steine', 'Nur Box'] } },
        { name: 'anleitung', display_name: 'Anleitung vorhanden', type: 'checkbox' },
      ]},
      { name: 'Minifiguren', icon: '🧍', attributes: [
        { name: 'serie', display_name: 'Serie', type: 'text' },
        { name: 'zustand', display_name: 'Zustand', type: 'select', options: { choices: ['Neu', 'Wie neu', 'Bespielt', 'Beschädigt'] } },
        { name: 'zubehoer', display_name: 'Zubehör komplett', type: 'checkbox' },
      ]},
    ]
  },
  {
    name: 'Briefmarken',
    categories: [
      { name: 'Einzelmarken', icon: '📮', attributes: [
        { name: 'land', display_name: 'Land', type: 'text' },
        { name: 'jahr', display_name: 'Ausgabejahr', type: 'number' },
        { name: 'michel_nr', display_name: 'Michel-Nr.', type: 'text' },
        { name: 'zustand', display_name: 'Erhaltung', type: 'select', options: { choices: ['Postfrisch', 'Ungebraucht mit Falz', 'Gestempelt', 'Auf Brief'] } },
        { name: 'zaehnung', display_name: 'Zähnung', type: 'text' },
      ]},
      { name: 'Blocks & Bögen', icon: '📑', attributes: [
        { name: 'land', display_name: 'Land', type: 'text' },
        { name: 'zustand', display_name: 'Erhaltung', type: 'select', options: { choices: ['Postfrisch', 'Ersttagsstempel', 'Gestempelt'] } },
      ]},
    ]
  },
]

export default function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = use(params)
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewAttribute, setShowNewAttribute] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // Edit States
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null)

  // Separate loading states für Category und Attribute
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [loadingAttribute, setLoadingAttribute] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  
  // Error und Success States
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Kategorien laden
  useEffect(() => {
    loadCategories()
  }, [collectionId])

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('collection_id', collectionId)
        .order('sort_order')
      
      if (error) {
        console.error('Error loading categories:', error)
      } else if (data) {
        setCategories(data)
      }
    } catch (err) {
      console.error('Exception loading categories:', err)
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
    try {
      // Finde die gewählte Kategorie
      const category = categories.find(cat => cat.id === categoryId)
      const categoryIds = [categoryId]

      // Wenn Kategorie einen Parent hat, füge Parent-ID hinzu
      if (category?.parent_id) {
        categoryIds.push(category.parent_id)
      }

      // Lade Attribute von gewählter Kategorie UND Parent (falls vorhanden)
      const { data, error } = await supabase
        .from('attribute_definitions')
        .select('*')
        .in('category_id', categoryIds)
        .order('sort_order')

      if (error) {
        console.error('Error loading attributes:', error)
      } else if (data) {
        setAttributes(data)
      }
    } catch (err) {
      console.error('Exception loading attributes:', err)
    }
  }

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingCategory(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const icon = formData.get('icon') as string || '📦'
    const color = formData.get('color') as string || null
    const parent_id = formData.get('parent_id') as string || null

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          collection_id: collectionId,
          name: name,
          icon: icon,
          color: color === '' ? null : color,
          parent_id: parent_id === '' ? null : parent_id,
          sort_order: categories.length,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating category:', error)
        setError(`Fehler: ${error.message}`)
      } else {
        setSuccess('Kategorie erstellt!')
        setShowNewCategory(false)
        // Reload in try/catch damit loading nicht hängen bleibt
        try {
          await loadCategories()
        } catch (reloadErr) {
          console.error('Reload error:', reloadErr)
        }
      }
    } catch (err: any) {
      console.error('Exception creating category:', err)
      setError(`Fehler: ${err.message || 'Unbekannter Fehler'}`)
    } finally {
      // WICHTIG: Loading IMMER zurücksetzen
      setLoadingCategory(false)
    }
  }

  async function createAttribute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCategory) return
    
    setLoadingAttribute(true)
    setError(null)
    setSuccess(null)
    
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
    
    try {
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
        setShowNewAttribute(false)
        // Reload in try/catch
        try {
          await loadAttributes(selectedCategory.id)
        } catch (reloadErr) {
          console.error('Reload error:', reloadErr)
        }
      }
    } catch (err: any) {
      console.error('Exception creating attribute:', err)
      setError(`Fehler: ${err.message || 'Unbekannter Fehler'}`)
    } finally {
      // WICHTIG: Loading IMMER zurücksetzen
      setLoadingAttribute(false)
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Kategorie wirklich löschen?')) return
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      
      if (error) {
        setError(`Fehler beim Löschen: ${error.message}`)
      } else {
        await loadCategories()
        if (selectedCategory?.id === id) setSelectedCategory(null)
      }
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    }
  }

  async function deleteAttribute(id: string) {
    if (!confirm('Attribut wirklich löschen?')) return

    try {
      const { error } = await supabase.from('attribute_definitions').delete().eq('id', id)

      if (error) {
        setError(`Fehler beim Löschen: ${error.message}`)
      } else if (selectedCategory) {
        await loadAttributes(selectedCategory.id)
      }
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    }
  }

  async function updateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingCategory) return

    setLoadingCategory(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const icon = formData.get('icon') as string
    const color = formData.get('color') as string || null
    const parent_id = formData.get('parent_id') as string || null

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name,
          icon,
          color: color === 'null' ? null : color,
          parent_id: parent_id === '' ? null : parent_id
        })
        .eq('id', editingCategory.id)

      if (error) {
        setError(`Fehler: ${error.message}`)
      } else {
        setSuccess('Kategorie aktualisiert!')
        setEditingCategory(null)
        await loadCategories()
        // Update selectedCategory if it was the one edited
        if (selectedCategory?.id === editingCategory.id) {
          const updated = categories.find(c => c.id === editingCategory.id)
          if (updated) setSelectedCategory({ ...updated, name, icon, color, parent_id })
        }
      }
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    } finally {
      setLoadingCategory(false)
    }
  }

  async function updateAttribute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingAttribute) return

    setLoadingAttribute(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const type = formData.get('type') as string
    const choicesRaw = formData.get('choices') as string

    let options: any = editingAttribute.options || {}
    if (type === 'select' && choicesRaw) {
      options.choices = choicesRaw.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (type === 'number') {
      const min = formData.get('min')
      const max = formData.get('max')
      if (min) options.min = parseInt(min as string)
      if (max) options.max = parseInt(max as string)
    }

    try {
      const { error } = await supabase
        .from('attribute_definitions')
        .update({
          display_name: formData.get('name') as string,
          name: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '_'),
          type,
          options,
          required: formData.get('required') === 'on',
          show_in_list: formData.get('show_in_list') === 'on',
        })
        .eq('id', editingAttribute.id)

      if (error) {
        setError(`Fehler: ${error.message}`)
      } else {
        setSuccess('Attribut aktualisiert!')
        setEditingAttribute(null)
        if (selectedCategory) await loadAttributes(selectedCategory.id)
      }
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    } finally {
      setLoadingAttribute(false)
    }
  }

  async function importTemplate(templateIndex: number) {
    const template = CATEGORY_TEMPLATES[templateIndex]
    if (!template) return

    if (!confirm(`Vorlage "${template.name}" importieren? Dies erstellt ${template.categories.length} Kategorien mit vordefinierten Attributen.`)) {
      return
    }

    setLoadingTemplate(true)
    setError(null)

    try {
      for (const cat of template.categories) {
        // Create category
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({
            collection_id: collectionId,
            name: cat.name,
            icon: cat.icon,
            sort_order: categories.length,
          })
          .select()
          .single()

        if (catError) {
          setError(`Fehler bei Kategorie ${cat.name}: ${catError.message}`)
          continue
        }

        // Create attributes for this category
        if (newCat && cat.attributes) {
          for (let i = 0; i < cat.attributes.length; i++) {
            const attr = cat.attributes[i]
            await supabase
              .from('attribute_definitions')
              .insert({
                category_id: newCat.id,
                name: attr.name,
                display_name: attr.display_name,
                type: attr.type,
                options: attr.options || {},
                required: false,
                show_in_list: true,
                sort_order: i,
              })
          }
        }
      }

      setSuccess(`Vorlage "${template.name}" erfolgreich importiert!`)
      setShowTemplates(false)
      await loadCategories()
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    } finally {
      setLoadingTemplate(false)
    }
  }

  async function addConditionAttribute() {
    if (!selectedCategory) return

    // Check if zustand already exists
    const existingZustand = attributes.find(a => a.name === 'zustand')
    if (existingZustand) {
      setError('Zustand-Attribut existiert bereits!')
      return
    }

    setLoadingAttribute(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('attribute_definitions')
        .insert({
          category_id: selectedCategory.id,
          name: 'zustand',
          display_name: 'Zustand',
          type: 'select',
          options: {
            choices: ['Mint/Neu', 'Sehr gut', 'Gut', 'Akzeptabel', 'Gebraucht', 'Beschädigt']
          },
          required: false,
          show_in_list: true,
          sort_order: attributes.length,
        })

      if (error) {
        setError(`Fehler: ${error.message}`)
      } else {
        setSuccess('Zustand-Attribut hinzugefügt!')
        await loadAttributes(selectedCategory.id)
      }
    } catch (err: any) {
      setError(`Fehler: ${err.message}`)
    } finally {
      setLoadingAttribute(false)
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
    <div className="p-4 sm:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Kategorien verwalten</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Erstelle Kategorien und definiere ihre Attribute</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kategorien Liste */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-semibold dark:text-white">Kategorien</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
              >
                Vorlagen
              </button>
              <button
                onClick={() => setShowNewCategory(true)}
                className="text-accent-500 hover:text-accent-600 text-sm font-medium"
              >
                + Neue Kategorie
              </button>
            </div>
          </div>

          {/* Templates Modal */}
          {showTemplates && (
            <div className="mb-4 p-4 bg-gradient-to-r from-accent-50 to-purple-50 dark:from-accent-900/30 dark:to-purple-900/30 rounded-lg border border-accent-200 dark:border-accent-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-slate-800 dark:text-white">Vorlagen importieren</h3>
                <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Wähle eine Vorlage um vorkonfigurierte Kategorien mit Attributen zu erstellen:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORY_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => importTemplate(idx)}
                    disabled={loadingTemplate}
                    className="text-left p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/30 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-sm dark:text-white">{template.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{template.categories.length} Kategorien</div>
                  </button>
                ))}
              </div>
              {loadingTemplate && (
                <div className="mt-3 text-center text-sm text-accent-600 dark:text-accent-400">Importiere...</div>
              )}
            </div>
          )}

          {showNewCategory && (
            <form onSubmit={createCategory} className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex gap-2 mb-3">
                <select name="icon" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" defaultValue="📦">
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
                  className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 mb-3">
                <select name="color" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white flex-1">
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.label} value={c.value || ''} style={{ color: c.color }}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select name="parent_id" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white flex-1">
                  <option value="">Keine Oberkategorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingCategory}
                  className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCategory ? 'Erstelle...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-sm dark:text-slate-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}

          {/* Edit Category Modal */}
          {editingCategory && (
            <form onSubmit={updateCategory} className="mb-4 p-4 bg-accent-50 dark:bg-accent-900/30 rounded-lg border border-accent-200 dark:border-accent-800">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Kategorie bearbeiten</span>
                <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  ✕
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <select name="icon" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" defaultValue={editingCategory.icon || '📦'}>
                  {EMOJI_OPTIONS.map(emoji => (
                    <option key={emoji} value={emoji}>{emoji}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                  minLength={1}
                  className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2 mb-3">
                <select name="color" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white flex-1" defaultValue={editingCategory.color || ''}>
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.label} value={c.value || ''} style={{ color: c.color }}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  name="parent_id"
                  className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white flex-1"
                  defaultValue={editingCategory.parent_id || ''}
                >
                  <option value="">Keine Oberkategorie</option>
                  {categories.filter(c => c.id !== editingCategory.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingCategory}
                  className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCategory ? 'Speichere...' : 'Speichern'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-sm dark:text-slate-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}

          {categories.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              Noch keine Kategorien. Erstelle deine erste!
            </p>
          ) : (
            <div className="space-y-2">
              {/* Parent categories first */}
              {categories.filter(c => !c.parent_id).map((cat) => (
                <div key={cat.id}>
                  <div
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory?.id === cat.id
                        ? 'bg-accent-50 dark:bg-accent-900/30 border-2 border-accent-500'
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent'
                    }`}
                    style={cat.color ? { borderLeftColor: cat.color, borderLeftWidth: '4px' } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {cat.color && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      <span className="text-xl">{cat.icon || '📁'}</span>
                      <span className="font-medium dark:text-white">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCategory(cat) }}
                        className="text-slate-400 hover:text-blue-500 p-1"
                        title="Bearbeiten"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Löschen"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* Subcategories */}
                  {categories.filter(sub => sub.parent_id === cat.id).map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedCategory(sub)}
                      className={`flex items-center justify-between p-3 ml-6 mt-1 rounded-lg cursor-pointer transition-colors ${
                        selectedCategory?.id === sub.id
                          ? 'bg-accent-50 dark:bg-accent-900/30 border-2 border-accent-500'
                          : 'bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 border-2 border-transparent'
                      }`}
                      style={sub.color ? { borderLeftColor: sub.color, borderLeftWidth: '4px' } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs">└</span>
                        {sub.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sub.color }}
                          />
                        )}
                        <span className="text-lg">{sub.icon || '📁'}</span>
                        <span className="font-medium text-sm dark:text-white">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingCategory(sub) }}
                          className="text-slate-400 hover:text-blue-500 p-1 text-sm"
                          title="Bearbeiten"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCategory(sub.id) }}
                          className="text-slate-400 hover:text-red-500 p-1 text-sm"
                          title="Löschen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Attribute für gewählte Kategorie */}
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-semibold dark:text-white">
              {selectedCategory ? `Attribute: ${selectedCategory.name}` : 'Attribute'}
            </h2>
            {selectedCategory && (
              <div className="flex gap-2">
                <button
                  onClick={addConditionAttribute}
                  disabled={loadingAttribute || attributes.some(a => a.name === 'zustand')}
                  className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Standard Zustand-Attribut hinzufügen"
                >
                  + Zustand
                </button>
                <button
                  onClick={() => setShowNewAttribute(true)}
                  className="text-accent-500 hover:text-accent-600 text-sm font-medium"
                >
                  + Neues Attribut
                </button>
              </div>
            )}
          </div>

          {!selectedCategory ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              Wähle eine Kategorie aus, um ihre Attribute zu bearbeiten
            </p>
          ) : (
            <>
              {showNewAttribute && (
                <form onSubmit={createAttribute} className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Attribut-Name (z.B. Produktionsjahr)"
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                  <select name="type" required className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white">
                    {ATTRIBUTE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="choices"
                    placeholder="Optionen für Auswahl (komma-getrennt)"
                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 dark:text-slate-300">
                      <input type="checkbox" name="required" className="rounded" />
                      <span className="text-sm">Pflichtfeld</span>
                    </label>
                    <label className="flex items-center gap-2 dark:text-slate-300">
                      <input type="checkbox" name="show_in_list" defaultChecked className="rounded" />
                      <span className="text-sm">In Liste anzeigen</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingAttribute}
                      className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingAttribute ? 'Erstelle...' : 'Erstellen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewAttribute(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-sm dark:text-slate-300"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Attribute Form */}
              {editingAttribute && (
                <form onSubmit={updateAttribute} className="mb-4 p-4 bg-accent-50 dark:bg-accent-900/30 rounded-lg border border-accent-200 dark:border-accent-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Attribut bearbeiten</span>
                    <button type="button" onClick={() => setEditingAttribute(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingAttribute.display_name}
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                  <select
                    name="type"
                    defaultValue={editingAttribute.type}
                    required
                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  >
                    {ATTRIBUTE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="choices"
                    defaultValue={(editingAttribute.options as any)?.choices?.join(', ') || ''}
                    placeholder="Optionen für Auswahl (komma-getrennt)"
                    className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 dark:text-slate-300">
                      <input
                        type="checkbox"
                        name="required"
                        defaultChecked={editingAttribute.required}
                        className="rounded"
                      />
                      <span className="text-sm">Pflichtfeld</span>
                    </label>
                    <label className="flex items-center gap-2 dark:text-slate-300">
                      <input
                        type="checkbox"
                        name="show_in_list"
                        defaultChecked={editingAttribute.show_in_list}
                        className="rounded"
                      />
                      <span className="text-sm">In Liste anzeigen</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loadingAttribute}
                      className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingAttribute ? 'Speichere...' : 'Speichern'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAttribute(null)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-sm dark:text-slate-300"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              )}

              {attributes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  Noch keine Attribute. Diese erscheinen beim Erstellen von Items.
                </p>
              ) : (
                <div className="space-y-2">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div>
                        <span className="font-medium dark:text-white">{attr.display_name}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                          ({ATTRIBUTE_TYPES.find(t => t.value === attr.type)?.label})
                        </span>
                        {attr.required && (
                          <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                            Pflicht
                          </span>
                        )}
                        {attr.show_in_list && (
                          <span className="ml-2 text-xs bg-accent-100 dark:bg-accent-900/50 text-accent-600 dark:text-accent-400 px-2 py-0.5 rounded">
                            Sichtbar
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingAttribute(attr)}
                          className="text-slate-400 hover:text-blue-500 p-1"
                          title="Bearbeiten"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteAttribute(attr.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Löschen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Debug Info */}
      <details className="mt-8 text-xs text-slate-400">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto">
          Collection ID: {collectionId}
          {'\n'}Categories loaded: {categories.length}
          {'\n'}Selected: {selectedCategory?.name || 'none'}
          {'\n'}Attributes: {attributes.length}
        </pre>
      </details>
    </div>
  )
}
