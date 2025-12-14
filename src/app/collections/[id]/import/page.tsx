'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { parseCSV, parseJSON } from '@/utils/exportImport'

interface MappedField {
  source: string
  target: string
}

const TARGET_FIELDS = [
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
  
  const [fileData, setFileData] = useState<Record<string, string>[]>([])
  const [sourceColumns, setSourceColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<MappedField[]>([])
  
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: 0 })
  const [importedCount, setImportedCount] = useState(0)

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

      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single()
      setCollection(data)
    }
    loadData()
  }, [collectionId])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      
      let parsed: Record<string, string>[]
      if (file.name.endsWith('.json')) {
        parsed = parseJSON(content)
      } else {
        parsed = parseCSV(content)
      }

      if (parsed.length === 0) {
        alert('Datei konnte nicht gelesen werden oder ist leer.')
        return
      }

      setFileData(parsed)
      const columns = Object.keys(parsed[0])
      setSourceColumns(columns)
      
      const autoMappings: MappedField[] = columns.map(col => {
        const colLower = col.toLowerCase()
        let target = ''
        
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

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i]
      
      const itemData: Record<string, any> = {
        collection_id: collectionId,
        status: 'in_collection',
        created_by: userId,  // <-- WICHTIG für RLS!
      }

      mappings.forEach(m => {
        if (m.target && row[m.source]) {
          let value: any = row[m.source]
          
          if (m.target === 'purchase_price') {
            value = parseFloat(value.replace(',', '.')) || null
          }
          
          itemData[m.target] = value
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
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Import</h1>
        <p className="text-slate-500 mt-1">
          {collection?.name} – Items aus CSV oder JSON importieren
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
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
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <span className="text-6xl mb-4 block">📄</span>
          <h2 className="text-xl font-semibold mb-2">Datei auswählen</h2>
          <p className="text-slate-500 mb-6">CSV oder JSON Datei mit deinen Items</p>
          
          <label className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={!userId}
              className="sr-only"
            />
            Datei auswählen
          </label>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Unterstützte Formate:</p>
            <ul className="text-slate-500 space-y-1">
              <li>• CSV (Semikolon oder Komma getrennt)</li>
              <li>• JSON (Array von Objekten)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Spalten zuordnen</h2>
          <p className="text-slate-500 mb-6">
            {fileData.length} Einträge gefunden. Ordne die Spalten den Feldern zu.
          </p>

          <div className="space-y-3 mb-6">
            {mappings.map(m => (
              <div key={m.source} className="flex items-center gap-4">
                <div className="w-1/3 p-3 bg-slate-50 rounded-lg text-sm font-mono truncate">
                  {m.source}
                </div>
                <span className="text-slate-400">→</span>
                <select
                  value={m.target}
                  onChange={(e) => updateMapping(m.source, e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
            <p className="text-red-500 text-sm mb-4">
              ⚠️ Mindestens "Name" muss zugeordnet werden
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Zurück
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canProceed()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Weiter zur Vorschau
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Vorschau</h2>
          <p className="text-slate-500 mb-6">
            {fileData.length} Items werden importiert
          </p>

          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
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
                        {row[m.source] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fileData.length > 5 && (
            <p className="text-slate-400 text-sm mb-6">
              ... und {fileData.length - 5} weitere
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('mapping')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Zurück
            </button>
            <button
              onClick={startImport}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              🚀 {fileData.length} Items importieren
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <span className="text-6xl mb-4 block animate-bounce">⏳</span>
          <h2 className="text-xl font-semibold mb-2">Importiere...</h2>
          <p className="text-slate-500 mb-6">
            {importProgress.current} von {importProgress.total}
          </p>
          
          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
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
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-xl font-semibold mb-2">Import abgeschlossen!</h2>
          <p className="text-slate-500 mb-6">
            {importedCount} Items erfolgreich importiert
            {importProgress.errors > 0 && (
              <span className="text-orange-500">
                , {importProgress.errors} Fehler
              </span>
            )}
          </p>
          
          <Link
            href={`/collections/${collectionId}`}
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700"
          >
            Zur Sammlung
          </Link>
        </div>
      )}
    </div>
  )
}
