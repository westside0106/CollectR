'use client'

import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <button
      onClick={cycleTheme}
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
      <span className="text-xs text-slate-500 ml-auto">
        {theme === 'system' && `(${resolvedTheme === 'dark' ? 'Dunkel' : 'Hell'})`}
      </span>
    </button>
  )
}
