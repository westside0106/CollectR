'use client'

import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'

export default function HubLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.hub

  const quickActions = [
    {
      icon: '➕',
      title: 'Neue Sammlung',
      description: 'Starte eine neue Collection',
      action: () => router.push('/collections/new')
    },
    {
      icon: '📊',
      title: 'Dashboard',
      description: 'Übersicht aller Sammlungen',
      action: () => router.push('/')
    },
    {
      icon: '📦',
      title: 'Alle Sammlungen',
      description: 'Browse deine Collections',
      action: () => router.push('/collections')
    },
    {
      icon: '📈',
      title: 'Statistiken',
      description: 'Werte & Trends',
      action: () => router.push('/')
    }
  ]

  const spheres = [
    {
      ...SPHERE_THEMES.tcg,
      description: 'Trading Card Games',
      link: '/tcg'
    },
    {
      ...SPHERE_THEMES.gaming,
      description: 'Video Games',
      link: '/gaming'
    },
    {
      ...SPHERE_THEMES.official,
      description: 'Dokumente & Zertifikate',
      link: '/official'
    },
    {
      ...SPHERE_THEMES.geo,
      description: 'Geologie & Archäologie',
      link: '/geo'
    },
    {
      ...SPHERE_THEMES.shop,
      description: 'Marktplatz & Commerce',
      link: '/shop'
    }
  ]

  const features = [
    {
      icon: '🌐',
      title: 'Universal Platform',
      description: 'Ein Hub für alle deine Sammlungen - egal ob TCG, Gaming, oder Memorabilia'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Zugriff von überall - Desktop, Tablet, Smartphone mit automatischer Sync'
    },
    {
      icon: '🔒',
      title: 'Sicher & Privat',
      description: 'Deine Daten gehören dir - Ende-zu-Ende verschlüsselt mit Backup'
    },
    {
      icon: '🤖',
      title: 'AI-Powered',
      description: 'Automatische Kategorisierung, Preisüberwachung & Smart Recommendations'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Detaillierte Statistiken, Wertentwicklung & Trend-Analyse'
    },
    {
      icon: '🔄',
      title: 'Multi-Sphere',
      description: 'Spezialisierte Tools für jede Sammelkategorie mit übergreifender Suche'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-7xl">{theme.emoji}</span>
              <div>
                <h1 className="text-6xl font-bold">
                  <span className={`bg-gradient-to-r ${theme.darkColors.gradient} bg-clip-text text-transparent`}>
                    {theme.name}
                  </span>
                </h1>
                <p className="text-xl text-slate-400 mt-2">Universal Collection Manager</p>
              </div>
            </div>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Deine zentrale Plattform für alle Sammlungen
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all duration-200 text-left"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-slate-200 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Spheres */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Entdecke die Spheres
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spheres.map((sphere) => (
                <Link
                  key={sphere.id}
                  href={sphere.link}
                  className="group relative p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 bg-slate-800/30 border border-slate-700 hover:border-slate-500"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${sphere.darkColors.gradient} opacity-5 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>

                  <div className="relative z-10">
                    <div className="text-6xl mb-4 text-center">{sphere.emoji}</div>
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {sphere.displayName}
                    </h3>
                    <p className="text-center text-slate-300 mb-4">
                      {sphere.description}
                    </p>

                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        <span>Mehr erfahren</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Warum CollectR HUB?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Total Collections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">0.00 €</div>
                <div className="text-sm text-slate-400">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Active Spheres</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <span>Zu meinen Sammlungen</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Bereit loszulegen?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/collections/new')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Erste Sammlung Erstellen
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-slate-700 text-white rounded-lg font-semibold text-lg hover:bg-slate-600 transition-all"
              >
                Zum Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
