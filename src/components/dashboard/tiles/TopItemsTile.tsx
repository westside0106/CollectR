'use client'

import Link from 'next/link'

interface TopItem {
  id: string
  name: string
  collection_id: string
  collection_name: string
  purchase_price: number
  image_url?: string
}

interface TopItemsTileProps {
  items: TopItem[]
}

export function TopItemsTile({ items }: TopItemsTileProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">💎</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Noch keine Items mit Wert erfasst
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <Link
          key={item.id}
          href={`/collections/${item.collection_id}/items/${item.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        >
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm
            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
              'bg-gray-400 dark:bg-slate-600'}
          `}>
            {index + 1}
          </div>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-10 h-10 object-cover rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400">
              📦
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
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
            {item.purchase_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </span>
        </Link>
      ))}
    </div>
  )
}
