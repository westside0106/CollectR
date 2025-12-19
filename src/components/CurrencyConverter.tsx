'use client'

import { useState, useEffect } from 'react'
import { 
  SUPPORTED_CURRENCIES, 
  convertCurrency, 
  formatCurrency,
  type CurrencyCode 
} from '@/services/currencyService'

interface CurrencyConverterProps {
  initialAmount?: number
  initialFrom?: CurrencyCode
  initialTo?: CurrencyCode
  onConvert?: (result: { amount: number, from: CurrencyCode, to: CurrencyCode, converted: number }) => void
}

export function CurrencyConverter({
  initialAmount = 100,
  initialFrom = 'EUR',
  initialTo = 'USD',
  onConvert
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState(initialAmount)
  const [from, setFrom] = useState<CurrencyCode>(initialFrom)
  const [to, setTo] = useState<CurrencyCode>(initialTo)
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    setLoading(true)
    setError(null)
    
    try {
      const converted = await convertCurrency(amount, from, to)
      if (converted !== null) {
        setResult(converted)
        onConvert?.({ amount, from, to, converted })
      } else {
        setError('Konvertierung fehlgeschlagen')
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-4">💱 Währungsrechner</h3>
      
      <div className="space-y-4">
        {/* Betrag */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Betrag
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            min="0"
            step="0.01"
          />
        </div>

        {/* Von / Nach */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Von
            </label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as CurrencyCode)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
            className="mt-6 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Währungen tauschen"
          >
            ⇄
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nach
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as CurrencyCode)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        ) : result !== null ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-slate-600">
              {formatCurrency(amount, from)} =
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : formatCurrency(result, to)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
