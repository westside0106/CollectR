'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { parseCSV, parseJSON } from '@/utils/exportImport'
import { autoCreateAttributeDefinitions } from '@/lib/autoCreateAttributes'

interface MappedField {
  source: string
  target: string
}

interface AttributeDefinition {
  id: string
  name: string
  display_name: string
  type: string
  category_id: string
}

const BASE_TARGET_FIELDS = [
  { value: '', label: '-- Nicht importieren --' },
  { value: 'name', label: 'Name *', required: true },
  { value: 'description', label: 'Beschreibung' },
  { value: 'status', label: 'Status' },
  { value: 'purchase_price', label: 'Kaufpreis' },
  { value: 'purchase_currency', label: 'Währung' },
  { value: 'purchase_date', label: 'Kaufdatum' },
  { value: 'purchase_location', label: 'Gekauft bei' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'notes', label: 'Notizen' },
]

export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [collection, setCollection] = useState<any>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload')

  const [fileData, setFileData] = useState<Record<string, unknown>[]>([])
  const [sourceColumns, setSourceColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<MappedField[]>([])

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0 })
  const [importedCount, setImportedCount] = useState(0)

  // Kategorie-Attribute
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [autoCreateAttrs, setAutoCreateAttrs] = useState(true) // Auto-create new attributes

  // Dynamische Target-Fields (Basis + Attribute + Neues Attribut)
  const TARGET_FIELDS = [
    ...BASE_TARGET_FIELDS,
    ...attributes.map(attr => ({
      value: `attr:${attr.name}`,
      label: `📋 ${attr.display_name}`,
    })),
    { value: 'new_attr', label: '✨ Neues Attribut erstellen' }
  ]

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
      const { data: collectionData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single()
      setCollection(collectionData)

      // Kategorien der Sammlung laden
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('collection_id', collectionId)
        .order('sort_order')

      if (catData && catData.length > 0) {
        setCategories(catData)
        setSelectedCategoryId(catData[0].id)
      }
    }
    loadData()
  }, [collectionId])

  // Attribute laden wenn Kategorie gewählt
  useEffect(() => {
    async function loadAttributes() {
      if (!selectedCategoryId) {
        setAttributes([])
        return
      }

      const { data } = await supabase
        .from('attribute_definitions')
        .select('id, name, display_name, type, category_id')
        .eq('category_id', selectedCategoryId)
        .order('sort_order')

      if (data) {
        setAttributes(data)
      }
    }
    loadAttributes()
  }, [selectedCategoryId])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // File validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_ROWS = 5000 // Prevent DOS attacks
    const ALLOWED_TYPES = ['text/csv', 'application/json', 'text/plain']

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('Datei zu groß. Maximale Größe: 10MB')
      return
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(csv|json)$/i)) {
      alert('Ungültiger Dateityp. Erlaubt sind nur CSV und JSON Dateien.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string

      // Validate content size (after reading)
      if (content.length > MAX_FILE_SIZE) {
        alert('Dateiinhalt zu groß')
        return
      }

      let parsed: Record<string, unknown>[]
      if (file.name.endsWith('.json')) {
        parsed = parseJSON(content)
      } else {
        parsed = parseCSV(content)
      }

      if (parsed.length === 0) {
        alert('Datei konnte nicht gelesen werden oder ist leer.')
        return
      }

      // Limit number of rows
      if (parsed.length > MAX_ROWS) {
        alert(`Zu viele Zeilen. Maximum: ${MAX_ROWS}. Gefunden: ${parsed.length}`)
        return
      }

      setFileData(parsed)
      const columns = Object.keys(parsed[0])
      setSourceColumns(columns)
      
      const autoMappings: MappedField[] = columns.map(col => {
        const colLower = col.toLowerCase().replace(/[_\-\s]+/g, '')
        let target = ''

        // Standard-Felder
        if (colLower.includes('name') || colLower.includes('titel') || colLower.includes('bezeichnung')) {
          target = 'name'
        } else if (colLower.includes('beschreibung') || colLower.includes('description')) {
          target = 'description'
        } else if (colLower.includes('preis') || colLower.includes('price') || colLower.includes('kosten')) {
          target = 'purchase_price'
        } else if (colLower.includes('datum') || colLower.includes('date')) {
          target = 'purchase_date'
        } else if (colLower.includes('barcode') || colLower.includes('ean') || colLower.includes('upc')) {
          target = 'barcode'
        } else if (colLower.includes('notiz') || colLower.includes('note') || colLower.includes('kommentar')) {
          target = 'notes'
        } else if (colLower.includes('status')) {
          target = 'status'
        } else if (colLower.includes('ort') || colLower.includes('location') || colLower.includes('gekauft')) {
          target = 'purchase_location'
        } else {
          // Versuche Attribut zu matchen
          const matchingAttr = attributes.find(attr => {
            const attrLower = attr.name.toLowerCase().replace(/[_\-\s]+/g, '')
            const displayLower = attr.display_name.toLowerCase().replace(/[_\-\s]+/g, '')
            return colLower === attrLower || colLower === displayLower ||
                   colLower.includes(attrLower) || attrLower.includes(colLower)
          })
          if (matchingAttr) {
            target = `attr:${matchingAttr.name}`
          }
        }

        return { source: col, target }
      })
      
      setMappings(autoMappings)
      setStep('mapping')
    }
    reader.readAsText(file)
  }

  function updateMapping(source: string, target: string) {
    setMappings(mappings.map(m => 
      m.source === source ? { ...m, target } : m
    ))
  }

  function canProceed() {
    return mappings.some(m => m.target === 'name')
  }

  async function startImport() {
    if (!userId) {
      alert('Nicht eingeloggt')
      return
    }

    setStep('importing')
    setImportProgress({ current: 0, total: fileData.length, errors: 0 })

    // Step 0: Auto-create attributes for "new_attr" mappings
    const newAttrMappings = mappings.filter(m => m.target === 'new_attr')
    const createdAttrNames: Record<string, string> = {} // source -> attrName mapping

    if (newAttrMappings.length > 0 && selectedCategoryId) {
      // Build sample values from first row to infer types
      const sampleRow = fileData[0]
      const sampleAttributes: Record<string, unknown> = {}

      newAttrMappings.forEach(m => {
        sampleAttributes[m.source] = sampleRow[m.source]
      })

      // Create the attributes
      await autoCreateAttributeDefinitions(supabase, selectedCategoryId, sampleAttributes)

      // Refresh attributes list
      const { data: refreshedAttrs } = await supabase
        .from('attribute_definitions')
        .select('id, name, display_name, type, category_id')
        .eq('category_id', selectedCategoryId)
        .order('sort_order')

      if (refreshedAttrs) {
        setAttributes(refreshedAttrs)

        // Map source columns to created attribute names
        newAttrMappings.forEach(m => {
          // Convert source column name to attribute name format
          const attrName = m.source.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          createdAttrNames[m.source] = attrName
        })
      }
    }

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i]

      const itemData: Record<string, any> = {
        collection_id: collectionId,
        status: 'in_collection',
        created_by: userId,
        category_id: selectedCategoryId,
        attributes: {},
      }

      mappings.forEach(m => {
        if (m.target && row[m.source]) {
          let value: any = row[m.source]

          // Sanitize input: Convert to string and limit length
          if (typeof value === 'string') {
            value = value.trim().substring(0, 10000) // Max 10k chars per field
          }

          // Prüfen ob es ein Attribut ist (attr:xxx)
          if (m.target.startsWith('attr:')) {
            const attrName = m.target.replace('attr:', '')
            const attrDef = attributes.find(a => a.name === attrName)

            // Typ-Konvertierung
            if (attrDef) {
              if (attrDef.type === 'number') {
                const stringValue = String(value).replace(',', '.')
                value = parseFloat(stringValue) || null
              } else if (attrDef.type === 'checkbox') {
                const stringValue = String(value).toLowerCase()
                value = ['ja', 'yes', 'true', '1', 'x'].includes(stringValue)
              }
            }

            itemData.attributes[attrName] = value
          } else if (m.target === 'new_attr') {
            // Use the auto-created attribute name
            const attrName = createdAttrNames[m.source]
            if (attrName) {
              itemData.attributes[attrName] = value
            }
          } else {
            // Standard-Felder
            if (m.target === 'purchase_price') {
              const stringValue = String(value).replace(',', '.')
              value = parseFloat(stringValue) || null
            }
            itemData[m.target] = value
          }
        }
      })

      if (!itemData.name) {
        errorCount++
        continue
      }

      const { error } = await supabase.from('items').insert(itemData)

      if (error) {
        errorCount++
      } else {
        successCount++
      }

      setImportProgress({
        current: i + 1,
        total: fileData.length,
        errors: errorCount
      })
    }

    setImportedCount(successCount)
    setStep('done')
  }

  return (
    <div className="container-responsive max-w-3xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-xs sm:text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Import</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          {collection?.name} – Items aus CSV oder JSON importieren
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto">
        {['upload', 'mapping', 'preview', 'done'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-blue-600 text-white' :
              ['upload', 'mapping', 'preview', 'importing', 'done'].indexOf(step) > i 
                ? 'bg-green-500 text-white' 
                : 'bg-slate-200 text-slate-500'
            }`}>
              {['upload', 'mapping', 'preview', 'importing', 'done'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            {i < 3 && <div className="w-12 h-0.5 bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl card-padding shadow-sm border border-slate-200 dark:border-slate-700 text-center">
          <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block">📄</span>
          <h2 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white">Datei auswählen</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">CSV oder JSON Datei mit deinen Items</p>

          <label className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer touch-manipulation select-none min-h-[56px] min-w-[200px] flex items-center justify-center">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={!userId}
              className="hidden"
            />
            Datei auswählen
          </label>

          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 rounded-lg text-left text-xs sm:text-sm">
            <p className="font-medium mb-2 dark:text-white">Unterstützte Formate:</p>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1">
              <li>• CSV (Semikolon oder Komma getrennt)</li>
              <li>• JSON (Array von Objekten)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spalten zuordnen</h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
            {fileData.length} Einträge gefunden. Ordne die Spalten den Feldern zu.
          </p>

          {/* Kategorie-Auswahl */}
          {categories.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Kategorie für Import
              </label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {attributes.length > 0 && (
                <p className="text-blue-600 text-sm mt-2">
                  {attributes.length} Attribute verfügbar (mit 📋 markiert)
                </p>
              )}
            </div>
          )}

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {mappings.map(m => (
              <div key={m.source} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="w-full sm:w-1/3 p-2 sm:p-3 bg-slate-50 rounded-lg text-xs sm:text-sm font-mono truncate">
                  {m.source}
                </div>
                <span className="hidden sm:inline text-slate-400">→</span>
                <select
                  value={m.target}
                  onChange={(e) => updateMapping(m.source, e.target.value)}
                  className="flex-1 w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {TARGET_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {!canProceed() && (
            <p className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4">
              ⚠️ Mindestens "Name" muss zugeordnet werden
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setStep('upload')}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Zurück
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canProceed()}
              className="flex-1 bg-blue-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Weiter zur Vorschau
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Vorschau</h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
            {fileData.length} Items werden importiert
          </p>

          <div className="border rounded-lg overflow-x-auto mb-4 sm:mb-6">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {mappings.filter(m => m.target).map(m => (
                    <th key={m.target} className="px-4 py-2 text-left font-medium text-slate-600">
                      {TARGET_FIELDS.find(f => f.value === m.target)?.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fileData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    {mappings.filter(m => m.target).map(m => (
                      <td key={m.target} className="px-4 py-2 truncate max-w-[200px]">
                        {String(row[m.source] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fileData.length > 5 && (
            <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">
              ... und {fileData.length - 5} weitere
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Zurück
            </button>
            <button
              onClick={startImport}
              className="flex-1 bg-green-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-green-700"
            >
              🚀 {fileData.length} Items importieren
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200 text-center">
          <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block animate-bounce">⏳</span>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Importiere...</h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
            {importProgress.current} von {importProgress.total}
          </p>

          <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3 mb-3 sm:mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>

          {importProgress.errors > 0 && (
            <p className="text-orange-500 text-sm">
              {importProgress.errors} Fehler
            </p>
          )}
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200 text-center">
          <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block">🎉</span>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Import abgeschlossen!</h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
            {importedCount} Items erfolgreich importiert
            {importProgress.errors > 0 && (
              <span className="text-orange-500">
                , {importProgress.errors} Fehler
              </span>
            )}
          </p>

          <Link
            href={`/collections/${collectionId}`}
            className="inline-block bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-xl font-semibold hover:bg-blue-700"
          >
            Zur Sammlung
          </Link>
        </div>
      )}
    </div>
  )
}
