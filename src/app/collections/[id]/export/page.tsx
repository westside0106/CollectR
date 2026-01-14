'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import { exportToCSV, exportToJSON } from '@/utils/exportImport'

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = use(params)
  const supabase = createClient()

  const [collection, setCollection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Export Options
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [includeImages, setIncludeImages] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      const { data: col } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single()

      if (col) setCollection(col)

      const { data: itemsData } = await supabase
        .from('items')
        .select('*, item_images(*)')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false })

      if (itemsData) setItems(itemsData)
      setLoading(false)
    }
    loadData()
  }, [collectionId])

  const filteredItems = selectedStatus
    ? items.filter(i => i.status === selectedStatus)
    : items

  async function handleExport() {
    setExporting(true)

    const filename = `${collection?.name || 'sammlung'}-${new Date().toISOString().split('T')[0]}`

    if (format === 'csv') {
      exportToCSV(filteredItems, filename)
    } else {
      exportToJSON(filteredItems, filename)
    }

    setExporting(false)
  }

  if (loading) {
    return <div className="p-8">Laden...</div>
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Export</h1>
        <p className="text-slate-500 mt-1">
          {collection?.name} – {filteredItems.length} Items exportieren
        </p>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Format
          </label>
          <div className="flex gap-4">
            <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              format === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
                className="sr-only"
              />
              <span className="text-2xl block mb-2">📊</span>
              <span className="font-semibold">CSV</span>
              <p className="text-xs text-slate-500 mt-1">Für Excel, Google Sheets</p>
            </label>
            <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              format === 'json' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
                className="sr-only"
              />
              <span className="text-2xl block mb-2">📦</span>
              <span className="font-semibold">JSON</span>
              <p className="text-xs text-slate-500 mt-1">Für Backup, Entwickler</p>
            </label>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status filtern
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Alle Status ({items.length} Items)</option>
            <option value="in_collection">📦 In Sammlung ({items.filter(i => i.status === 'in_collection').length})</option>
            <option value="for_sale">🏪 Zu verkaufen ({items.filter(i => i.status === 'for_sale').length})</option>
            <option value="wishlist">⭐ Wunschliste ({items.filter(i => i.status === 'wishlist').length})</option>
            <option value="sold">💰 Verkauft ({items.filter(i => i.status === 'sold').length})</option>
            <option value="ordered">📬 Bestellt ({items.filter(i => i.status === 'ordered').length})</option>
          </select>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vorschau (erste 5 Items)
          </label>
          <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-auto">
            {filteredItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex justify-between py-1 text-sm">
                <span className="truncate">{item.name}</span>
                <span className="text-slate-400 ml-4">
                  {item.purchase_price ? `${item.purchase_price}€` : '-'}
                </span>
              </div>
            ))}
            {filteredItems.length > 5 && (
              <p className="text-slate-400 text-sm mt-2">
                ... und {filteredItems.length - 5} weitere
              </p>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting || filteredItems.length === 0}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {exporting ? (
            'Exportiere...'
          ) : (
            <>
              <span>📥</span>
              <span>
                {filteredItems.length} Items als {format.toUpperCase()} exportieren
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
