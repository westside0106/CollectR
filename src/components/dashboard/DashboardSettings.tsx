'use client'

import { useState } from 'react'
import { DashboardTile, TileSize } from '@/types/database'
import { getTileIcon, getTileDescription } from '@/hooks/useDashboardConfig'

interface DashboardSettingsProps {
  isOpen: boolean
  onClose: () => void
  visibleTiles: DashboardTile[]
  hiddenTiles: DashboardTile[]
  onToggleTile: (tileId: string) => void
  onUpdateSize: (tileId: string, size: TileSize) => void
  onReset: () => void
}

const SIZE_OPTIONS: { value: TileSize; label: string }[] = [
  { value: 'small', label: 'Klein' },
  { value: 'medium', label: 'Mittel' },
  { value: 'large', label: 'Groß' },
  { value: 'full', label: 'Volle Breite' },
]

export function DashboardSettings({
  isOpen,
  onClose,
  visibleTiles,
  hiddenTiles,
  onToggleTile,
  onUpdateSize,
  onReset,
}: DashboardSettingsProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard anpassen
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                         rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Active Tiles */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Aktive Kacheln
              </h3>
              <div className="space-y-3">
                {visibleTiles.map(tile => (
                  <div
                    key={tile.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <span className="text-2xl">{getTileIcon(tile.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tile.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getTileDescription(tile.type)}
                      </p>
                    </div>
                    <select
                      value={tile.size}
                      onChange={(e) => onUpdateSize(tile.id, e.target.value as TileSize)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600
                                 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      {SIZE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onToggleTile(tile.id)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50
                                 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Ausblenden"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Tiles */}
            {hiddenTiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  Ausgeblendete Kacheln
                </h3>
                <div className="space-y-3">
                  {hiddenTiles.map(tile => (
                    <div
                      key={tile.id}
                      className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-slate-700/30 rounded-xl opacity-60"
                    >
                      <span className="text-2xl grayscale">{getTileIcon(tile.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tile.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getTileDescription(tile.type)}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleTile(tile.id)}
                        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50
                                   dark:hover:bg-green-900/20 rounded-lg transition"
                        title="Einblenden"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            {showConfirmReset ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Wirklich zurücksetzen?</span>
                <button
                  onClick={() => {
                    onReset()
                    setShowConfirmReset(false)
                  }}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Ja, zurücksetzen
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                Auf Standard zurücksetzen
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
