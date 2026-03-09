'use client'

import { useState, useEffect } from 'react'
import {
  getCollectibleMarketData,
  formatPrice,
  formatChange,
  formatMarketCap,
  type AssetQuote
} from '@/services/marketService'
import { PortfolioTab } from '@/components/portfolio/PortfolioTab'

type MarketView = 'all' | 'precious' | 'digital'
type MainTab = 'markt' | 'portfolio'

export default function MarketPage() {
  const [quotes, setQuotes] = useState<AssetQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedView, setSelectedView] = useState<MarketView>('all')
  const [activeTab, setActiveTab] = useState<MainTab>('markt')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function loadMarketData() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCollectibleMarketData()
      setQuotes(data)
      setLastUpdate(new Date())
    } catch {
      setError('Fehler beim Laden der Marktdaten')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      loadMarketData()
      const interval = setInterval(loadMarketData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [mounted])

  const filteredQuotes = quotes.filter(q => {
    if (selectedView === 'all') return true
    if (selectedView === 'precious') {
      return q.name.toLowerCase().includes('gold') || q.name.toLowerCase().includes('silber')
    }
    return !q.name.toLowerCase().includes('gold') && !q.name.toLowerCase().includes('silber')
  })

  if (!mounted) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-6" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {/* Haupt-Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">📈 Markt</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Kurse & dein Portfolio</p>
        </div>
        {activeTab === 'markt' && (
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-slate-400">{lastUpdate.toLocaleTimeString('de-DE')}</span>
            )}
            <button
              onClick={loadMarketData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition"
              title="Aktualisieren"
            >
              🔄
            </button>
          </div>
        )}
      </div>

      {/* Haupt-Tabs: Markt | Portfolio */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('markt')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'markt'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📊 Marktübersicht
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'portfolio'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          💼 Mein Portfolio
        </button>
      </div>

      {/* Marktübersicht Tab */}
      {activeTab === 'markt' && (
        <>
          <div className="flex gap-2 mb-5">
            {(['all', 'precious', 'digital'] as const).map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {view === 'all' ? 'Alle' : view === 'precious' ? '🪙 Edelmetalle' : '💎 Digital'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {loading && quotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="space-y-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-500 dark:text-slate-400">Keine Marktdaten verfügbar</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {filteredQuotes.map((quote, index) => {
                const change = formatChange(quote.change24h, quote.changePercent24h)
                return (
                  <div
                    key={quote.id}
                    className={`flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                      index !== filteredQuotes.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {quote.image && (
                        <img src={quote.image} alt={quote.name} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{quote.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {quote.symbol} · MCap: {formatMarketCap(quote.marketCap)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {formatPrice(quote.price)}
                      </div>
                      <div className={`text-sm font-medium ${
                        change.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        change.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                      }`}>
                        {change.text}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Warum diese Werte?</strong>
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              💰 Gold & Silber (tokenisiert) für Münzsammler<br />
              🎮 Bitcoin, Ethereum & Gaming-Token für digitale Sammlerstücke & NFTs
            </p>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Powered by CoinGecko API (kostenlos, kein API-Key nötig)
          </p>
        </>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && <PortfolioTab />}
    </div>
  )
}
