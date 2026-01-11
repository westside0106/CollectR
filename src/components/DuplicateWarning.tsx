'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface DuplicateItem {
  id: string
  name: string
  collection_id: string
  collection_name: string
  thumbnail: string | null
}

interface DuplicateWarningProps {
  itemName: string
  collectionId: string
  currentItemId?: string
  minSimilarity?: number
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.85

  // Levenshtein distance based similarity
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

export function DuplicateWarning({
  itemName,
  collectionId,
  currentItemId,
  minSimilarity = 0.7
}: DuplicateWarningProps) {
  const supabase = createClient()
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!itemName || itemName.trim().length < 3) {
      setDuplicates([])
      return
    }

    const timer = setTimeout(() => {
      checkForDuplicates()
    }, 500) // Debounce

    return () => clearTimeout(timer)
  }, [itemName, collectionId])

  async function checkForDuplicates() {
    setLoading(true)
    setDismissed(false)

    // Fetch all items from the collection
    const { data: items, error } = await supabase
      .from('items')
      .select(`
        id,
        name,
        collection_id,
        thumbnail,
        collections(name)
      `)
      .eq('collection_id', collectionId)

    if (error || !items) {
      setLoading(false)
      return
    }

    const searchName = itemName.trim()
    const similar: DuplicateItem[] = []

    for (const item of items) {
      // Skip current item if editing
      if (currentItemId && item.id === currentItemId) continue

      const similarity = calculateSimilarity(searchName, item.name)

      if (similarity >= minSimilarity) {
        similar.push({
          id: item.id,
          name: item.name,
          collection_id: item.collection_id,
          collection_name: (item.collections as any)?.name || 'Unbekannt',
          thumbnail: item.thumbnail
        })
      }
    }

    // Sort by similarity (best matches first)
    similar.sort((a, b) =>
      calculateSimilarity(searchName, b.name) - calculateSimilarity(searchName, a.name)
    )

    setDuplicates(similar.slice(0, 5)) // Max 5 duplicates
    setLoading(false)
  }

  if (dismissed || duplicates.length === 0 || loading) {
    return null
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            Mögliche Duplikate gefunden
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {duplicates.length === 1
              ? 'Ein ähnliches Item existiert bereits:'
              : `${duplicates.length} ähnliche Items existieren bereits:`}
          </p>

          <div className="space-y-2">
            {duplicates.map(dup => (
              <Link
                key={dup.id}
                href={`/collections/${dup.collection_id}/items/${dup.id}`}
                target="_blank"
                className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-700 transition"
              >
                {dup.thumbnail ? (
                  <img
                    src={dup.thumbnail}
                    alt={dup.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {dup.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dup.collection_name}
                  </p>
                </div>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 text-amber-400 hover:text-amber-600 transition"
          title="Ausblenden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
