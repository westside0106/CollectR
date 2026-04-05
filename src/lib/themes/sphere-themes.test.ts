import { describe, it, expect } from 'vitest'
import {
  SPHERE_THEMES,
  getSphereTheme,
  getSphereFromPath,
  isSphereLocked,
  type SphereType,
} from './sphere-themes'

describe('sphere-themes', () => {
  describe('SPHERE_THEMES', () => {
    it('enthaelt alle 6 Spheres', () => {
      const keys = Object.keys(SPHERE_THEMES)
      expect(keys).toHaveLength(6)
      expect(keys).toContain('hub')
      expect(keys).toContain('tcg')
      expect(keys).toContain('gaming')
      expect(keys).toContain('official')
      expect(keys).toContain('geo')
      expect(keys).toContain('shop')
    })

    it('jede Sphere hat alle Pflichtfelder', () => {
      const spheres = Object.values(SPHERE_THEMES)
      for (const sphere of spheres) {
        expect(sphere.id).toBeTruthy()
        expect(sphere.name).toBeTruthy()
        expect(sphere.displayName).toBeTruthy()
        expect(sphere.emoji).toBeTruthy()
        expect(sphere.description).toBeTruthy()
        expect(typeof sphere.isLocked).toBe('boolean')
        expect(sphere.colors.primary).toBeTruthy()
        expect(sphere.colors.gradient).toBeTruthy()
        expect(sphere.darkColors.primary).toBeTruthy()
        expect(sphere.darkColors.gradient).toBeTruthy()
      }
    })
  })

  describe('isSphereLocked', () => {
    it('HUB ist nicht gesperrt', () => {
      expect(isSphereLocked('hub')).toBe(false)
    })

    it('alle anderen Spheres sind gesperrt', () => {
      const lockedSpheres: SphereType[] = ['tcg', 'gaming', 'official', 'geo', 'shop']
      for (const sphere of lockedSpheres) {
        expect(isSphereLocked(sphere)).toBe(true)
      }
    })
  })

  describe('getSphereTheme', () => {
    it('gibt das richtige Theme zurueck', () => {
      const hubTheme = getSphereTheme('hub')
      expect(hubTheme.id).toBe('hub')
      expect(hubTheme.displayName).toBe('HUB')

      const tcgTheme = getSphereTheme('tcg')
      expect(tcgTheme.id).toBe('tcg')
      expect(tcgTheme.displayName).toBe('TCG')
    })
  })

  describe('getSphereFromPath', () => {
    it('erkennt TCG-Pfade', () => {
      expect(getSphereFromPath('/tcg')).toBe('tcg')
      expect(getSphereFromPath('/tcg/pokemon')).toBe('tcg')
      expect(getSphereFromPath('/tcg/scanner')).toBe('tcg')
    })

    it('erkennt Gaming-Pfade', () => {
      expect(getSphereFromPath('/gaming')).toBe('gaming')
      expect(getSphereFromPath('/gaming/playstation')).toBe('gaming')
    })

    it('erkennt Official-Pfade', () => {
      expect(getSphereFromPath('/official')).toBe('official')
    })

    it('erkennt Geo-Pfade', () => {
      expect(getSphereFromPath('/geo')).toBe('geo')
      expect(getSphereFromPath('/geo/locations')).toBe('geo')
    })

    it('erkennt Shop-Pfade', () => {
      expect(getSphereFromPath('/shop')).toBe('shop')
    })

    it('gibt HUB als Default zurueck', () => {
      expect(getSphereFromPath('/')).toBe('hub')
      expect(getSphereFromPath('/dashboard')).toBe('hub')
      expect(getSphereFromPath('/collections')).toBe('hub')
      expect(getSphereFromPath('/settings')).toBe('hub')
      expect(getSphereFromPath('/tools/currency')).toBe('hub')
      expect(getSphereFromPath('/reminders')).toBe('hub')
    })
  })
})
