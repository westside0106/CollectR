'use client'

import { DashboardTile as TileConfig, TileSize } from '@/types/database'

interface DashboardTileProps {
  tile: TileConfig
  children: React.ReactNode
  onSettings?: () => void
  className?: string
}

// Size classes for responsive grid
const sizeClasses: Record<TileSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-1',
  large: 'col-span-1 md:col-span-2',
  full: 'col-span-1 md:col-span-2 lg:col-span-3',
}

export function DashboardTile({ tile, children, onSettings, className = '' }: DashboardTileProps) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl shadow-sm
        transition-all duration-200 hover:shadow-md
        ${sizeClasses[tile.size]}
        ${className}
      `}
    >
      <div className="p-4 md:p-6">
        {/* Tile Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tile.title}
          </h3>
          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                         rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              title="Einstellungen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Tile Content */}
        {children}
      </div>
    </div>
  )
}

// Skeleton loader for tiles
export function TileSkeleton({ size = 'medium' }: { size?: TileSize }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 ${sizeClasses[size]} animate-pulse`}>
      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  )
}
