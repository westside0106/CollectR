'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  SUPPORTED_CURRENCIES,
  convertCurrency,
  formatCurrency,
  type CurrencyCode
} from '@/services/currencyService'

export default function CurrencyPage() {
  const [amount, setAmount] = useState(100)
  const [from, setFrom] = useState<CurrencyCode>('EUR')
  const [to, setTo] = useState<CurrencyCode>('USD')
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Array<{ from: CurrencyCode; to: CurrencyCode }>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('currency-favorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const handleConvert = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const converted = await convertCurrency(amount, from, to)
      if (converted !== null) {
        setResult(converted)
      } else {
        setError('Kurs aktuell nicht verfügbar. Bitte später nochmal versuchen.')
      }
    } catch {
      setError('Fehler bei der Währungsumrechnung')
    } finally {
      setLoading(false)
    }
  }, [amount, from, to])

  useEffect(() => {
    if (!mounted) return
    const timer = setTimeout(() => { if (amount > 0) handleConvert() }, 400)
    return () => clearTimeout(timer)
  }, [amount, from, to, handleConvert, mounted])

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  function addFavorite() {
    if (!favorites.some(f => f.from === from && f.to === to)) {
      const updated = [...favorites, { from, to }]
      setFavorites(updated)
      localStorage.setItem('currency-favorites', JSON.stringify(updated))
    }
  }

  function removeFavorite(index: number) {
    const updated = favorites.filter((_, i) => i !== index)
    setFavorites(updated)
    localStorage.setItem('currency-favorites', JSON.stringify(updated))
  }

  const fromSymbol = SUPPORTED_CURRENCIES.find(c => c.code === from)?.symbol ?? from
  const toSymbol = SUPPORTED_CURRENCIES.find(c => c.code === to)?.symbol ?? to

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Gradient Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 dark:from-blue-700 dark:via-cyan-700 dark:to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💱</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Währungsrechner</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base">
            Rechne Kaufpreise blitzschnell um — EZB-Kurse, kostenlos & immer aktuell
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Hauptrechner */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5">

            {/* Betrag */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Betrag
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium text-lg">
                  {fromSymbol}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Von / Swap / Nach */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Von</label>
                <select
                  value={from}
                  onChange={e => setFrom(e.target.value as CurrencyCode)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={swapCurrencies}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center mb-0.5"
                title="Tauschen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nach</label>
                <select
                  value={to}
                  onChange={e => setTo(e.target.value as CurrencyCode)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ergebnis */}
            {error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800">
                {error}
              </div>
            ) : result !== null ? (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {formatCurrency(amount, from)} entspricht
                </div>
                <div className={`text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
                  {toSymbol}{result.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {loading ? 'Wird berechnet...' : `EZB-Kurs, stündlich aktualisiert`}
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse h-24" />
            )}

            {/* Favorit speichern */}
            <button
              onClick={addFavorite}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition text-sm font-medium"
            >
              ⭐ {from} → {to} als Favorit speichern
            </button>
          </div>

          {/* Favoriten + Info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>⭐</span> Favoriten
              </h3>
              {favorites.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">
                  Noch keine Favoriten gespeichert
                </p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((fav, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group transition"
                      onClick={() => { setFrom(fav.from); setTo(fav.to) }}
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                        {fav.from} → {fav.to}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); removeFavorite(index) }}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Powered by frankfurter.app</span><br />
                Europäische Zentralbank · Kein API-Key · 100% kostenlos
              </p>
            </div>
          </div>
        </div>

        {/* Alle Paare Übersicht */}
        {result !== null && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">
              {formatCurrency(amount, from)} in allen Währungen
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUPPORTED_CURRENCIES.filter(c => c.code !== from).map(c => (
                <button
                  key={c.code}
                  onClick={() => setTo(c.code)}
                  className={`p-3 rounded-xl text-left transition border ${
                    to === c.code
                      ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-700/30'
                  }`}
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{c.symbol} {c.code}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{c.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
