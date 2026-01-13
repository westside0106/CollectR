'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTCGStats } from '@/hooks/useTCGStats'

type CardType = 'monster' | 'spell' | 'trap' | 'fusion' | 'synchro' | 'xyz' | 'pendulum' | 'link'

export default function YuGiOhPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<CardType | null>(null)
  const { stats, loading } = useTCGStats('yugioh')

  const cardTypes: Record<CardType, { emoji: string; color: string; description: string }> = {
    monster: { emoji: '👾', color: 'from-orange-600 to-amber-600', description: 'Normal, Effect & Ritual' },
    spell: { emoji: '✨', color: 'from-green-600 to-emerald-600', description: 'Normal, Quick-Play & more' },
    trap: { emoji: '🪤', color: 'from-pink-600 to-rose-600', description: 'Normal, Counter & Continuous' },
    fusion: { emoji: '🔮', color: 'from-purple-600 to-violet-600', description: 'Extra Deck Fusion' },
    synchro: { emoji: '⚪', color: 'from-slate-100 to-gray-300', description: 'White Border Synchro' },
    xyz: { emoji: '⚫', color: 'from-slate-900 to-black', description: 'Black Border Xyz' },
    pendulum: { emoji: '🔄', color: 'from-green-500 via-orange-500 to-purple-500', description: 'Half Monster/Half Spell' },
    link: { emoji: '🔗', color: 'from-blue-600 to-cyan-600', description: 'Blue Border Link' }
  }

  const tools = [
    {
      icon: '🎴',
      title: 'Deck Builder',
      description: 'Erstelle Decks nach Banlist',
      link: '/tcg/deck-builder?game=yugioh'
    },
    {
      icon: '📋',
      title: 'Banlist Checker',
      description: 'Aktuelle verbotene Karten',
      link: '/tcg/yugioh/banlist'
    },
    {
      icon: '💰',
      title: 'Preis-Scanner',
      description: 'Live Kartenpreise',
      link: '/tcg/prices?game=yugioh'
    },
    {
      icon: '🔥',
      title: 'Combo Database',
      description: 'Beliebte Combos & Engines',
      link: '/tcg/yugioh/combos'
    }
  ]

  const popularArchetypes = [
    { name: 'Blue-Eyes', icon: '🐲', color: 'from-blue-500 to-cyan-500' },
    { name: 'Dark Magician', icon: '🎩', color: 'from-purple-600 to-pink-600' },
    { name: 'Cyber Dragon', icon: '🤖', color: 'from-slate-400 to-gray-600' },
    { name: 'Heroes', icon: '🦸', color: 'from-orange-500 to-red-600' },
    { name: 'Zombie', icon: '🧟', color: 'from-green-600 to-emerald-700' },
    { name: 'Dragon', icon: '🐉', color: 'from-red-600 to-orange-600' },
    { name: 'Spellbook', icon: '📖', color: 'from-blue-600 to-indigo-600' },
    { name: 'Burning Abyss', icon: '🔥', color: 'from-red-700 to-black' },
    { name: 'Shaddoll', icon: '🎭', color: 'from-purple-700 to-slate-800' },
    { name: 'Eldlich', icon: '👑', color: 'from-yellow-600 to-amber-700' },
    { name: 'Despia', icon: '😈', color: 'from-red-600 to-purple-700' },
    { name: 'Tearlaments', icon: '💧', color: 'from-blue-500 to-teal-500' }
  ]

  const formats = [
    { name: 'TCG Advanced', icon: '🌍', description: 'Official TCG Format' },
    { name: 'OCG', icon: '🇯🇵', description: 'Asian Format' },
    { name: 'Traditional', icon: '📜', description: 'No Banlist' },
    { name: 'Speed Duel', icon: '⚡', description: '20-30 Card Decks' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🃏</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Yu-Gi-Oh!
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300 italic">It's Time to Duel!</p>
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

        {/* Card Types */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">🎴 Karten-Typen</h2>
          <p className="text-slate-400 mb-6">Klicke auf einen Typ für mehr Informationen</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(Object.keys(cardTypes) as CardType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`
                  p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                  ${selectedType === type
                    ? 'ring-4 ring-white/50 shadow-2xl'
                    : 'hover:shadow-xl'
                  }
                  bg-gradient-to-br ${cardTypes[type].color}
                `}
              >
                <div className="text-4xl mb-2">{cardTypes[type].emoji}</div>
                <div className="text-sm font-semibold text-white capitalize">{type}</div>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="mt-6 p-6 rounded-xl bg-slate-700/50 border border-slate-600">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{cardTypes[selectedType].emoji}</span>
                <h3 className="text-2xl font-bold text-white capitalize">{selectedType}</h3>
              </div>
              <p className="text-slate-300">{cardTypes[selectedType].description}</p>
            </div>
          )}
        </div>

        {/* Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {formats.map((format) => (
            <button
              key={format.name}
              onClick={() => router.push(`/tcg/yugioh/format/${format.name.toLowerCase().replace(/\s+/g, '-')}`)}
              className="p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 transition-all text-center"
            >
              <div className="text-4xl mb-3">{format.icon}</div>
              <h3 className="font-semibold text-white mb-1">{format.name}</h3>
              <p className="text-sm text-slate-400">{format.description}</p>
            </button>
          ))}
        </div>

        {/* Popular Archetypes */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6">⚔️ Beliebte Archetypen</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularArchetypes.map((archetype) => (
              <button
                key={archetype.name}
                onClick={() => router.push(`/tcg/yugioh/archetype/${archetype.name.toLowerCase().replace(/\s+/g, '-')}`)}
                className={`
                  p-4 rounded-xl border border-slate-600 hover:border-purple-500/50 transition-all text-center
                  bg-gradient-to-br ${archetype.color}
                `}
              >
                <div className="text-3xl mb-2">{archetype.icon}</div>
                <div className="text-sm font-semibold text-white">{archetype.name}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/tcg/yugioh/archetypes')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <span>Alle Archetypen</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {loading ? '...' : stats.totalCards}
            </div>
            <div className="text-sm text-slate-400">Yu-Gi-Oh! Cards</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {loading ? '...' : `${stats.totalValue.toFixed(2)} €`}
            </div>
            <div className="text-sm text-slate-400">Collection Value</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {loading ? '...' : stats.totalDecks}
            </div>
            <div className="text-sm text-slate-400">Decks Built</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-pink-400 mb-1">
              {loading ? '...' : stats.hotCards}
            </div>
            <div className="text-sm text-slate-400">Rare Cards</div>
          </div>
        </div>
      </div>
    </div>
  )
}
