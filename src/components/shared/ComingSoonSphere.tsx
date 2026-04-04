'use client'

import Link from 'next/link'
import { type SphereTheme } from '@/lib/themes/sphere-themes'

interface ComingSoonSphereProps {
  theme: SphereTheme
}

export function ComingSoonSphere({ theme }: ComingSoonSphereProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Sphere Emoji */}
        <div className="text-6xl mb-6">{theme.emoji}</div>

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Titel */}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {theme.displayName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-2">
          {theme.description}
        </p>

        {/* Coming Soon Badge */}
        <div className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${theme.darkColors.gradient} text-white text-sm font-medium mb-8`}>
          Coming Soon
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Diese Sphere wird gerade entwickelt und bald freigeschaltet. Nutze in der Zwischenzeit den HUB, um deine Sammlungen zu verwalten.
        </p>

        {/* Zurueck zum Dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
