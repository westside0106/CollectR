'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function CollectionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setCollections(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">📦 CollectR</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Sammlungen</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meine Sammlungen</h1>
          <Link
            href="/collections/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ➕ Neue Sammlung
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">Noch keine Sammlungen</h2>
            <p className="text-gray-600 mb-4">Erstelle deine erste Sammlung, um loszulegen!</p>
            <Link
              href="/collections/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Sammlung erstellen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="text-3xl mb-2">📁</div>
                <h3 className="text-lg font-semibold">{collection.name}</h3>
                {collection.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{collection.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
