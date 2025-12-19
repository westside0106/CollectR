'use client'

import { useState, useEffect } from 'react'
import { 
  getCollectibleMarketData,
  formatStockPrice,
  formatChange,
  type StockQuote
} from '@/services/marketService'

interface MarketTickerProps {
  autoRefresh?: boolean
  refreshInterval?: number // in ms
}

export function MarketTicker({
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 Minuten
}: MarketTickerProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📈 Markt-Ticker</h3>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Aktualisiert: {lastUpdate.toLocaleTimeString('de-DE')}
            </span>
          )}
          <button
            onClick={loadMarketData}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {loading && quotes.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex justify-between">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          Keine Marktdaten verfügbar
        </p>
      ) : (
        <div className="space-y-3">
          {quotes.map(quote => {
            const change = formatChange(quote.change, quote.changePercent)
            return (
              <div
                key={quote.symbol}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-slate-900">{quote.name}</div>
                  <div className="text-xs text-slate-500">{quote.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatStockPrice(quote.price)}
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

      {/* Relevanz-Hinweis */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          <strong>Warum diese Werte?</strong><br />
          Gold/Silber: Wichtig für Münzsammler<br />
          Mattel: Hot Wheels Hersteller<br />
          Funko: Pop! Figuren Hersteller
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Powered by marketstack
      </p>
    </div>
  )
}
