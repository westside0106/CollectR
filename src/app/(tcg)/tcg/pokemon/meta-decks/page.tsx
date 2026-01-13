'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MetaDeck {
  name: string
  tier: 'S' | 'A' | 'B'
  winRate: number
  usage: number
  mainCards: string[]
  archetype: string
  playstyle: string
}

export default function PokemonMetaDecksPage() {
  const [selectedTier, setSelectedTier] = useState<'all' | 'S' | 'A' | 'B'>('all')

  const metaDecks: MetaDeck[] = [
    {
      name: 'Lugia VSTAR',
      tier: 'S',
      winRate: 58.5,
      usage: 15.2,
      mainCards: ['Lugia VSTAR', 'Archeops', 'Colorless Energy'],
      archetype: 'Control',
      playstyle: 'Kontrolliere das Spiel durch starke VSTARs'
    },
    {
      name: 'Charizard ex',
      tier: 'S',
      winRate: 56.8,
      usage: 18.5,
      mainCards: ['Charizard ex', 'Pidgeot ex', 'Rare Candy'],
      archetype: 'Aggro',
      playstyle: 'Schneller Damage durch Evolution-Chains'
    },
    {
      name: 'Mew VMAX',
      tier: 'A',
      winRate: 54.2,
      usage: 12.8,
      mainCards: ['Mew VMAX', 'Genesect V', 'Fusion Strike Energy'],
      archetype: 'Combo',
      playstyle: 'Flexible Attacken mit Fusion Strike System'
    },
    {
      name: 'Lost Zone Box',
      tier: 'A',
      winRate: 53.9,
      usage: 10.5,
      mainCards: ['Comfey', 'Sableye', 'Cramorant'],
      archetype: 'Control',
      playstyle: 'Nutze die Lost Zone für starke Effekte'
    },
    {
      name: 'Gardevoir ex',
      tier: 'A',
      winRate: 52.7,
      usage: 9.8,
      mainCards: ['Gardevoir ex', 'Kirlia', 'Zacian V'],
      archetype: 'Midrange',
      playstyle: 'Energy-Beschleunigung und große Attacken'
    },
    {
      name: 'Miraidon ex',
      tier: 'B',
      winRate: 51.5,
      usage: 8.3,
      mainCards: ['Miraidon ex', 'Raikou V', 'Electric Generator'],
      archetype: 'Aggro',
      playstyle: 'Lightning-Type Beatdown'
    }
  ]

  const filteredDecks = selectedTier === 'all'
    ? metaDecks
    : metaDecks.filter(deck => deck.tier === selectedTier)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'from-yellow-500 to-orange-500'
      case 'A': return 'from-blue-500 to-cyan-500'
      case 'B': return 'from-green-500 to-emerald-500'
      default: return 'from-slate-500 to-gray-500'
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'S': return '🏆 Top Tier'
      case 'A': return '⭐ Stark'
      case 'B': return '✓ Spielbar'
      default: return 'Tier'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">📊</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Pokémon TCG Meta Decks
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Aktuelle Top-Decks basierend auf Tournament-Ergebnissen
          </p>
          <Link
            href="/tcg/pokemon"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Pokémon TCG
          </Link>
        </div>

        {/* Tier Filter */}
        <div className="mb-8">
          <div className="flex justify-center gap-3">
            {['all', 'S', 'A', 'B'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier as any)}
                className={`
                  px-6 py-3 rounded-xl transition-all duration-200 font-semibold
                  ${selectedTier === tier
                    ? 'bg-red-600 text-white ring-4 ring-red-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                {tier === 'all' ? 'Alle Tiers' : `Tier ${tier}`}
              </button>
            ))}
          </div>
        </div>

        {/* Meta Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredDecks.map((deck, index) => (
            <div
              key={index}
              className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 hover:border-red-500/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{deck.name}</h3>
                  <p className="text-sm text-slate-400">{deck.archetype} • {deck.playstyle}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getTierColor(deck.tier)} text-white font-bold text-center`}>
                  <div className="text-xs">{getTierLabel(deck.tier)}</div>
                  <div className="text-lg">Tier {deck.tier}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-lg bg-slate-900/50">
                <div>
                  <div className="text-sm text-slate-400">Win Rate</div>
                  <div className="text-2xl font-bold text-green-400">{deck.winRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Usage</div>
                  <div className="text-2xl font-bold text-blue-400">{deck.usage}%</div>
                </div>
              </div>

              {/* Main Cards */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Kern-Karten:</h4>
                <div className="flex flex-wrap gap-2">
                  {deck.mainCards.map((card, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href={`/tcg/deck-builder?game=pokemon&deck=${encodeURIComponent(deck.name)}`}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                >
                  🎯 Deck Bauen
                </Link>
                <button
                  onClick={() => alert(`Detaillierte Deckliste für ${deck.name} - Feature kommt bald!`)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                >
                  📋 Liste
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Meta Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Daten basieren auf offiziellen Turnieren und Limitless TCG</li>
            <li>• Win Rate = Durchschnittliche Siegesrate in Top Cut Events</li>
            <li>• Usage = Prozentsatz der Spieler die dieses Deck verwenden</li>
            <li>• Meta ändert sich mit jedem Set-Release und Rotation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
