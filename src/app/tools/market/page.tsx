'use client'

import { useState, useEffect } from 'react'
import { 
  getCollectibleMarketData,
  formatPrice,
  formatChange,
  formatMarketCap,
  type AssetQuote
} from '@/services/marketService'

export default function MarketPage() {
  const [quotes, setQuotes] = useState<AssetQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedView, setSelectedView] = useState<'all' | 'precious' | 'digital'>('all')
  const [mounted, setMounted] = useState(false)

  // Hydration fix - erst nach Mount rendern
  useEffect(() => {
    setMounted(true)
  }, [])

  async function loadMarketData() {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getCollectibleMarketData()
      setQuotes(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError('Fehler beim Laden der Marktdaten')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      loadMarketData()
      
      // Auto-refresh alle 5 Minuten
      const interval = setInterval(loadMarketData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [mounted])

  // Filter basierend auf View
  const filteredQuotes = quotes.filter(q => {
    if (selectedView === 'all') return true
    if (selectedView === 'precious') {
      return q.name.toLowerCase().includes('gold') || q.name.toLowerCase().includes('silber')
    }
    return !q.name.toLowerCase().includes('gold') && !q.name.toLowerCase().includes('silber')
  })

  // Verhindere Hydration Mismatch
  if (!mounted) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📈 Marktübersicht</h1>
          <p className="text-slate-500 mt-1">Kurse relevanter Assets für Sammler</p>
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
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedView === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setSelectedView('precious')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedView === 'precious'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🪙 Edelmetalle
        </button>
        <button
          onClick={() => setSelectedView('digital')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedView === 'digital'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          💎 Digital
        </button>
      </div>

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
              <div key={i} className="animate-pulse flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">Keine Marktdaten verfügbar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredQuotes.map((quote, index) => {
            const change = formatChange(quote.change24h, quote.changePercent24h)
            
            return (
              <div
                key={quote.id}
                className={`flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition ${
                  index !== filteredQuotes.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {quote.image && (
                    <img 
                      src={quote.image} 
                      alt={quote.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900">{quote.name}</div>
                    <div className="text-sm text-slate-500">
                      {quote.symbol} · MCap: {formatMarketCap(quote.marketCap)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">
                    {formatPrice(quote.price)}
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
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-900">
          <strong>Warum diese Werte?</strong>
        </p>
        <p className="text-sm text-blue-700 mt-1">
          💰 Gold & Silber (tokenisiert) für Münzsammler<br />
          🎮 Bitcoin, Ethereum & Gaming-Token für digitale Sammlerstücke & NFTs
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Powered by CoinGecko API (kostenlos, kein API-Key nötig)
      </p>
    </div>
  )
}