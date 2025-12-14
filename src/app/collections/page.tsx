import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CollectionsPage() {
  const supabase = await createClient()
  
  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      *,
      items:items(count),
      categories:categories(count)
    `)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sammlungen</h1>
          <p className="text-slate-500 mt-1">Alle deine Sammlungen im Überblick</p>
        </div>
        <Link
          href="/collections/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Neue Sammlung</span>
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Fehler: {error.message}
        </div>
      ) : !collections?.length ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {collections.map((collection) => (
            <CollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionRow({ collection }: { collection: any }) {
  const itemCount = collection.items?.[0]?.count ?? 0
  const categoryCount = collection.categories?.[0]?.count ?? 0
  
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all"
    >
      {/* Icon/Cover */}
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">📦</span>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg">{collection.name}</h3>
        {collection.description && (
          <p className="text-slate-500 text-sm truncate">{collection.description}</p>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-8 text-sm text-slate-500">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{itemCount}</p>
          <p>Items</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{categoryCount}</p>
          <p>Kategorien</p>
        </div>
      </div>
      
      {/* Arrow */}
      <span className="text-slate-400">→</span>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <span className="text-6xl">📦</span>
      <h3 className="text-xl font-semibold mt-4">Noch keine Sammlungen</h3>
      <p className="text-slate-500 mt-2">Erstelle deine erste Sammlung!</p>
      <Link
        href="/collections/new"
        className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        + Erste Sammlung erstellen
      </Link>
    </div>
  )
}
