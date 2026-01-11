'use client'

import Link from 'next/link'

interface RecentItem {
  id: string
  name: string
  collection_id: string
  collection_name: string
  thumbnail: string | null
  purchase_price: number | null
  created_at: string
}

interface RecentItemsTileProps {
  items: RecentItem[]
}

export function RecentItemsTile({ items }: RecentItemsTileProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">📦</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Noch keine Artikel vorhanden
        </p>
        <Link
          href="/collections"
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2 inline-block"
        >
          Erste Sammlung erstellen →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <Link
          key={item.id}
          href={`/collections/${item.collection_id}/items/${item.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        >
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.name}
              className="w-10 h-10 object-cover rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {item.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.collection_name}
            </p>
          </div>
          {item.purchase_price && (
            <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
              {item.purchase_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
