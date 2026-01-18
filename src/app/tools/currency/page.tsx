'use client'

import { useState, useEffect } from 'react'
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

  // Favoriten aus localStorage
  const [favorites, setFavorites] = useState<Array<{from: CurrencyCode, to: CurrencyCode}>>([])

  useEffect(() => {
    const saved = localStorage.getItem('currency-favorites')
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }, [])

  async function handleConvert() {
    setLoading(true)
    setError(null)
    
    try {
      const converted = await convertCurrency(amount, from, to)
      if (converted !== null) {
        setResult(converted)
      } else {
        setError('Konvertierung fehlgeschlagen. Bitte prüfe deinen API-Key.')
      }
    } catch (err) {
      setError('Fehler bei der Währungsumrechnung')
    } finally {
      setLoading(false)
    }
  }

  // Auto-convert bei Änderungen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount > 0) {
        handleConvert()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [amount, from, to])

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  function addFavorite() {
    const newFav = { from, to }
    if (!favorites.some(f => f.from === from && f.to === to)) {
      const updated = [...favorites, newFav]
      setFavorites(updated)
      localStorage.setItem('currency-favorites', JSON.stringify(updated))
    }
  }

  function removeFavorite(index: number) {
    const updated = favorites.filter((_, i) => i !== index)
    setFavorites(updated)
    localStorage.setItem('currency-favorites', JSON.stringify(updated))
  }

  function useFavorite(fav: {from: CurrencyCode, to: CurrencyCode}) {
    setFrom(fav.from)
    setTo(fav.to)
  }

  return (
    <div className="p-4 sm:card-padding max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">💱 Währungsrechner</h1>
        <p className="text-slate-500 mt-1">Rechne Kaufpreise zwischen Währungen um</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Hauptrechner */}
        <div className="lg:col-span-2 bg-white rounded-xl card-padding shadow-sm border border-slate-200">
          <div className="space-y-4 sm:space-y-6">
            {/* Betrag */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Betrag
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-2xl rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                min="0"
                step="0.01"
              />
            </div>

            {/* Von / Nach */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Von
                </label>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value as CurrencyCode)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={swapCurrencies}
                className="mt-8 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Währungen tauschen"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nach
                </label>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value as CurrencyCode)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ergebnis */}
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            ) : result !== null ? (
              <div className="card-padding bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-sm text-slate-600 mb-1">
                  {formatCurrency(amount, from)} =
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  {loading ? '...' : formatCurrency(result, to)}
                </div>
              </div>
            ) : null}

            {/* Als Favorit speichern */}
            <button
              onClick={addFavorite}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              ⭐ Als Favorit speichern
            </button>
          </div>
        </div>

        {/* Favoriten */}
        <div className="bg-white rounded-xl card-padding shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">⭐ Favoriten</h3>
          
          {favorites.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              Noch keine Favoriten gespeichert
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer group"
                  onClick={() => useFavorite(fav)}
                >
                  <span className="font-medium">
                    {fav.from} → {fav.to}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFavorite(index)
                    }}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-500">
        <p>
          <strong>Tipp:</strong> Wechselkurse werden stündlich aktualisiert. 
          Powered by currencylayer API.
        </p>
      </div>
    </div>
  )
}
