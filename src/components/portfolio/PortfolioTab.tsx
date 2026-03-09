'use client'

import { useState, useEffect, useCallback } from 'react'
import { AddHoldingModal } from './AddHoldingModal'
import type { PortfolioHolding, CreateHoldingPayload } from '@/app/api/portfolio/holdings/route'

interface PriceData {
  price: number
  change24h?: number
  currency: string
}

interface PricesResponse {
  stocks: Record<string, { price: number; change: number; changePercent: number; currency: string } | null>
  cryptos: Record<string, { price: number; change24h: number; currency: string }>
  alphaVantageConfigured: boolean
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function PortfolioTab() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [prices, setPrices] = useState<PricesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadHoldings() {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio/holdings')
      if (!res.ok) throw new Error('Fehler')
      const data: PortfolioHolding[] = await res.json()
      setHoldings(data)
    } catch {
      setError('Holdings konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  const loadPrices = useCallback(async (currentHoldings: PortfolioHolding[]) => {
    if (currentHoldings.length === 0) return
    setPricesLoading(true)

    const stocks = currentHoldings.filter(h => h.type === 'stock').map(h => h.ticker).join(',')
    const cryptos = currentHoldings
      .filter(h => h.type === 'crypto' && h.coingecko_id)
      .map(h => h.coingecko_id)
      .join(',')

    if (!stocks && !cryptos) { setPricesLoading(false); return }

    try {
      const params = new URLSearchParams()
      if (stocks) params.set('stocks', stocks)
      if (cryptos) params.set('cryptos', cryptos)
      const res = await fetch(`/api/portfolio/prices?${params}`)
      if (res.ok) setPrices(await res.json())
    } finally {
      setPricesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHoldings()
  }, [])

  useEffect(() => {
    if (!loading) loadPrices(holdings)
  }, [holdings, loading, loadPrices])

  async function handleSave(payload: CreateHoldingPayload) {
    const res = await fetch('/api/portfolio/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Speichern fehlgeschlagen')
    await loadHoldings()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/portfolio/holdings?id=${id}`, { method: 'DELETE' })
      if (res.ok) setHoldings(prev => prev.filter(h => h.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  // Aktuellen Preis + Change für eine Position ermitteln
  function getPriceData(holding: PortfolioHolding): PriceData | null {
    if (!prices) return null

    if (holding.type === 'stock') {
      const data = prices.stocks[holding.ticker]
      if (!data) return null
      return { price: data.price, change24h: data.changePercent, currency: 'USD' }
    } else {
      const cgId = holding.coingecko_id
      if (!cgId) return null
      const data = prices.cryptos[cgId]
      if (!data) return null
      return { price: data.price, change24h: data.change24h, currency: 'EUR' }
    }
  }

  // Aktuellen Gesamtwert berechnen
  function getCurrentValue(holding: PortfolioHolding, priceData: PriceData | null): number | null {
    if (!priceData) return null

    if (holding.quantity != null) {
      return holding.quantity * priceData.price
    } else if (holding.invested_amount != null && holding.purchase_price != null) {
      // Investierter Betrag / Kaufkurs = Anzahl Einheiten
      const impliedQty = holding.invested_amount / holding.purchase_price
      return impliedQty * priceData.price
    }
    return null
  }

  // P&L berechnen
  function getPnL(holding: PortfolioHolding, currentValue: number | null): { amount: number; percent: number } | null {
    if (currentValue == null) return null

    let costBasis: number | null = null
    if (holding.quantity != null && holding.purchase_price != null) {
      costBasis = holding.quantity * holding.purchase_price
    } else if (holding.invested_amount != null) {
      costBasis = holding.invested_amount
    }

    if (costBasis == null || costBasis === 0) return null

    const amount = currentValue - costBasis
    const percent = (amount / costBasis) * 100
    return { amount, percent }
  }

  // Portfolio-Summen
  const totalInvested = holdings.reduce((sum, h) => {
    if (h.quantity != null && h.purchase_price != null) return sum + h.quantity * h.purchase_price
    if (h.invested_amount != null) return sum + h.invested_amount
    return sum
  }, 0)

  const totalCurrentValue = holdings.reduce((sum, h) => {
    const pd = getPriceData(h)
    const cv = getCurrentValue(h, pd)
    return cv != null ? sum + cv : sum
  }, 0)

  const totalPnL = totalCurrentValue > 0 ? totalCurrentValue - totalInvested : 0

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-slate-100 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mein Portfolio</h2>
          {!prices?.alphaVantageConfigured && holdings.some(h => h.type === 'stock') && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              ⚠ ALPHA_VANTAGE_API_KEY nicht konfiguriert — Aktienpreise nicht verfügbar
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
        >
          + Position
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Portfolio Übersicht */}
      {holdings.length > 0 && totalInvested > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Investiert</div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm">
              {formatCurrency(totalInvested)}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Aktuell {pricesLoading && '⟳'}</div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm">
              {totalCurrentValue > 0 ? formatCurrency(totalCurrentValue) : '—'}
            </div>
          </div>
          <div className={`rounded-xl p-3 text-center ${totalPnL >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">P&L</div>
            <div className={`font-semibold text-sm ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalCurrentValue > 0 ? formatCurrency(totalPnL) : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Holdings Liste */}
      {holdings.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">Noch keine Positionen</p>
          <p className="text-sm mt-1">Füge Aktien und Krypto-Positionen hinzu</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
          >
            + Erste Position hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {holdings.map((holding, index) => {
            const priceData = getPriceData(holding)
            const currentValue = getCurrentValue(holding, priceData)
            const pnl = getPnL(holding, currentValue)

            return (
              <div
                key={holding.id}
                className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                  index !== holdings.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    holding.type === 'crypto' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  }`}>
                    {holding.type === 'crypto' ? '₿' : '📈'}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{holding.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>{holding.ticker}</span>
                      {holding.quantity != null && <span>· {holding.quantity} Stk.</span>}
                      {holding.invested_amount != null && !holding.quantity && (
                        <span>· {formatCurrency(holding.invested_amount, holding.currency)} investiert</span>
                      )}
                    </div>
                    {holding.notes && (
                      <div className="text-xs text-slate-400 truncate max-w-36">{holding.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {priceData ? (
                      <>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {currentValue != null ? formatCurrency(currentValue, priceData.currency) : formatCurrency(priceData.price, priceData.currency)}
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          {priceData.change24h != null && (
                            <span className={`text-xs font-medium ${priceData.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatPercent(priceData.change24h)}
                            </span>
                          )}
                          {pnl && (
                            <span className={`text-xs ${pnl.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              ({formatPercent(pnl.percent)})
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {pricesLoading ? '⟳' : 'kein Kurs'}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(holding.id)}
                    disabled={deletingId === holding.id}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-40"
                    title="Position entfernen"
                  >
                    {deletingId === holding.id ? '⟳' : '🗑'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AddHoldingModal onClose={() => setShowAddModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
