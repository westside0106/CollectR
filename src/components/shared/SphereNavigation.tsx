'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SPHERE_THEMES, getSphereFromPath, type SphereType } from '@/lib/themes/sphere-themes'
import { useState } from 'react'

export function SphereNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const currentSphere = getSphereFromPath(pathname)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const spheres: SphereType[] = ['hub', 'tcg', 'gaming', 'official', 'geo', 'shop']

  function navigateToSphere(sphere: SphereType) {
    if (sphere === 'hub') {
      router.push('/collections')
    } else {
      router.push(`/${sphere}`)
    }
    setShowMobileMenu(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/80 dark:bg-slate-800/50 rounded-full px-2 py-1.5 border border-slate-200 dark:border-slate-700">
        {spheres.map((sphere) => {
          const theme = SPHERE_THEMES[sphere]
          const isActive = currentSphere === sphere

          return (
            <button
              key={sphere}
              onClick={() => navigateToSphere(sphere)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive
                  ? `bg-gradient-to-r ${theme.darkColors.gradient} text-white shadow-lg`
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }
              `}
            >
              <span className="mr-2">{theme.emoji}</span>
              <span className="hidden xl:inline">{theme.displayName}</span>
            </button>
          )
        })}
      </nav>

      {/* Mobile Navigation Toggle */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden p-2 rounded-lg bg-white/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 shadow-xl z-50">
          <div className="p-4 space-y-2">
            {spheres.map((sphere) => {
              const theme = SPHERE_THEMES[sphere]
              const isActive = currentSphere === sphere

              return (
                <button
                  key={sphere}
                  onClick={() => navigateToSphere(sphere)}
                  className={`
                    w-full px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 flex items-center gap-3
                    ${isActive
                      ? `bg-gradient-to-r ${theme.darkColors.gradient} text-white shadow-lg`
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <div>
                    <div className="font-semibold">{theme.displayName}</div>
                    <div className="text-xs opacity-75">{theme.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
