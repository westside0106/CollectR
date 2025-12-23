'use client'

import { useState, useEffect } from 'react'
import { 
  getCollectibleMarketData,
  formatPrice,
  formatChange,
  formatMarketCap,
  type AssetQuote
} from '@/services/marketService'

interface MarketTickerProps {
  autoRefresh?: boolean
  refreshInterval?: number // in ms
}

export function MarketTicker({
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 Minuten
}: MarketTickerProps) {
  const [quotes, setQuotes] = useState<AssetQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedView, setSelectedView] = useState<'precious' | 'digital'>('precious')

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
    loadMarketData()

    if (autoRefresh) {
      const interval = setInterval(loadMarketData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Filter basierend auf View
  const filteredQuotes = quotes.filter(q => {
    if (selectedView === 'precious') {
      return q.name.includes('Gold') || q.name.includes('Silber')
    }
    return !q.name.includes('Gold') && !q.name.includes('Silber')
  })

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📈 Marktnews</h3>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              {lastUpdate.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
          <button
            onClick={loadMarketData}
            disabled={loading}
            className="text-sm hover:bg-slate-100 p-1 rounded disabled:opacity-50 transition"
            title="Aktualisieren"
          >
            🔄
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedView('precious')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
            selectedView === 'precious'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🪙 Edelmetalle
        </button>
        <button
          onClick={() => setSelectedView('digital')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
            selectedView === 'digital'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          💎 Spielzeug
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {loading && quotes.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : filteredQuotes.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          Keine Marktdaten verfügbar
        </p>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map(quote => {
            const change = formatChange(quote.change24h, quote.changePercent24h)
            return (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-3">
                  {quote.image && (
                    <img 
                      src={quote.image} 
                      alt={quote.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium text-slate-900">{quote.name}</div>
                    <div className="text-xs text-slate-500">
                      {quote.symbol} · MCap: {formatMarketCap(quote.marketCap)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(quote.price)}
                  </div>
                  <div className={`text-sm ${
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

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-900">
          <strong>Kurse relevanter Aktien & ETFs für Sammler</strong>
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {selectedView === 'precious' 
            ? '💰 Gold & Silber wichtig für Münzsammler'
            : '🎮 Mattel (Hot Wheels), Hasbro & Funko als Spielzeughersteller'
          }
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Powered by CoinGecko API (Free Tier: 30 calls/min)
      </p>
    </div>
  )
}
