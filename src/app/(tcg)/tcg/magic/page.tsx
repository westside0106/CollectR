'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTCGStats } from '@/hooks/useTCGStats'

type ManaColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless'

export default function MagicPage() {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState<ManaColor | null>(null)
  const { stats, loading } = useTCGStats('magic')

  const manaColors: Record<ManaColor, { emoji: string; color: string; description: string; philosophy: string }> = {
    white: { emoji: '☀️', color: 'from-yellow-100 to-amber-200', description: 'Plains', philosophy: 'Law, Order, Structure' },
    blue: { emoji: '💧', color: 'from-blue-400 to-cyan-500', description: 'Island', philosophy: 'Knowledge, Control, Logic' },
    black: { emoji: '💀', color: 'from-slate-800 to-black', description: 'Swamp', philosophy: 'Power, Ambition, Death' },
    red: { emoji: '🔥', color: 'from-red-500 to-orange-600', description: 'Mountain', philosophy: 'Freedom, Emotion, Chaos' },
    green: { emoji: '🌿', color: 'from-green-500 to-emerald-600', description: 'Forest', philosophy: 'Nature, Growth, Life' },
    colorless: { emoji: '◇', color: 'from-gray-400 to-slate-500', description: 'Artifacts & Eldrazi', philosophy: 'Universal, Neutral' }
  }

  const tools = [
    {
      icon: '🎴',
      title: 'Deck Builder',
      description: 'Commander & Standard',
      link: '/tcg/deck-builder?game=magic'
    },
    {
      icon: '📊',
      title: 'Mana Curve',
      description: 'Deck Statistiken',
      link: '/tcg/magic/mana-curve'
    },
    {
      icon: '💰',
      title: 'Preis-Scanner',
      description: 'TCGPlayer & CardMarket',
      link: '/tcg/prices?game=magic'
    },
    {
      icon: '⚖️',
      title: 'Format Checker',
      description: 'Legality Prüfung',
      link: '/tcg/magic/format-checker'
    }
  ]

  const formats = [
    { name: 'Commander', icon: '👑', description: '100 Card Singleton', color: 'from-purple-600 to-indigo-600' },
    { name: 'Standard', icon: '📋', description: 'Last 2 Years', color: 'from-blue-600 to-cyan-600' },
    { name: 'Modern', icon: '⚡', description: '8th Edition+', color: 'from-orange-600 to-red-600' },
    { name: 'Pioneer', icon: '🌅', description: 'Return to Ravnica+', color: 'from-yellow-600 to-amber-600' },
    { name: 'Legacy', icon: '📜', description: 'Eternal Format', color: 'from-green-600 to-emerald-600' },
    { name: 'Vintage', icon: '🏆', description: 'All Cards Legal', color: 'from-pink-600 to-rose-600' },
    { name: 'Pauper', icon: '🔰', description: 'Commons Only', color: 'from-slate-600 to-gray-600' },
    { name: 'Limited', icon: '📦', description: 'Draft & Sealed', color: 'from-indigo-600 to-purple-600' }
  ]

  const popularCommanders = [
    { name: 'Atraxa', colors: ['W', 'U', 'B', 'G'], power: '⭐⭐⭐⭐⭐' },
    { name: 'Edgar Markov', colors: ['W', 'B', 'R'], power: '⭐⭐⭐⭐⭐' },
    { name: 'The Ur-Dragon', colors: ['W', 'U', 'B', 'R', 'G'], power: '⭐⭐⭐⭐⭐' },
    { name: 'Meren', colors: ['B', 'G'], power: '⭐⭐⭐⭐' },
    { name: 'Krenko', colors: ['R'], power: '⭐⭐⭐⭐' },
    { name: 'Sisay', colors: ['W', 'G'], power: '⭐⭐⭐⭐' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🌟</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Magic: The Gathering
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300 italic">Gather Your Spells</p>
          <Link
            href="/tcg"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu TCG Übersicht
          </Link>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.link}
              className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 transition-all duration-200"
            >
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-slate-400">{tool.description}</p>
            </Link>
          ))}
        </div>

        {/* Color Pie */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">🎨 The Color Pie</h2>
          <p className="text-slate-400 mb-6">Klicke auf eine Farbe für Philosophie & Details</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {(Object.keys(manaColors) as ManaColor[]).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                className={`
                  p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                  ${selectedColor === color
                    ? 'ring-4 ring-white/50 shadow-2xl'
                    : 'hover:shadow-xl'
                  }
                  bg-gradient-to-br ${manaColors[color].color}
                `}
              >
                <div className="text-4xl mb-2">{manaColors[color].emoji}</div>
                <div className={`text-sm font-semibold capitalize ${color === 'white' || color === 'colorless' ? 'text-slate-900' : 'text-white'}`}>
                  {color}
                </div>
              </button>
            ))}
          </div>

          {selectedColor && (
            <div className="mt-6 p-6 rounded-xl bg-slate-700/50 border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{manaColors[selectedColor].emoji}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white capitalize">{selectedColor}</h3>
                  <p className="text-slate-400 text-sm">{manaColors[selectedColor].description}</p>
                </div>
              </div>
              <p className="text-slate-300 font-semibold">{manaColors[selectedColor].philosophy}</p>
            </div>
          )}
        </div>

        {/* Formats */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">🎮 Formate</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formats.map((format) => (
              <button
                key={format.name}
                onClick={() => router.push(`/tcg/magic/format/${format.name.toLowerCase()}`)}
                className={`
                  p-6 rounded-xl border border-slate-600 hover:border-purple-500/50 transition-all text-center
                  bg-gradient-to-br ${format.color}
                `}
              >
                <div className="text-4xl mb-3">{format.icon}</div>
                <h3 className="font-semibold text-white mb-1">{format.name}</h3>
                <p className="text-sm text-slate-200 opacity-90">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Commanders */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6">👑 Top Commander</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularCommanders.map((commander) => (
              <div
                key={commander.name}
                className="p-6 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-purple-500/50 transition-all"
              >
                <h3 className="font-semibold text-white mb-2">{commander.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">Colors:</span>
                  <div className="flex gap-1">
                    {commander.colors.map((c, i) => (
                      <span key={i} className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  Power: {commander.power}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/tcg/magic/commanders')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <span>Alle Commander</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {loading ? '...' : stats.totalCards}
            </div>
            <div className="text-sm text-slate-400">Magic Cards</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {loading ? '...' : `${stats.totalValue.toFixed(2)} €`}
            </div>
            <div className="text-sm text-slate-400">Collection Value</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {loading ? '...' : stats.totalDecks}
            </div>
            <div className="text-sm text-slate-400">Commander Decks</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-pink-400 mb-1">
              {loading ? '...' : stats.hotCards}
            </div>
            <div className="text-sm text-slate-400">Reserved List Cards</div>
          </div>
        </div>
      </div>
    </div>
  )
}
