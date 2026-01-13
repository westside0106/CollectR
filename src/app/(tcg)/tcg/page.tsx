'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'
import { useTCGStats } from '@/hooks/useTCGStats'

type TCGGame = 'pokemon' | 'yugioh' | 'magic'

export default function TCGLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.tcg
  const [selectedGame, setSelectedGame] = useState<TCGGame | null>(null)
  const { stats, loading } = useTCGStats('all')

  const games = [
    {
      id: 'pokemon' as TCGGame,
      name: 'Pokémon TCG',
      emoji: '🎴',
      color: 'from-red-500 to-yellow-500',
      description: 'Gotta Catch \'Em All!',
      features: ['Typ-Matchup Chart', 'Deck Builder', 'Meta Decks', 'Preis-Scanner']
    },
    {
      id: 'yugioh' as TCGGame,
      name: 'Yu-Gi-Oh!',
      emoji: '🃏',
      color: 'from-purple-500 to-pink-500',
      description: 'It\'s Time to Duel!',
      features: ['Combo Database', 'Banlist Checker', 'Deck Profiles', 'Card Scanner']
    },
    {
      id: 'magic' as TCGGame,
      name: 'Magic: The Gathering',
      emoji: '🌟',
      color: 'from-blue-500 via-purple-500 to-pink-500',
      description: 'Gather Your Spells',
      features: ['Commander Deck Builder', 'Mana Curve', 'Format Checker', 'Price Tracker']
    }
  ]

  const quickActions = [
    {
      icon: '📸',
      title: 'Karte Scannen',
      description: 'Sofortige Erkennung & Preise',
      action: () => router.push('/tcg/scanner')
    },
    {
      icon: '💰',
      title: 'Preise Prüfen',
      description: 'Live Marktpreise & Trends',
      action: () => router.push('/tcg/prices')
    },
    {
      icon: '🎯',
      title: 'Deck Erstellen',
      description: 'Builder für alle Games',
      action: () => router.push('/tcg/deck-builder')
    },
    {
      icon: '📊',
      title: 'Meine Sammlung',
      description: 'Verwalte deine TCG Cards',
      action: () => router.push('/collections')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-6xl">{theme.emoji}</span>
              <h1 className="text-5xl sm:text-6xl font-bold">
                <span className={`bg-gradient-to-r ${theme.darkColors.gradient} bg-clip-text text-transparent`}>
                  {theme.name}
                </span>
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Die ultimative Plattform für Trading Card Game Sammler
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 transition-all duration-200 text-left"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-red-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Game Selection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Wähle dein Game
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`
                    relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${selectedGame === game.id
                      ? 'ring-4 ring-white/50 shadow-2xl'
                      : 'hover:shadow-xl'
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${selectedGame === game.id ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.5)'} 0%, rgba(15,23,42,0.8) 100%)`
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 rounded-2xl`}></div>

                  <div className="relative z-10">
                    <div className="text-6xl mb-4 text-center">{game.emoji}</div>
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {game.name}
                    </h3>
                    <p className="text-center text-slate-300 mb-6 italic">
                      {game.description}
                    </p>

                    <div className="space-y-2">
                      {game.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/tcg/${game.id}`)
                      }}
                      className={`
                        w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                        bg-gradient-to-r ${game.color} text-white hover:shadow-lg transform hover:-translate-y-0.5
                      `}
                    >
                      Zu {game.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {loading ? '...' : stats.totalCards}
                </div>
                <div className="text-sm text-slate-400">Total Cards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {loading ? '...' : `${stats.totalValue.toFixed(2)} €`}
                </div>
                <div className="text-sm text-slate-400">Collection Value</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {loading ? '...' : stats.totalDecks}
                </div>
                <div className="text-sm text-slate-400">Decks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {loading ? '...' : stats.hotCards}
                </div>
                <div className="text-sm text-slate-400">Hot Cards</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <span>Zur Sammlung</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Deck Building</h3>
              <p className="text-slate-400">
                Professionelle Deck-Builder für alle Games mit Auto-Suggestions
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-white mb-2">Price Tracking</h3>
              <p className="text-slate-400">
                Live-Preise, Trends und automatische Alerts für deine Sammlung
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-slate-400">
                Automatische Kartenerkennung, Bewertung und Optimierungsvorschläge
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
