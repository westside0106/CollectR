'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PriceHistoryEntry {
  id: string
  price_value: number
  price_currency: string
  price_source: string | null
  created_at: string
  price_change: number | null
  price_change_percent: number | null
}

interface PriceHistoryChartProps {
  itemId: string
  itemName: string
}

export function PriceHistoryChart({ itemId, itemName }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [itemId])

  async function loadHistory() {
    try {
      const { data, error } = await supabase
        .from('item_price_history_view')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setHistory(data || [])
    } catch (error) {
      console.error('Failed to load price history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Preisverlauf
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Noch keine Preisentwicklung verfügbar. Aktualisiere den Preis, um die Historie zu starten.
        </p>
      </div>
    )
  }

  // Calculate statistics
  const latestPrice = history[0]?.price_value || 0
  const oldestPrice = history[history.length - 1]?.price_value || 0
  const totalChange = latestPrice - oldestPrice
  const totalChangePercent = oldestPrice > 0 ? ((totalChange / oldestPrice) * 100).toFixed(1) : '0'
  const maxPrice = Math.max(...history.map(h => h.price_value))
  const minPrice = Math.min(...history.map(h => h.price_value))

  // Prepare data for simple chart (last 10 entries)
  const displayHistory = showAll ? history : history.slice(0, 10)
  const chartData = [...displayHistory].reverse()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Preisverlauf
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-normal">
          {history.length} Einträge
        </span>
      </h3>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Aktuell</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {latestPrice.toFixed(2)} €
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Veränderung</p>
          <p className={`text-lg font-bold ${totalChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)} €
            <span className="text-xs ml-1">({totalChange >= 0 ? '+' : ''}{totalChangePercent}%)</span>
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Maximum</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {maxPrice.toFixed(2)} €
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Minimum</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {minPrice.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Simple Line Chart */}
      <div className="mb-6">
        <div className="relative h-40 flex items-end gap-1">
          {chartData.map((entry, index) => {
            const heightPercent = ((entry.price_value - minPrice) / (maxPrice - minPrice)) * 100
            const isLatest = index === chartData.length - 1

            return (
              <div
                key={entry.id}
                className="flex-1 group relative"
              >
                <div
                  className={`w-full rounded-t transition-all duration-200 ${
                    isLatest
                      ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                      : 'bg-gradient-to-t from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{entry.price_value.toFixed(2)} €</div>
                    <div className="text-slate-300 dark:text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    {entry.price_change !== null && (
                      <div className={entry.price_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {entry.price_change >= 0 ? '+' : ''}{entry.price_change.toFixed(2)} €
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            )
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{new Date(chartData[0]?.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(chartData[chartData.length - 1]?.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Historie</h4>
          {history.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAll ? 'Weniger anzeigen' : `Alle ${history.length} anzeigen`}
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {displayHistory.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {entry.price_value.toFixed(2)} {entry.price_currency}
                  </span>
                  {entry.price_change !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.price_change >= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {entry.price_change >= 0 ? '+' : ''}{entry.price_change.toFixed(2)} €
                      {entry.price_change_percent && ` (${entry.price_change_percent}%)`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>
                    {new Date(entry.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {entry.price_source && (
                    <>
                      <span>•</span>
                      <span>{entry.price_source}</span>
                    </>
                  )}
                </div>
              </div>

              {index === 0 && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                  Aktuell
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
