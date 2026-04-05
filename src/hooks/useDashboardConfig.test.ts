import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTileIcon, getTileDescription } from './useDashboardConfig'
import type { TileType } from '@/types/database'

// useDashboardConfig ist ein React Hook — wir testen hier die
// exportierten Helper-Funktionen. Hook-Tests brauchen renderHook
// aus @testing-library/react (kommt mit npm install).

describe('useDashboardConfig helpers', () => {
  describe('getTileIcon', () => {
    it('gibt Icons fuer alle bekannten Tile-Types zurueck', () => {
      const knownTypes: TileType[] = [
        'stats', 'spheres', 'recent_items', 'top_items',
        'chart_category', 'chart_status', 'chart_financial',
        'reminders', 'quick_actions', 'collection_list',
        'tcg_highlights', 'favorites', 'collection_3d',
      ]

      for (const type of knownTypes) {
        const icon = getTileIcon(type)
        expect(icon).toBeTruthy()
        expect(icon.length).toBeGreaterThan(0)
      }
    })

    it('gibt Fallback-Icon fuer unbekannte Types zurueck', () => {
      const icon = getTileIcon('unknown_type' as TileType)
      expect(icon).toBe('📋')
    })
  })

  describe('getTileDescription', () => {
    it('gibt Beschreibungen fuer alle bekannten Tile-Types zurueck', () => {
      const knownTypes: TileType[] = [
        'stats', 'spheres', 'recent_items', 'top_items',
        'chart_category', 'chart_status', 'chart_financial',
        'reminders', 'quick_actions', 'collection_list',
        'tcg_highlights', 'favorites', 'collection_3d',
      ]

      for (const type of knownTypes) {
        const desc = getTileDescription(type)
        expect(desc).toBeTruthy()
        expect(desc.length).toBeGreaterThan(5)
      }
    })

    it('gibt leeren String fuer unbekannte Types zurueck', () => {
      const desc = getTileDescription('unknown_type' as TileType)
      expect(desc).toBe('')
    })

    it('Spheres-Beschreibung enthaelt kein "alle 5 Spheres"', () => {
      const desc = getTileDescription('spheres')
      expect(desc).not.toContain('alle 5 Spheres')
    })

    it('3D Tile hat eine Beschreibung', () => {
      const desc = getTileDescription('collection_3d')
      expect(desc).toContain('3D')
    })
  })
})
