'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface TCGItem {
  id: string
  name: string
  attributes: Record<string, any>
  _computed_value: number | null
}

interface BulkUpdateProgress {
  total: number
  current: number
  updated: number
  failed: number
  currentCard?: string
}

interface TCGBulkPriceUpdateProps {
  collectionId: string
  onComplete?: () => void
}

export function TCGBulkPriceUpdate({ collectionId, onComplete }: TCGBulkPriceUpdateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<BulkUpdateProgress | null>(null)
  const { showToast } = useToast()
  const supabase = createClient()

  async function startBulkUpdate() {
    setLoading(true)
    setProgress({ total: 0, current: 0, updated: 0, failed: 0 })

    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        showToast('Bitte melde dich an, um Preise zu aktualisieren', 'error')
        setLoading(false)
        setProgress(null)
        return
      }

      // 1. Fetch all TCG items (items with grading attribute)
      const { data: items, error: fetchError } = await supabase
        .from('items')
        .select('id, name, attributes, _computed_value')
        .eq('collection_id', collectionId)
        .eq('status', 'in_collection') // Only items in collection

      if (fetchError) throw fetchError

      // Filter items that have grading attribute
      const tcgItems: TCGItem[] = (items || []).filter(
        item => item.attributes && 'grading' in item.attributes
      )

      if (tcgItems.length === 0) {
        showToast('Keine Trading Cards gefunden', 'info')
        setLoading(false)
        setProgress(null)
        return
      }

      setProgress({ total: tcgItems.length, current: 0, updated: 0, failed: 0 })

      // 2. Update each item
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      let updated = 0
      let failed = 0

      for (let i = 0; i < tcgItems.length; i++) {
        const item = tcgItems[i]

        setProgress(prev => prev ? { ...prev, current: i + 1, currentCard: item.name } : null)

        try {
          // Extract card info from attributes
          const grading = item.attributes.grading
          const setName = item.attributes.set || item.attributes.edition || ''
          const cardNumber = item.attributes.card_number || item.attributes.number || ''

          // Call price lookup function
          const response = await fetch(`${supabaseUrl}/functions/v1/tcg-price-lookup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              cardName: item.name,
              setName: setName,
              cardNumber: cardNumber,
              game: 'pokemon',
              grading: grading && typeof grading === 'object' ? {
                company: grading.company,
                grade: grading.grade
              } : undefined
            })
          })

          if (!response.ok) {
            console.error(`Failed to fetch price for ${item.name}`)
            failed++
            continue
          }

          const result = await response.json()

          // Determine price to use
          let priceToUse = 0
          if (grading && result.gradedPrice) {
            priceToUse = result.gradedPrice.estimated
          } else if (result.rawPrice) {
            priceToUse = result.rawPrice.market || result.rawPrice.avg
          }

          if (priceToUse > 0) {
            // Update item in database
            const { error: updateError } = await supabase
              .from('items')
              .update({ _computed_value: priceToUse })
              .eq('id', item.id)

            if (updateError) {
              console.error(`Failed to update ${item.name}:`, updateError)
              failed++
            } else {
              updated++
            }
          } else {
            failed++
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))

        } catch (error) {
          console.error(`Error processing ${item.name}:`, error)
          failed++
        }

        setProgress(prev => prev ? { ...prev, updated, failed } : null)
      }

      // 3. Show completion message
      if (updated > 0) {
        showToast(`${updated} von ${tcgItems.length} Preisen aktualisiert!`, 'success')
      } else {
        showToast('Keine Preise aktualisiert', 'info')
      }

      if (onComplete) {
        onComplete()
      }

    } catch (error: any) {
      console.error('Bulk update error:', error)
      showToast(error.message || 'Fehler beim Aktualisieren', 'error')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setProgress(null)
        setIsOpen(false)
      }, 3000)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>TCG Preise aktualisieren</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          TCG Preise aktualisieren
        </h3>

        {!loading && !progress ? (
          <>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Möchtest du die Preise aller Trading Cards in dieser Collection aktualisieren?
              Dies kann einige Minuten dauern.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={startBulkUpdate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200"
              >
                Jetzt aktualisieren
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {progress && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Fortschritt</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>

                {progress.currentCard && loading && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
                    Aktualisiere: <span className="font-medium">{progress.currentCard}</span>
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progress.updated}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Aktualisiert</div>
                  </div>

                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {progress.failed}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">Fehlgeschlagen</div>
                  </div>
                </div>

                {!loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setProgress(null)
                      setIsOpen(false)
                    }}
                    className="w-full mt-4 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                  >
                    Schließen
                  </button>
                )}
              </>
            )}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
