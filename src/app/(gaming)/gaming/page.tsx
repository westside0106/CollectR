'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'
import { useGamingStats } from '@/hooks/useGamingStats'

type GamePlatform = 'playstation' | 'xbox' | 'nintendo' | 'pc' | 'retro'

export default function GamingLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.gaming
  const [selectedPlatform, setSelectedPlatform] = useState<GamePlatform | null>(null)
  const { stats, loading } = useGamingStats('all')

  const platforms = [
    {
      id: 'playstation' as GamePlatform,
      name: 'PlayStation',
      emoji: '🎮',
      color: 'from-blue-600 to-blue-800',
      description: 'PS1 - PS5 & PSP/Vita',
      features: ['Trophy Tracking', 'Digital Library Sync', 'Price Alerts', 'Wishlist Manager']
    },
    {
      id: 'xbox' as GamePlatform,
      name: 'Xbox',
      emoji: '🟢',
      color: 'from-green-600 to-green-800',
      description: 'OG Xbox - Series X/S',
      features: ['Achievement Tracking', 'Game Pass Integration', 'Backwards Compat List', 'Price History']
    },
    {
      id: 'nintendo' as GamePlatform,
      name: 'Nintendo',
      emoji: '🔴',
      color: 'from-red-600 to-red-800',
      description: 'NES - Switch',
      features: ['Complete Collection Tracker', 'Region Variants', 'Limited Editions', 'eShop Prices']
    },
    {
      id: 'pc' as GamePlatform,
      name: 'PC Gaming',
      emoji: '💻',
      color: 'from-purple-600 to-indigo-600',
      description: 'Steam, Epic, GOG & More',
      features: ['Multi-Platform Sync', 'DRM-Free Tracker', 'Bundle History', 'Playtime Stats']
    },
    {
      id: 'retro' as GamePlatform,
      name: 'Retro Gaming',
      emoji: '👾',
      color: 'from-amber-600 to-orange-600',
      description: 'Classic & Vintage Games',
      features: ['Cartridge Grading', 'Sealed Game Tracker', 'Market Value Trends', 'Repro Detection']
    }
  ]

  const quickActions = [
    {
      icon: '📸',
      title: 'Game Scannen',
      description: 'Barcode & Cover Recognition',
      action: () => router.push('/gaming/scanner')
    },
    {
      icon: '💰',
      title: 'Preise Checken',
      description: 'Aktuelle Marktpreise',
      action: () => router.push('/gaming/prices')
    },
    {
      icon: '📊',
      title: 'Meine Sammlung',
      description: 'Spiele verwalten',
      action: () => router.push('/collections')
    },
    {
      icon: '🎯',
      title: 'Wishlist',
      description: 'Zukünftige Käufe planen',
      action: () => router.push('/gaming/wishlist')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto container-responsive py-8 sm:py-12 md:py-20">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="text-4xl sm:text-5xl md:text-6xl">{theme.emoji}</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className={`bg-gradient-to-r ${theme.darkColors.gradient} bg-clip-text text-transparent`}>
                  {theme.name}
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto px-4">
              Die ultimative Plattform für Video Game Sammler
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-4 sm:p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 transition-all duration-200 text-left"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{action.icon}</div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Platform Selection */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
              Wähle deine Plattform
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`
                    relative p-6 sm:p-8 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${selectedPlatform === platform.id
                      ? 'ring-4 ring-white/50 shadow-2xl'
                      : 'hover:shadow-xl'
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${selectedPlatform === platform.id ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.5)'} 0%, rgba(15,23,42,0.8) 100%)`
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-10 rounded-xl sm:rounded-2xl`}></div>

                  <div className="relative z-10">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 text-center">{platform.emoji}</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
                      {platform.name}
                    </h3>
                    <p className="text-sm sm:text-base text-center text-slate-300 mb-4 sm:mb-6 italic">
                      {platform.description}
                    </p>

                    <div className="space-y-2">
                      {platform.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/gaming/${platform.id}`)
                      }}
                      className={`
                        w-full mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200
                        bg-gradient-to-r ${platform.color} text-white hover:shadow-lg transform hover:-translate-y-0.5
                      `}
                    >
                      Zu {platform.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Stats</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                  {loading ? '...' : stats.totalGames}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                  {loading ? '...' : `${stats.totalValue.toFixed(2)} €`}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">Collection Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                  {loading ? '...' : stats.platforms}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">Platforms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 mb-1">
                  {loading ? '...' : stats.wishlistCount}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">Wishlist</div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-sm sm:text-base text-slate-300 hover:text-white transition-colors"
              >
                <span>Zur Sammlung</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📈</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Price Tracking</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Automatische Preisverfolgung über alle Plattformen & Händler
              </p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎮</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Multi-Platform</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Von Retro-Konsolen bis Next-Gen - alles an einem Ort
              </p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🤖</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Smart Features</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Barcode-Scan, automatische Wertermittlung & Spielstunden-Tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
