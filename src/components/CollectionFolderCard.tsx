'use client'

import Link from 'next/link'
import { Folder } from './Folder'
import { Aurora } from './Aurora'

interface Collection {
  id: string
  name: string
  description: string | null
  settings?: { icon?: string } | null
  item_count?: number
  is_shared?: boolean
  role?: 'viewer' | 'editor' | 'admin'
}

interface CollectionFolderCardProps {
  collection: Collection
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
}

export function CollectionFolderCard({
  collection,
  onEdit,
  onDelete,
  onShare
}: CollectionFolderCardProps) {
  // Color based on collection or default
  const getFolderColor = () => {
    if (collection.is_shared) return '#9333ea' // purple for shared
    return '#5227FF' // default blue-purple
  }

  // Sample items to show in folder (first 3 categories or generic items)
  const folderItems = Array.from({ length: Math.min(3, collection.item_count || 0) }, (_, i) => (
    <div key={i} className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
      Item {i + 1}
    </div>
  ))

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all overflow-hidden">
      {/* Aurora Background */}
      <Aurora
        colorStops={
          collection.is_shared
            ? ['#7c3aed', '#a855f7', '#c084fc', '#e9d5ff', '#ffffff']
            : ['#4785ff', '#5227ff', '#8061ff', '#93e3fd', '#ffffff']
        }
        amplitude={0.3}
        blend={0.15}
        className="opacity-40 dark:opacity-30"
      />

      {/* Action Buttons - only for own collections */}
      {!collection.is_shared && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onShare()
              }}
              className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition shadow-sm"
              title="Teilen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onEdit()
              }}
              className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition shadow-sm"
              title="Bearbeiten"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition shadow-sm"
              title="Löschen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Shared Badge */}
      {collection.is_shared && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 rounded-full backdrop-blur-sm">
            {collection.role === 'viewer' ? 'Betrachter' : collection.role === 'editor' ? 'Bearbeiter' : 'Admin'}
          </span>
        </div>
      )}

      {/* Card Content */}
      <Link href={`/collections/${collection.id}`}>
        <div className="relative p-6 min-h-[200px] flex flex-col items-center justify-center">
          {/* 3D Folder */}
          <div className="mb-4 transform hover:scale-110 transition-transform">
            <Folder
              color={getFolderColor()}
              size={1.5}
              items={folderItems}
            />
          </div>

          {/* Collection Info */}
          <div className="text-center relative z-[1]">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white mb-1">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 mb-2">
                {collection.description}
              </p>
            )}
            <p className="text-gray-500 dark:text-slate-500 text-xs flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {collection.item_count} {collection.item_count === 1 ? 'Item' : 'Items'}
              {collection.is_shared && ' • Geteilt'}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
