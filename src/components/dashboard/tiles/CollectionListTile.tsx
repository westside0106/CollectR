'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Folder } from '@/components/Folder'
import { Aurora } from '@/components/Aurora'

interface CollectionSummary {
  id: string
  name: string
  cover_image: string | null
  item_count: number
}

export function CollectionListTile() {
  const supabase = createClient()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: collectionsData } = await supabase
      .from('collections')
      .select('id, name, cover_image')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6)

    if (!collectionsData) {
      setLoading(false)
      return
    }

    // Get item counts for each collection
    const collectionsWithCounts = await Promise.all(
      collectionsData.map(async (collection) => {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id)

        return {
          ...collection,
          item_count: count || 0,
        }
      })
    )

    setCollections(collectionsWithCounts)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">📦</div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Noch keine Sammlungen vorhanden
        </p>
        <Link
          href="/collections/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Erste Sammlung erstellen
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {collections.map(collection => (
          <Link
            key={collection.id}
            href={`/collections/${collection.id}`}
            className="group relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700
                       hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all"
          >
            {/* Aurora Background */}
            <Aurora
              colorStops={['#4785ff', '#5227ff', '#8061ff', '#93e3fd', '#ffffff']}
              amplitude={0.3}
              blend={0.15}
              className="opacity-40 dark:opacity-30"
            />

            {/* Folder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Folder
                color="#5227FF"
                size={1.2}
                items={Array.from({ length: Math.min(3, collection.item_count) }, (_, i) => (
                  <div key={i} className="text-[8px] text-gray-600">Item</div>
                ))}
              />
            </div>

            {/* Collection Info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 z-10">
              <p className="text-white font-medium text-sm truncate">{collection.name}</p>
              <p className="text-white/70 text-xs">{collection.item_count} Items</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/collections"
        className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Alle Sammlungen anzeigen →
      </Link>
    </div>
  )
}
