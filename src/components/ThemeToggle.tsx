'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
  variant?: 'header' | 'menu'
}

export function ThemeToggle({ variant = 'menu' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  // Kompakte Header-Variante (nur Icon)
  if (variant === 'header') {
    return (
      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Theme wechseln (aktuell: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'})`}
        title={`Theme: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'}`}
      >
        <span className="text-xl">
          {resolvedTheme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>
    )
  }

  // Ausführliche Menu-Variante (mit Text)
  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      aria-label={`Theme wechseln (aktuell: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'})`}
      title={`Theme: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'}`}
    >
      <span className="text-lg">
        {resolvedTheme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span className="font-medium">
        {theme === 'system' ? 'System' : theme === 'dark' ? 'Dunkel' : 'Hell'}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
        {theme === 'system' && `(${resolvedTheme === 'dark' ? 'Dunkel' : 'Hell'})`}
      </span>
    </button>
  )
}
