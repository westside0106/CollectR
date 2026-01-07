'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'teal' | 'amber'

export const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
  { value: 'blue', label: 'Blau', color: '#3b82f6' },
  { value: 'green', label: 'Grün', color: '#22c55e' },
  { value: 'purple', label: 'Lila', color: '#a855f7' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'rose', label: 'Rosa', color: '#f43f5e' },
  { value: 'teal', label: 'Türkis', color: '#14b8a6' },
  { value: 'amber', label: 'Bernstein', color: '#f59e0b' },
]

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue')

  useEffect(() => {
    // Theme aus localStorage laden
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }

    // Akzentfarbe aus localStorage laden
    const savedAccent = localStorage.getItem('accentColor') as AccentColor | null
    if (savedAccent && ACCENT_COLORS.some(c => c.value === savedAccent)) {
      setAccentColorState(savedAccent)
      document.documentElement.setAttribute('data-accent', savedAccent)
    }
  }, [])

  useEffect(() => {
    // Resolved Theme berechnen
    let resolved: 'light' | 'dark' = 'light'

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = theme
    }

    setResolvedTheme(resolved)

    // HTML-Klasse setzen
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // System-Theme-Änderungen überwachen
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light'
        setResolvedTheme(newResolved)
        if (newResolved === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const setAccentColor = (newAccent: AccentColor) => {
    setAccentColorState(newAccent)
    localStorage.setItem('accentColor', newAccent)
    // Für blue (default) entfernen wir das Attribut, sonst setzen wir es
    if (newAccent === 'blue') {
      document.documentElement.removeAttribute('data-accent')
    } else {
      document.documentElement.setAttribute('data-accent', newAccent)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
