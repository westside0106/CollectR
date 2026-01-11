'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardConfig, DashboardTile, TileType } from '@/types/database'

const STORAGE_KEY = 'collectr_dashboard_config'

// Default Dashboard Configuration
const DEFAULT_TILES: DashboardTile[] = [
  { id: 'stats', type: 'stats', title: 'Übersicht', size: 'full', position: 0, visible: true },
  { id: 'quick_actions', type: 'quick_actions', title: 'Schnellaktionen', size: 'medium', position: 1, visible: true },
  { id: 'reminders', type: 'reminders', title: 'Erinnerungen', size: 'medium', position: 2, visible: true },
  { id: 'chart_category', type: 'chart_category', title: 'Kategorien', size: 'medium', position: 3, visible: true },
  { id: 'chart_financial', type: 'chart_financial', title: 'Finanzen', size: 'medium', position: 4, visible: true },
  { id: 'recent_items', type: 'recent_items', title: 'Kürzlich hinzugefügt', size: 'medium', position: 5, visible: true },
  { id: 'top_items', type: 'top_items', title: 'Wertvollste Items', size: 'medium', position: 6, visible: true },
  { id: 'collection_list', type: 'collection_list', title: 'Sammlungen', size: 'large', position: 7, visible: true },
]

const DEFAULT_CONFIG: DashboardConfig = {
  tiles: DEFAULT_TILES,
  layout: 'grid',
  showHeader: true,
}

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardConfig
        // Merge with defaults to handle new tile types
        const mergedTiles = DEFAULT_TILES.map(defaultTile => {
          const storedTile = parsed.tiles?.find(t => t.id === defaultTile.id)
          return storedTile ? { ...defaultTile, ...storedTile } : defaultTile
        })
        setConfig({
          ...DEFAULT_CONFIG,
          ...parsed,
          tiles: mergedTiles,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    } catch (error) {
      console.error('Error saving dashboard config:', error)
    }
  }, [])

  // Toggle tile visibility
  const toggleTile = useCallback((tileId: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        tiles: prev.tiles.map(tile =>
          tile.id === tileId ? { ...tile, visible: !tile.visible } : tile
        ),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      return newConfig
    })
  }, [])

  // Reorder tiles
  const reorderTiles = useCallback((fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const visibleTiles = prev.tiles.filter(t => t.visible)
      const [movedTile] = visibleTiles.splice(fromIndex, 1)
      visibleTiles.splice(toIndex, 0, movedTile)

      // Update positions
      const reorderedTiles = visibleTiles.map((tile, index) => ({
        ...tile,
        position: index,
      }))

      // Merge back with hidden tiles
      const hiddenTiles = prev.tiles.filter(t => !t.visible)
      const newTiles = [...reorderedTiles, ...hiddenTiles]

      const newConfig = { ...prev, tiles: newTiles }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      return newConfig
    })
  }, [])

  // Update tile size
  const updateTileSize = useCallback((tileId: string, size: DashboardTile['size']) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        tiles: prev.tiles.map(tile =>
          tile.id === tileId ? { ...tile, size } : tile
        ),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      return newConfig
    })
  }, [])

  // Reset to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get visible tiles sorted by position
  const visibleTiles = config.tiles
    .filter(t => t.visible)
    .sort((a, b) => a.position - b.position)

  // Get hidden tiles
  const hiddenTiles = config.tiles.filter(t => !t.visible)

  return {
    config,
    isLoaded,
    visibleTiles,
    hiddenTiles,
    saveConfig,
    toggleTile,
    reorderTiles,
    updateTileSize,
    resetConfig,
  }
}

// Get tile icon for UI
export function getTileIcon(type: TileType): string {
  const icons: Record<TileType, string> = {
    stats: '📊',
    recent_items: '🕐',
    top_items: '⭐',
    chart_category: '📈',
    chart_status: '📉',
    chart_financial: '💰',
    reminders: '🔔',
    quick_actions: '⚡',
    collection_list: '📦',
  }
  return icons[type] || '📋'
}

// Get tile description for settings
export function getTileDescription(type: TileType): string {
  const descriptions: Record<TileType, string> = {
    stats: 'Zeigt Gesamtstatistiken: Sammlungen, Items, Wert',
    recent_items: 'Die zuletzt hinzugefügten Items',
    top_items: 'Die wertvollsten Items deiner Sammlung',
    chart_category: 'Verteilung der Items nach Kategorien',
    chart_status: 'Verteilung der Items nach Status',
    chart_financial: 'Ausgaben, Wert und Gewinn pro Sammlung',
    reminders: 'Anstehende und überfällige Erinnerungen',
    quick_actions: 'Schnellzugriff auf häufige Aktionen',
    collection_list: 'Übersicht aller Sammlungen',
  }
  return descriptions[type] || ''
}
