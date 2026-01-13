'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { GradingValue } from '@/components/GradingInput'

interface TCGCard {
  id: string
  name: string
  collection_id: string
  collection_name: string
  category_name: string
  thumbnail: string | null
  images: string[]
  grading: GradingValue | string | null
  estimated_value: number | null
}

const GRADING_COMPANY_COLORS: Record<string, string> = {
  PSA: '#ef4444',  // red
  BGS: '#3b82f6',  // blue
  CGC: '#f97316',  // orange
  SGC: '#22c55e',  // green
}

export function TCGHighlightsTile() {
  const supabase = createClient()
  const [cards, setCards] = useState<TCGCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTCGCards()
  }, [])

  async function loadTCGCards() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get all items from user's collections with TCG categories
      const { data: items, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          thumbnail,
          images,
          attributes,
          estimated_value,
          collection_id,
          category_id,
          collections!inner(
            id,
            name,
            owner_id
          ),
          categories(
            name
          )
        `)
        .eq('collections.owner_id', user.id)
        .eq('status', 'in_collection')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading TCG cards:', error)
        setLoading(false)
        return
      }

      // Filter for items with grading attribute & TCG-related categories
      const tcgCards: TCGCard[] = (items || [])
        .map((item: any) => {
          const grading = item.attributes?.grading
          const categoryName = item.categories?.name || ''

          // Check if this is a TCG card (has grading OR category name suggests TCG)
          const isTCG = grading ||
                        categoryName.toLowerCase().includes('pokémon') ||
                        categoryName.toLowerCase().includes('pokemon') ||
                        categoryName.toLowerCase().includes('yu-gi-oh') ||
                        categoryName.toLowerCase().includes('magic') ||
                        categoryName.toLowerCase().includes('mtg') ||
                        categoryName.toLowerCase().includes('trading')

          if (!isTCG || !grading) return null

          return {
            id: item.id,
            name: item.name,
            collection_id: item.collection_id,
            collection_name: item.collections.name,
            category_name: categoryName,
            thumbnail: item.thumbnail,
            images: item.images || [],
            grading: grading,
            estimated_value: item.estimated_value,
          }
        })
        .filter((c): c is TCGCard => c !== null)

      // Sort by grade (PSA 10 = highest, PSA 1 = lowest)
      tcgCards.sort((a, b) => {
        const gradeA = getGradeValue(a.grading)
        const gradeB = getGradeValue(b.grading)
        return gradeB - gradeA // Descending
      })

      setCards(tcgCards.slice(0, 6)) // Top 6
    } catch (err) {
      console.error('Exception loading TCG cards:', err)
    } finally {
      setLoading(false)
    }
  }

  function getGradeValue(grading: GradingValue | string | null): number {
    if (!grading) return 0

    let grade = ''
    let company = ''

    if (typeof grading === 'string') {
      // Parse old format: "PSA 10"
      const match = grading.match(/^(PSA|BGS|CGC|SGC)\s+(.+)$/i)
      if (match) {
        company = match[1].toUpperCase()
        grade = match[2]
      } else {
        grade = grading
      }
    } else {
      company = grading.company || ''
      grade = grading.grade || ''
    }

    const numericGrade = parseFloat(grade)
    if (isNaN(numericGrade)) return 0

    // Bonus for better grading companies (subjective, but PSA is gold standard)
    const companyBonus: Record<string, number> = {
      PSA: 0.3,
      BGS: 0.2,
      CGC: 0.1,
      SGC: 0.1,
    }

    return numericGrade + (companyBonus[company] || 0)
  }

  function renderGrading(grading: GradingValue | string | null) {
    if (!grading) return null

    let company = ''
    let grade = ''
    let certNumber = ''

    if (typeof grading === 'string') {
      const match = grading.match(/^(PSA|BGS|CGC|SGC)\s+(.+)$/i)
      if (match) {
        company = match[1].toUpperCase()
        grade = match[2]
      } else {
        grade = grading
      }
    } else {
      company = grading.company || ''
      grade = grading.grade || ''
      certNumber = grading.certNumber || ''
    }

    const color = GRADING_COMPANY_COLORS[company] || '#94a3b8'

    return (
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold text-sm dark:text-white">
          {company} {grade}
        </span>
        {certNumber && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            #{certNumber.slice(0, 6)}
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-5xl mb-3 block">🃏</span>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
          Noch keine TCG-Karten mit Grading vorhanden
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Füge Trading Cards mit PSA/BGS/CGC/SGC Grading hinzu, um sie hier zu sehen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <Link
          key={card.id}
          href={`/collections/${card.collection_id}/items/${card.id}`}
          className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
        >
          {/* Rank Badge */}
          <div className="flex-shrink-0 flex items-center justify-center w-6">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              #{index + 1}
            </span>
          </div>

          {/* Image */}
          <div className="flex-shrink-0">
            {card.thumbnail || card.images[0] ? (
              <img
                src={card.thumbnail || card.images[0]}
                alt={card.name}
                className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <span className="text-2xl">🃏</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {card.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {card.category_name} • {card.collection_name}
                </p>
              </div>
              {card.estimated_value && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                  {card.estimated_value.toFixed(2)} €
                </span>
              )}
            </div>
            <div className="mt-1.5">
              {renderGrading(card.grading)}
            </div>
          </div>
        </Link>
      ))}

      {cards.length > 0 && (
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Top {cards.length} Karten nach Grading sortiert
          </p>
        </div>
      )}
    </div>
  )
}
