// Collectorssphere Theme System
// Each sphere has its own color scheme and branding

export type SphereType = 'hub' | 'tcg' | 'gaming' | 'official' | 'geo' | 'shop'

export interface SphereTheme {
  id: SphereType
  name: string
  displayName: string
  emoji: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
  darkColors: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
}

export const SPHERE_THEMES: Record<SphereType, SphereTheme> = {
  hub: {
    id: 'hub',
    name: 'CollectorssphereHUB',
    displayName: 'HUB',
    emoji: '🏠',
    description: 'Universal Collection Manager',
    colors: {
      primary: '#2563eb',      // Blue
      secondary: '#8b5cf6',    // Purple
      accent: '#06b6d4',       // Cyan
      gradient: 'from-blue-600 to-purple-600'
    },
    darkColors: {
      primary: '#3b82f6',
      secondary: '#a78bfa',
      accent: '#22d3ee',
      gradient: 'from-blue-500 to-purple-500'
    }
  },

  tcg: {
    id: 'tcg',
    name: 'CollectorsphereTCG',
    displayName: 'TCG',
    emoji: '🎴',
    description: 'Trading Card Game Platform',
    colors: {
      primary: '#dc2626',      // Red
      secondary: '#f59e0b',    // Amber/Gold
      accent: '#8b5cf6',       // Purple
      gradient: 'from-red-600 to-amber-500'
    },
    darkColors: {
      primary: '#ef4444',
      secondary: '#fbbf24',
      accent: '#a78bfa',
      gradient: 'from-red-500 to-amber-400'
    }
  },

  gaming: {
    id: 'gaming',
    name: 'CollectorssphereGAMING',
    displayName: 'Gaming',
    emoji: '🎮',
    description: 'Video Game Collection Manager',
    colors: {
      primary: '#7c3aed',      // Violet
      secondary: '#ec4899',    // Pink
      accent: '#06b6d4',       // Cyan
      gradient: 'from-violet-600 to-pink-600'
    },
    darkColors: {
      primary: '#8b5cf6',
      secondary: '#f472b6',
      accent: '#22d3ee',
      gradient: 'from-violet-500 to-pink-500'
    }
  },

  official: {
    id: 'official',
    name: 'CollectorssphereOFFICIAL',
    displayName: 'Official',
    emoji: '📜',
    description: 'Documents & Certificates',
    colors: {
      primary: '#0891b2',      // Cyan
      secondary: '#059669',    // Emerald
      accent: '#f59e0b',       // Amber
      gradient: 'from-cyan-600 to-emerald-600'
    },
    darkColors: {
      primary: '#06b6d4',
      secondary: '#10b981',
      accent: '#fbbf24',
      gradient: 'from-cyan-500 to-emerald-500'
    }
  },

  geo: {
    id: 'geo',
    name: 'CollectorssphereGEO',
    displayName: 'Geo',
    emoji: '⛏️',
    description: 'Geology & Archaeology',
    colors: {
      primary: '#ca8a04',      // Yellow
      secondary: '#ea580c',    // Orange
      accent: '#65a30d',       // Lime
      gradient: 'from-yellow-600 to-orange-600'
    },
    darkColors: {
      primary: '#eab308',
      secondary: '#f97316',
      accent: '#84cc16',
      gradient: 'from-yellow-500 to-orange-500'
    }
  },

  shop: {
    id: 'shop',
    name: 'CollectorssphereSHOP',
    displayName: 'Shop',
    emoji: '🛒',
    description: 'Marketplace & Sales',
    colors: {
      primary: '#059669',      // Emerald
      secondary: '#0891b2',    // Cyan
      accent: '#7c3aed',       // Violet
      gradient: 'from-emerald-600 to-cyan-600'
    },
    darkColors: {
      primary: '#10b981',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      gradient: 'from-emerald-500 to-cyan-500'
    }
  }
}

export function getSphereTheme(sphere: SphereType): SphereTheme {
  return SPHERE_THEMES[sphere]
}

export function getSphereFromPath(pathname: string): SphereType {
  if (pathname.startsWith('/tcg')) return 'tcg'
  if (pathname.startsWith('/gaming')) return 'gaming'
  if (pathname.startsWith('/official')) return 'official'
  if (pathname.startsWith('/geo')) return 'geo'
  if (pathname.startsWith('/shop')) return 'shop'
  return 'hub'
}
