'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface TCGPriceLookupResult {
  cardName: string
  cardId?: string
  setName?: string
  cardNumber?: string
  rawPrice?: {
    min: number
    max: number
    avg: number
    market?: number
    currency: string
  }
  gradedPrice?: {
    estimated: number
    multiplier: number
    currency: string
  }
  source: string
  lastUpdated: string
  message?: string
}

interface TCGPriceLookupButtonProps {
  cardName: string
  setName?: string
  cardNumber?: string
  game?: 'pokemon' | 'yugioh' | 'magic'
  grading?: {
    company: 'PSA' | 'BGS' | 'CGC' | 'SGC'
    grade: string
  }
  onPriceFound: (price: number, result: TCGPriceLookupResult) => void
  className?: string
  disabled?: boolean
}

export function TCGPriceLookupButton({
  cardName,
  setName,
  cardNumber,
  game = 'pokemon',
  grading,
  onPriceFound,
  className = '',
  disabled = false
}: TCGPriceLookupButtonProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const supabase = createClient()

  async function lookupPrice() {
    if (!cardName.trim()) {
      showToast('Bitte gib einen Kartennamen ein', 'error')
      return
    }

    setLoading(true)

    try {
      // Get Supabase URL from environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      const response = await fetch(`${supabaseUrl}/functions/v1/tcg-price-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardName: cardName.trim(),
          setName: setName?.trim(),
          cardNumber: cardNumber?.trim(),
          game: game,
          grading: grading
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Preisabfrage fehlgeschlagen')
      }

      const result: TCGPriceLookupResult = await response.json()

      // Check if we got a price
      if (!result.rawPrice && !result.gradedPrice) {
        showToast(result.message || 'Keine Preisdaten verfügbar', 'warning')
        return
      }

      // Determine which price to use
      let priceToUse = 0
      let message = ''

      if (grading && result.gradedPrice) {
        priceToUse = result.gradedPrice.estimated
        message = `Preis für ${grading.company} ${grading.grade}: ${priceToUse.toFixed(2)} EUR (${result.gradedPrice.multiplier}x Multiplikator)`
      } else if (result.rawPrice) {
        // Use market price if available, otherwise average
        priceToUse = result.rawPrice.market || result.rawPrice.avg
        message = `Marktpreis: ${priceToUse.toFixed(2)} EUR (von pokemontcg.io)`
      }

      if (priceToUse > 0) {
        onPriceFound(priceToUse, result)
        showToast(message, 'success')

        // Log to price history if this is for an existing item
        // Note: The database trigger will automatically log when _computed_value changes
      } else {
        showToast('Keine Preisdaten verfügbar', 'warning')
      }

    } catch (error: any) {
      console.error('TCG Price Lookup Error:', error)
      showToast(error.message || 'Fehler bei Preisabfrage', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={lookupPrice}
      disabled={disabled || loading || !cardName.trim()}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        ${disabled || loading || !cardName.trim()
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
        }
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Preise werden abgerufen...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Preis abfragen</span>
        </>
      )}
    </button>
  )
}

// Price display component to show the result
interface PriceResultDisplayProps {
  result: TCGPriceLookupResult
  onDismiss: () => void
}

export function PriceResultDisplay({ result, onDismiss }: PriceResultDisplayProps) {
  return (
    <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {result.cardName}
            </h4>
            {result.cardNumber && (
              <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                #{result.cardNumber}
              </span>
            )}
          </div>

          {result.setName && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {result.setName}
            </p>
          )}

          {result.rawPrice && (
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Rohpreis:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {result.rawPrice.market?.toFixed(2) || result.rawPrice.avg.toFixed(2)} EUR
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                Min: {result.rawPrice.min.toFixed(2)} EUR • Max: {result.rawPrice.max.toFixed(2)} EUR
              </div>
            </div>
          )}

          {result.gradedPrice && (
            <div className="text-sm pt-2 border-t border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">Graded Preis:</span>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  {result.gradedPrice.estimated.toFixed(2)} EUR
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded text-purple-700 dark:text-purple-300">
                  {result.gradedPrice.multiplier}x
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-500 pt-1">
            Quelle: {result.source}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
