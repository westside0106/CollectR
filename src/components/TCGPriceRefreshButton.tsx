'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { TCGPriceLookupButton, PriceResultDisplay } from '@/components/TCGPriceLookupButton'

interface TCGPriceRefreshButtonProps {
  itemId: string
  itemName: string
  attributes: Record<string, any>
  currentValue: number | null
  onPriceUpdated?: () => void
}

export function TCGPriceRefreshButton({
  itemId,
  itemName,
  attributes,
  currentValue,
  onPriceUpdated
}: TCGPriceRefreshButtonProps) {
  const [priceResult, setPriceResult] = useState<any | null>(null)
  const [autoRefreshing, setAutoRefreshing] = useState(false)
  const { showToast } = useToast()
  const supabase = createClient()

  // Auto-refresh on mount if price is older than 7 days or not set
  useEffect(() => {
    async function checkAndRefresh() {
      // Only auto-refresh if we have grading attribute
      if (!attributes || !attributes.grading) {
        return
      }

      // Check if we should auto-refresh
      // For now, let's not auto-refresh on every page load to avoid excessive API calls
      // User can manually click the button
    }

    checkAndRefresh()
  }, [itemId])

  async function handlePriceUpdate(price: number, result: any) {
    try {
      // Update item in database
      const { error } = await supabase
        .from('items')
        .update({ _computed_value: price })
        .eq('id', itemId)

      if (error) throw error

      setPriceResult(result)
      showToast(`Preis aktualisiert: ${price.toFixed(2)} EUR`, 'success')

      if (onPriceUpdated) {
        onPriceUpdated()
      }

      // Reload page after 2 seconds to show updated value
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Failed to update price:', error)
      showToast('Fehler beim Speichern des Preises', 'error')
    }
  }

  // Extract card info
  const setName = attributes?.set || attributes?.edition || ''
  const cardNumber = attributes?.card_number || attributes?.number || ''
  const grading = attributes?.grading && typeof attributes.grading === 'object'
    ? {
        company: attributes.grading.company,
        grade: attributes.grading.grade
      }
    : undefined

  // Only show button for items with grading
  if (!attributes || !attributes.grading) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <TCGPriceLookupButton
          cardName={itemName}
          setName={setName}
          cardNumber={cardNumber}
          grading={grading}
          onPriceFound={handlePriceUpdate}
          className="flex-shrink-0"
        />

        {currentValue && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Aktueller Wert: <span className="font-semibold">{currentValue.toFixed(2)} EUR</span>
          </div>
        )}
      </div>

      {priceResult && (
        <PriceResultDisplay
          result={priceResult}
          onDismiss={() => setPriceResult(null)}
        />
      )}
    </div>
  )
}
