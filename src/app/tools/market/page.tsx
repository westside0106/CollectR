'use client'

import { useState, useEffect } from 'react'
import { 
  getStockPrice,
  getMultipleStockPrices,
  formatStockPrice,
  formatChange,
  COLLECTIBLE_RELATED_SYMBOLS,
  type StockQuote
} from '@/services/marketService'

// Alle verfügbaren Symbole
const ALL_SYMBOLS = [
  { key: 'gold', symbol: 'GLD', name: 'Gold (ETF)', category: 'Edelmetalle' },
  { key: 'silver', symbol: 'SLV', name: 'Silber (ETF)', category: 'Edelmetalle' },
  { key: 'mattel', symbol: 'MAT', name: 'Mattel (Hot Wheels)', category: 'Spielzeug' },
  { key: 'hasbro', symbol: 'HAS', name: 'Hasbro', category: 'Spielzeug' },
  { key: 'funko', symbol: 'FNKO', name: 'Funko (Pop!)', category: 'Spielzeug' },
  { key: 'lvmh', symbol: 'MC.XPAR', name: 'LVMH (Luxus)', category: 'Luxus' },
  { key: 'richemont', symbol: 'CFR.XSWX', name: 'Richemont (Uhren)', category: 'Luxus' },
]

export default function MarketPage() {
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Einstellungen
  const [showSettings, setShowSettings] = useState(false)
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['GLD', 'SLV', 'MAT', 'FNKO'])

  // Einstellungen laden
  useEffect(() => {
    const saved = localStorage.getItem('market-symbols')
    if (saved) {
      setSelectedSymbols(JSON.parse(saved))
    }
  }, [])

  async function loadMarketData() {
    if (selectedSymbols.length === 0) {
      setQuotes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await getMultipleStockPrices(selectedSymbols)
      setQuotes(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Fehler beim Laden der Marktdaten. Bitte prüfe deinen API-Key.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketData()
    
    // Auto-refresh alle 5 Minuten
    const interval = setInterval(loadMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedSymbols])

  function toggleSymbol(symbol: string) {
    const updated = selectedSymbols.includes(symbol)
      ? selectedSymbols.filter(s => s !== symbol)
      : [...selectedSymbols, symbol]
    
    setSelectedSymbols(updated)
    localStorage.setItem('market-symbols', JSON.stringify(updated))
  }

  // Gruppiere nach Kategorie
  const groupedSymbols = ALL_SYMBOLS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof ALL_SYMBOLS>)

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📈 Marktnews</h1>
          <p className="text-slate-500 mt-1">Kurse relevanter Aktien & ETFs für Sammler</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-sm text-slate-400">
              {lastUpdate.toLocaleTimeString('de-DE')}
            </span>
          )}
          <button
            onClick={loadMarketData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Aktualisieren"
          >
            🔄
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`}
            title="Einstellungen"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Einstellungen */}
      {showSettings && (
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">⚙️ Angezeigte Werte</h3>
          
          <div className="space-y-4">
            {Object.entries(groupedSymbols).map(([category, items]) => (
              <div key={category}>
                <p className="text-sm font-medium text-slate-500 mb-2">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <button
                      key={item.symbol}
                      onClick={() => toggleSymbol(item.symbol)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSymbols.includes(item.symbol)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* Kurse */}
      {loading && quotes.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex justify-between p-4 bg-slate-50 rounded-lg">
                <div className="h-5 bg-slate-200 rounded w-32"></div>
                <div className="h-5 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">Keine Werte ausgewählt.</p>
          <button
            onClick={() => setShowSettings(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Einstellungen öffnen →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {quotes.map((quote, index) => {
            const change = formatChange(quote.change, quote.changePercent)
            const symbolInfo = ALL_SYMBOLS.find(s => s.symbol === quote.symbol)
            
            return (
              <div
                key={quote.symbol}
                className={`flex items-center justify-between p-5 ${
                  index !== quotes.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {symbolInfo?.name || quote.symbol}
                  </div>
                  <div className="text-sm text-slate-500">{quote.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">
                    {formatStockPrice(quote.price)}
                  </div>
                  <div className={`text-sm font-medium ${
                    change.color === 'green' ? 'text-green-600' :
                    change.color === 'red' ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {change.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-500">
        <p>
          <strong>Warum diese Werte?</strong><br />
          Gold/Silber für Münzsammler • Mattel für Hot Wheels • 
          Funko für Pop! Figuren • Luxusmarken für Uhren & Schmuck
        </p>
        <p className="mt-2">
          Kursdaten von marketstack (End-of-Day). Updates alle 5 Minuten.
        </p>
      </div>
    </div>
  )
}
