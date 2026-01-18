'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'
import { BarcodeScanner } from '@/components/BarcodeScanner'

interface ScannedItem {
  barcode: string
  name: string
  saved: boolean
}

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: collectionId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
  const [currentBarcode, setCurrentBarcode] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [collection, setCollection] = useState<any>(null)

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
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single()
      setCollection(data)
    }
    loadData()
  }, [collectionId])

  function handleScan(code: string) {
    setCurrentBarcode(code)
    setShowScanner(false)
    
    const existing = scannedItems.find(i => i.barcode === code)
    if (existing) {
      alert(`Barcode ${code} wurde bereits gescannt!`)
      return
    }
  }

  async function saveItem() {
    if (!itemName.trim()) {
      alert('Bitte einen Namen eingeben')
      return
    }

    if (!userId) {
      alert('Nicht eingeloggt')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('items').insert({
      collection_id: collectionId,
      name: itemName,
      barcode: currentBarcode,
      purchase_price: itemPrice ? parseFloat(itemPrice) : null,
      status: 'in_collection',
      created_by: userId,  // <-- WICHTIG für RLS!
    })

    if (!error) {
      setScannedItems([...scannedItems, {
        barcode: currentBarcode,
        name: itemName,
        saved: true,
      }])
      setCurrentBarcode('')
      setItemName('')
      setItemPrice('')
    } else {
      alert('Fehler: ' + error.message)
    }

    setSaving(false)
  }

  function skipItem() {
    setScannedItems([...scannedItems, {
      barcode: currentBarcode,
      name: 'Übersprungen',
      saved: false,
    }])
    setCurrentBarcode('')
    setItemName('')
    setItemPrice('')
  }

  return (
    <div className="container-responsive max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href={`/collections/${collectionId}`}
          className="text-slate-500 hover:text-slate-700 text-xs sm:text-sm flex items-center gap-1 mb-2"
        >
          ← Zurück zur Sammlung
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Schnell-Erfassung</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          {collection?.name || 'Sammlung'} – Scanne Barcodes für schnelles Hinzufügen
        </p>
      </div>

      {/* Scanner Button oder aktiver Scan */}
      {!currentBarcode ? (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200 text-center mb-4 sm:mb-6">
          <span className="text-5xl sm:text-6xl mb-3 sm:mb-4 block">📷</span>
          <button
            onClick={() => setShowScanner(true)}
            disabled={!userId}
            className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Barcode scannen
          </button>
          <p className="text-slate-400 text-xs sm:text-sm mt-3 sm:mt-4">
            Oder manuell eingeben:
          </p>
          <input
            type="text"
            placeholder="Barcode eingeben..."
            className="mt-2 px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg text-center w-full max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement
                if (input.value) {
                  handleScan(input.value)
                  input.value = ''
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 rounded-lg">
            <span className="text-xl sm:text-2xl">✅</span>
            <div>
              <p className="text-sm sm:text-base font-semibold text-green-700">Barcode erkannt</p>
              <p className="font-mono text-xs sm:text-sm text-green-600">{currentBarcode}</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="z.B. '67 Camaro"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Kaufpreis (€)
              </label>
              <input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={saveItem}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Speichere...' : '💾 Speichern & Weiter'}
              </button>
              <button
                onClick={skipItem}
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Überspringen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gescannte Items */}
      {scannedItems.length > 0 && (
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            Gescannt ({scannedItems.filter(i => i.saved).length} gespeichert)
          </h2>
          <div className="space-y-2">
            {scannedItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                  item.saved ? 'bg-green-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-medium truncate ${item.saved ? 'text-green-700' : 'text-slate-400'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs font-mono text-slate-400 truncate">{item.barcode}</p>
                </div>
                {item.saved ? (
                  <span className="text-green-600 ml-2">✓</span>
                ) : (
                  <span className="text-slate-400 ml-2">–</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
