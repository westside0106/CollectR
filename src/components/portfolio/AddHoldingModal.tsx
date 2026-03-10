'use client'

import { useState } from 'react'
import type { CreateHoldingPayload, HoldingType } from '@/app/api/portfolio/holdings/route'

// Beliebte Kryptowährungen für Schnellauswahl
const POPULAR_CRYPTOS = [
  { id: 'bitcoin', ticker: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', ticker: 'ETH', name: 'Ethereum' },
  { id: 'solana', ticker: 'SOL', name: 'Solana' },
  { id: 'binancecoin', ticker: 'BNB', name: 'BNB' },
  { id: 'ripple', ticker: 'XRP', name: 'XRP' },
  { id: 'cardano', ticker: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', ticker: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', ticker: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', ticker: 'LINK', name: 'Chainlink' },
  { id: 'avalanche-2', ticker: 'AVAX', name: 'Avalanche' },
]

interface Props {
  onClose: () => void
  onSave: (payload: CreateHoldingPayload) => Promise<void>
}

export function AddHoldingModal({ onClose, onSave }: Props) {
  const [type, setType] = useState<HoldingType>('crypto')
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [coingeckoId, setCoingeckoId] = useState('')
  const [amountMode, setAmountMode] = useState<'quantity' | 'invested'>('quantity')
  const [quantity, setQuantity] = useState('')
  const [investedAmount, setInvestedAmount] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectCrypto(crypto: typeof POPULAR_CRYPTOS[0]) {
    setTicker(crypto.ticker)
    setName(crypto.name)
    setCoingeckoId(crypto.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!ticker.trim() || !name.trim()) {
      setError('Ticker und Name sind Pflichtfelder')
      return
    }

    if (amountMode === 'quantity' && !quantity) {
      setError('Bitte Anzahl Anteile eingeben')
      return
    }
    if (amountMode === 'invested' && !investedAmount) {
      setError('Bitte investierten Betrag eingeben')
      return
    }

    setSaving(true)

    const payload: CreateHoldingPayload = {
      type,
      ticker: ticker.trim().toUpperCase(),
      name: name.trim(),
      currency,
      notes: notes.trim() || undefined,
    }

    if (type === 'crypto' && coingeckoId) {
      payload.coingecko_id = coingeckoId
    }

    if (amountMode === 'quantity') {
      payload.quantity = parseFloat(quantity)
    } else {
      payload.invested_amount = parseFloat(investedAmount)
    }

    if (purchasePrice) {
      payload.purchase_price = parseFloat(purchasePrice)
    }

    try {
      await onSave(payload)
      onClose()
    } catch {
      setError('Fehler beim Speichern. Bitte versuche es erneut.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Position hinzufügen</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Typ: Aktie oder Crypto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Art</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setType('crypto'); setTicker(''); setName(''); setCoingeckoId('') }}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${type === 'crypto' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                ₿ Krypto
              </button>
              <button type="button" onClick={() => { setType('stock'); setCoingeckoId('') }}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${type === 'stock' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                📈 Aktie
              </button>
            </div>
          </div>

          {/* Crypto Schnellauswahl */}
          {type === 'crypto' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Schnellauswahl</label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CRYPTOS.map(c => (
                  <button key={c.id} type="button" onClick={() => selectCrypto(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      ticker === c.ticker ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}>
                    {c.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ticker + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {type === 'stock' ? 'Ticker (z.B. AAPL)' : 'Symbol'}
              </label>
              <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder={type === 'stock' ? 'AAPL' : 'BTC'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder={type === 'stock' ? 'Apple Inc.' : 'Bitcoin'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CoinGecko ID für unbekannte Cryptos */}
          {type === 'crypto' && !POPULAR_CRYPTOS.find(c => c.ticker === ticker) && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                CoinGecko ID <span className="text-slate-400">(für Preisabfrage, z.B. "bitcoin")</span>
              </label>
              <input value={coingeckoId} onChange={e => setCoingeckoId(e.target.value.toLowerCase())}
                placeholder="z.B. pepe, dogwifhat..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Betrag: Anteile vs. Investiert */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Eingabe als</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button type="button" onClick={() => setAmountMode('quantity')}
                className={`py-2 rounded-xl text-sm font-medium transition ${amountMode === 'quantity' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                Anteile / Coins
              </button>
              <button type="button" onClick={() => setAmountMode('invested')}
                className={`py-2 rounded-xl text-sm font-medium transition ${amountMode === 'invested' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                Investiert (€)
              </button>
            </div>

            {amountMode === 'quantity' ? (
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder="z.B. 0.5 oder 10"
                step="any" min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input type="number" value={investedAmount} onChange={e => setInvestedAmount(e.target.value)}
                placeholder="z.B. 500.00"
                step="any" min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Kaufkurs (optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Kaufkurs pro Einheit <span className="text-slate-400">(optional, für P&L)</span>
            </label>
            <div className="flex gap-2">
              <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)}
                placeholder="z.B. 42000"
                step="any" min="0"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>EUR</option>
                <option>USD</option>
                <option>GBP</option>
              </select>
            </div>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notizen <span className="text-slate-400">(optional)</span></label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="z.B. DCA Position, Cold Storage..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition">
              {saving ? 'Speichern...' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
