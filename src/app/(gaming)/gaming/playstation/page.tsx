'use client'

import Link from 'next/link'
import { useGamingStats } from '@/hooks/useGamingStats'

export default function PlayStationPage() {
  const { stats, loading } = useGamingStats('playstation')

  const features = [
    { title: 'Trophy Tracking', description: 'Verfolge deine Trophäen und Platin-Erfolge', icon: '🏆' },
    { title: 'Digital Library Sync', description: 'Synchronisiere deine digitale PSN-Bibliothek', icon: '💾' },
    { title: 'Price Alerts', description: 'Benachrichtigungen bei PSN-Sale Angeboten', icon: '💰' },
    { title: 'Exclusives Tracker', description: 'Übersicht aller PlayStation Exclusives', icon: '⭐' }
  ]

  const generations = [
    { name: 'PlayStation 5', emoji: '🎮', years: '2020 - heute' },
    { name: 'PlayStation 4', emoji: '🎮', years: '2013 - 2020' },
    { name: 'PlayStation 3', emoji: '🎮', years: '2006 - 2017' },
    { name: 'PlayStation 2', emoji: '🎮', years: '2000 - 2013' },
    { name: 'PlayStation 1', emoji: '🎮', years: '1994 - 2006' },
    { name: 'PSP & PS Vita', emoji: '📱', years: '2004 - 2019' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🎮</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                PlayStation
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Von PS1 bis PS5 - Deine PlayStation Sammlung
          </p>
          <Link
            href="/gaming"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Gaming Übersicht
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">🎮</div>
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {loading ? '...' : stats.totalGames}
            </div>
            <div className="text-sm text-slate-400">PlayStation Spiele</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              {loading ? '...' : `${stats.totalValue.toFixed(2)} €`}
            </div>
            <div className="text-sm text-slate-400">Sammlungswert</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-3xl font-bold text-amber-400 mb-1">0</div>
            <div className="text-sm text-slate-400">Platin-Trophäen</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-3xl font-bold text-purple-400 mb-1">0</div>
            <div className="text-sm text-slate-400">Exclusives</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Link
            href="/gaming/scanner"
            className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all duration-200 text-center"
          >
            <div className="text-4xl mb-3">📸</div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
              Spiel scannen
            </h3>
            <p className="text-sm text-slate-400">Barcode Recognition</p>
          </Link>

          <Link
            href="/gaming/prices"
            className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all duration-200 text-center"
          >
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
              Preise checken
            </h3>
            <p className="text-sm text-slate-400">PSN & Händler</p>
          </Link>

          <Link
            href="/collections"
            className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all duration-200 text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
              Sammlung
            </h3>
            <p className="text-sm text-slate-400">Alle Spiele</p>
          </Link>

          <Link
            href="/gaming/wishlist"
            className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all duration-200 text-center"
          >
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
              Wishlist
            </h3>
            <p className="text-sm text-slate-400">Geplante Käufe</p>
          </Link>
        </div>

        {/* Generations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">PlayStation Generationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <div
                key={gen.name}
                className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="text-4xl mb-3">{gen.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-1">{gen.name}</h3>
                <p className="text-sm text-slate-400">{gen.years}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 text-center"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> PlayStation Collector Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Über 5.000 Spiele für alle PlayStation Konsolen in der Datenbank</li>
            <li>• Automatische Wertermittlung basierend auf Markdaten</li>
            <li>• Trophäen-Synchronisation mit PSN (coming soon)</li>
            <li>• Regionale Varianten & Limited Editions erfassen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
