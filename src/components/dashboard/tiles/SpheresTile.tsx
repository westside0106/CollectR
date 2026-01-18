'use client'

import Link from 'next/link'
import { SPHERE_THEMES, type SphereType } from '@/lib/themes/sphere-themes'

const MAIN_SPHERES: SphereType[] = ['tcg', 'gaming', 'official', 'geo', 'shop']

export function SpheresTile() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        🌟 Explore Spheres
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {MAIN_SPHERES.map((sphereId) => {
          const sphere = SPHERE_THEMES[sphereId]
          return (
            <Link
              key={sphereId}
              href={`/${sphereId}`}
              className="group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 active:border-blue-500 dark:active:border-blue-400 transition-all duration-200 hover:shadow-lg active:shadow-xl touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Colored accent */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${sphere.darkColors.gradient} opacity-0 group-hover:opacity-10 group-active:opacity-15 transition-opacity`}
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">{sphere.emoji}</div>
                <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-0.5 sm:mb-1 leading-tight">
                  {sphere.displayName}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {sphere.description.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            </Link>
          )
        })}

        {/* Hub Link */}
        <Link
          href="/hub"
          className="group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-700 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-500 active:border-blue-500 dark:active:border-blue-400 transition-all duration-200 hover:shadow-lg active:shadow-xl touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">🏠</div>
            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-0.5 sm:mb-1 leading-tight">
              HUB
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Zentrale
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Spezialisierte Tools für jede Sammelkategorie
        </p>
      </div>
    </div>
  )
}
