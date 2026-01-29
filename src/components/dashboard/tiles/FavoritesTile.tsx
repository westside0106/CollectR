'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CardSwap, { Card } from '@/components/CardSwap'

interface FavoriteCollection {
  id: string
  name: string
  cover_image: string | null
  item_count: number
}

export function FavoritesTile() {
  const supabase = createClient()
  const [favorites, setFavorites] = useState<FavoriteCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  async function loadFavorites() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load collections marked as favorite (you can add a 'is_favorite' column or use settings)
    const { data: collectionsData } = await supabase
      .from('collections')
      .select('id, name, cover_image, settings')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (!collectionsData) {
      setLoading(false)
      return
    }

    // Filter favorites based on settings (or just use top collections)
    const favoriteCollections = collectionsData.filter((c: any) => {
      const settings = c.settings as any
      return settings?.is_favorite === true
    })

    // If no favorites set, use top 3 collections
    const collectionsToShow = favoriteCollections.length > 0
      ? favoriteCollections
      : collectionsData.slice(0, 3)

    // Get item counts for each collection
    const collectionsWithCounts = await Promise.all(
      collectionsToShow.map(async (collection: any) => {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id)

        return {
          id: collection.id,
          name: collection.name,
          cover_image: collection.cover_image,
          item_count: count || 0,
        }
      })
    )

    setFavorites(collectionsWithCounts)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⭐</div>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-lg font-medium">
          Keine Favoriten vorhanden
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
          Markiere Sammlungen als Favoriten, um sie hier zu sehen
        </p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
        >
          Zu Sammlungen
        </Link>
      </div>
    )
  }

  return (
    <div className="relative h-[600px] w-full flex items-center justify-center">
      <CardSwap
        width={300}
        height={380}
        cardDistance={50}
        verticalDistance={60}
        delay={4000}
        pauseOnHover={true}
        skewAmount={4}
        easing="elastic"
      >
        {favorites.map((collection) => (
          <Card
            key={collection.id}
            className="cursor-pointer overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600"
          >
            <Link href={`/collections/${collection.id}`} className="block h-full">
              <div className="h-full flex flex-col p-6">
                {/* Collection Image or Icon */}
                <div className="flex-1 flex items-center justify-center">
                  {collection.cover_image ? (
                    <img
                      src={collection.cover_image}
                      alt={collection.name}
                      className="w-32 h-32 object-cover rounded-lg shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-6xl">📁</span>
                    </div>
                  )}
                </div>

                {/* Collection Info */}
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {collection.item_count} {collection.item_count === 1 ? 'Item' : 'Items'}
                  </p>

                  {/* Favorite Star */}
                  <div className="mt-4 flex justify-center">
                    <div className="bg-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-xs text-yellow-300 font-medium">Favorit</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </CardSwap>

      {/* Bottom Link */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <Link
          href="/collections"
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition"
        >
          Alle Favoriten verwalten →
        </Link>
      </div>
    </div>
  )
}
