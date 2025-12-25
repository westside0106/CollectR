'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Preset-Definitionen für verschiedene Sammlungstypen
const COLLECTION_PRESETS = [
  {
    id: 'custom',
    name: 'Leer (Eigene Kategorien)',
    icon: '📁',
    description: 'Starte ohne vordefinierte Kategorien',
    categories: []
  },
  {
    id: 'hot-wheels',
    name: 'Hot Wheels / Modellautos',
    icon: '🚗',
    description: 'Für Modellauto-Sammlungen',
    categories: [
      {
        name: 'Modellauto',
        icon: '🚗',
        attributes: [
          { name: 'Jahr', type: 'number', options: { min: 1968, max: 2030 } },
          { name: 'Serie', type: 'text' },
          { name: 'Farbe', type: 'text' },
          { name: 'Treasure Hunt', type: 'checkbox' },
          { name: 'Verpackung', type: 'select', options: { choices: ['OVP (Blister)', 'Lose', 'Beschädigt', 'Unbekannt'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'coins',
    name: 'Münzen',
    icon: '🪙',
    description: 'Für Münzsammlungen',
    categories: [
      {
        name: 'Münze',
        icon: '🪙',
        attributes: [
          { name: 'Land', type: 'text' },
          { name: 'Jahr', type: 'number', options: { min: 0, max: 2030 } },
          { name: 'Nominal', type: 'text' },
          { name: 'Material', type: 'select', options: { choices: ['Gold', 'Silber', 'Kupfer', 'Bronze', 'Nickel', 'Zink', 'Bimetall', 'Sonstige'] } },
          { name: 'Erhaltung', type: 'select', options: { choices: ['PP (Polierte Platte)', 'ST (Stempelglanz)', 'VZ (Vorzüglich)', 'SS (Sehr schön)', 'S (Schön)', 'SGE (Sehr gut erhalten)', 'GE (Gut erhalten)'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'stamps',
    name: 'Briefmarken',
    icon: '📮',
    description: 'Für Briefmarkensammlungen',
    categories: [
      {
        name: 'Briefmarke',
        icon: '📮',
        attributes: [
          { name: 'Land', type: 'text' },
          { name: 'Jahr', type: 'number', options: { min: 1840, max: 2030 } },
          { name: 'Motiv', type: 'text' },
          { name: 'Zustand', type: 'select', options: { choices: ['Postfrisch', 'Ungebraucht mit Falz', 'Gestempelt', 'Auf Brief', 'Beschädigt'] } },
          { name: 'Katalognummer', type: 'text' },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'antiques',
    name: 'Antiquitäten',
    icon: '🏺',
    description: 'Für antike Gegenstände',
    categories: [
      {
        name: 'Antiquität',
        icon: '🏺',
        attributes: [
          { name: 'Epoche', type: 'select', options: { choices: ['Antike', 'Mittelalter', 'Renaissance', 'Barock', 'Rokoko', 'Klassizismus', 'Biedermeier', 'Jugendstil', 'Art Déco', '20. Jahrhundert', 'Unbekannt'] } },
          { name: 'Material', type: 'text' },
          { name: 'Herkunft', type: 'text' },
          { name: 'Zustand', type: 'select', options: { choices: ['Neuwertig', 'Sehr gut', 'Gut', 'Akzeptabel', 'Restaurierungsbedürftig'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'vinyl',
    name: 'Vinyl / Schallplatten',
    icon: '💿',
    description: 'Für Schallplattensammlungen',
    categories: [
      {
        name: 'Schallplatte',
        icon: '💿',
        attributes: [
          { name: 'Künstler', type: 'text' },
          { name: 'Jahr', type: 'number', options: { min: 1900, max: 2030 } },
          { name: 'Label', type: 'text' },
          { name: 'Zustand Vinyl', type: 'select', options: { choices: ['Mint (M)', 'Near Mint (NM)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good (G)', 'Fair (F)', 'Poor (P)'] } },
          { name: 'Zustand Cover', type: 'select', options: { choices: ['Mint (M)', 'Near Mint (NM)', 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good (G)', 'Fair (F)', 'Poor (P)'] } },
          { name: 'Pressung', type: 'text' },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'ceramics',
    name: 'Keramik',
    icon: '🍶',
    description: 'Für Keramiksammlungen',
    categories: [
      {
        name: 'Keramik',
        icon: '🍶',
        attributes: [
          { name: 'Marke', type: 'text' },
          { name: 'Land', type: 'text' },
          { name: 'Epoche', type: 'select', options: { choices: ['Antike', 'Mittelalter', 'Renaissance', 'Barock', '18. Jahrhundert', '19. Jahrhundert', '20. Jahrhundert', 'Modern', 'Unbekannt'] } },
          { name: 'Technik', type: 'select', options: { choices: ['Steingut', 'Steinzeug', 'Porzellan', 'Fayence', 'Majolika', 'Terrakotta', 'Sonstige'] } },
          { name: 'Zustand', type: 'select', options: { choices: ['Neuwertig', 'Sehr gut', 'Gut', 'Akzeptabel', 'Beschädigt', 'Restauriert'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'glass',
    name: 'Glas',
    icon: '🥃',
    description: 'Für Glassammlungen (Uranglas, etc.)',
    categories: [
      {
        name: 'Glas',
        icon: '🥃',
        attributes: [
          { name: 'Glasart', type: 'select', options: { choices: ['Uranglas', 'Manganglas', 'Eisenoxidglas', 'Bleikristall', 'Pressglas', 'Mundgeblasen', 'Milchglas', 'Sonstige'] } },
          { name: 'Fluoresziert unter UV', type: 'checkbox' },
          { name: 'Jahr', type: 'number', options: { min: 1700, max: 2030 } },
          { name: 'Herkunft', type: 'text' },
          { name: 'Zustand', type: 'select', options: { choices: ['Neuwertig', 'Sehr gut', 'Gut', 'Kleine Chips', 'Beschädigt', 'Restauriert'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'watches',
    name: 'Uhren',
    icon: '⌚',
    description: 'Für Uhrensammlungen',
    categories: [
      {
        name: 'Uhr',
        icon: '⌚',
        attributes: [
          { name: 'Marke', type: 'text' },
          { name: 'Modell', type: 'text' },
          { name: 'Jahr', type: 'number', options: { min: 1800, max: 2030 } },
          { name: 'Uhrwerk', type: 'select', options: { choices: ['Automatik', 'Handaufzug', 'Quarz', 'Solar', 'Kinetic', 'Sonstige'] } },
          { name: 'Gehäusematerial', type: 'select', options: { choices: ['Edelstahl', 'Gold', 'Titan', 'Keramik', 'Kunststoff', 'Sonstige'] } },
          { name: 'Zustand', type: 'select', options: { choices: ['Neuwertig', 'Sehr gut', 'Gut', 'Gebrauchsspuren', 'Defekt'] } },
          { name: 'Box & Papiere', type: 'checkbox' },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'books',
    name: 'Bücher / Erstausgaben',
    icon: '📚',
    description: 'Für Buchsammlungen',
    categories: [
      {
        name: 'Buch',
        icon: '📚',
        attributes: [
          { name: 'Autor', type: 'text' },
          { name: 'Erscheinungsjahr', type: 'number', options: { min: 1400, max: 2030 } },
          { name: 'Verlag', type: 'text' },
          { name: 'Auflage', type: 'text' },
          { name: 'Erstausgabe', type: 'checkbox' },
          { name: 'Signiert', type: 'checkbox' },
          { name: 'Zustand', type: 'select', options: { choices: ['Neuwertig', 'Sehr gut', 'Gut', 'Akzeptabel', 'Stark gebraucht'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  },
  {
    id: 'lego',
    name: 'LEGO',
    icon: '🧱',
    description: 'Für LEGO-Sammlungen',
    categories: [
      {
        name: 'LEGO Set',
        icon: '🧱',
        attributes: [
          { name: 'Set-Nummer', type: 'text' },
          { name: 'Jahr', type: 'number', options: { min: 1949, max: 2030 } },
          { name: 'Thema', type: 'text' },
          { name: 'Teileanzahl', type: 'number' },
          { name: 'Zustand', type: 'select', options: { choices: ['MISB (Neu, versiegelt)', 'NIB (Neu, offen)', 'Komplett mit Anleitung', 'Komplett ohne Anleitung', 'Unvollständig'] } },
          { name: 'Weitere Besonderheiten', type: 'text', options: { multiline: true } }
        ]
      }
    ]
  }
]

export default function NewCollectionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }
    getUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setError('')

    try {
      // 1. Collection erstellen
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          name,
          description,
          owner_id: userId
        })
        .select()
        .single()

      if (collectionError) throw collectionError

      // 2. Wenn Preset gewählt, Kategorien und Attribute erstellen
      const preset = COLLECTION_PRESETS.find(p => p.id === selectedPreset)
      if (preset && preset.categories.length > 0) {
        for (let i = 0; i < preset.categories.length; i++) {
          const cat = preset.categories[i]

          // Kategorie erstellen
          const { data: category, error: catError } = await supabase
            .from('categories')
            .insert({
              collection_id: collection.id,
              name: cat.name,
              icon: cat.icon,
              sort_order: i
            })
            .select()
            .single()

          if (catError) {
            console.error('Error creating category:', catError)
            continue
          }

          // Attribute für diese Kategorie erstellen
          if (cat.attributes && cat.attributes.length > 0) {
            const attributeInserts = cat.attributes.map((attr, idx) => ({
              category_id: category.id,
              name: attr.name.toLowerCase().replace(/\s+/g, '_').replace(/[äöüß]/g, c =>
                ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c] || c)),
              display_name: attr.name,
              type: attr.type,
              options: attr.options || {},
              required: false,
              show_in_list: idx < 3, // Erste 3 in Liste anzeigen
              sort_order: idx
            }))

            const { error: attrError } = await supabase
              .from('attribute_definitions')
              .insert(attributeInserts)

            if (attrError) {
              console.error('Error creating attributes:', attrError)
            }
          }
        }
      }

      router.push(`/collections/${collection.id}`)
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">📦 CollectR</Link>
          <span className="text-gray-400">/</span>
          <Link href="/collections" className="text-gray-600 hover:text-gray-900">Sammlungen</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Neu</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Neue Sammlung erstellen</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Meine Hot Wheels Sammlung"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional: Beschreibe deine Sammlung..."
            />
          </div>

          {/* Preset-Auswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vorlage (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLLECTION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{preset.icon}</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{preset.name}</div>
                </button>
              ))}
            </div>
            {selectedPreset !== 'custom' && (
              <p className="mt-3 text-sm text-gray-500">
                {COLLECTION_PRESETS.find(p => p.id === selectedPreset)?.description}
                {' '}Kategorien und Attribute werden automatisch erstellt.
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !name}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Sammlung erstellen'}
            </button>
            <Link
              href="/collections"
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
