'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTCGStats } from '@/hooks/useTCGStats'

type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'fighting' | 'dark' | 'steel' | 'dragon' | 'fairy'

export default function PokemonTCGPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<PokemonType | null>(null)
  const { stats, loading } = useTCGStats('pokemon')

  const typeChart: Record<PokemonType, { emoji: string; color: string; weakTo: string[]; strongVs: string[] }> = {
    fire: { emoji: '🔥', color: 'from-red-500 to-orange-500', weakTo: ['Water', 'Ground', 'Rock'], strongVs: ['Grass', 'Ice', 'Bug', 'Steel'] },
    water: { emoji: '💧', color: 'from-blue-500 to-cyan-500', weakTo: ['Electric', 'Grass'], strongVs: ['Fire', 'Ground', 'Rock'] },
    grass: { emoji: '🌿', color: 'from-green-500 to-emerald-500', weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], strongVs: ['Water', 'Ground', 'Rock'] },
    electric: { emoji: '⚡', color: 'from-yellow-400 to-amber-400', weakTo: ['Ground'], strongVs: ['Water', 'Flying'] },
    psychic: { emoji: '🔮', color: 'from-pink-500 to-purple-500', weakTo: ['Bug', 'Ghost', 'Dark'], strongVs: ['Fighting', 'Poison'] },
    fighting: { emoji: '🥊', color: 'from-orange-600 to-red-600', weakTo: ['Flying', 'Psychic', 'Fairy'], strongVs: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'] },
    dark: { emoji: '🌑', color: 'from-gray-800 to-slate-900', weakTo: ['Fighting', 'Bug', 'Fairy'], strongVs: ['Psychic', 'Ghost'] },
    steel: { emoji: '⚙️', color: 'from-slate-400 to-gray-500', weakTo: ['Fire', 'Fighting', 'Ground'], strongVs: ['Ice', 'Rock', 'Fairy'] },
    dragon: { emoji: '🐲', color: 'from-indigo-600 to-purple-700', weakTo: ['Ice', 'Dragon', 'Fairy'], strongVs: ['Dragon'] },
    fairy: { emoji: '✨', color: 'from-pink-400 to-rose-400', weakTo: ['Poison', 'Steel'], strongVs: ['Fighting', 'Dragon', 'Dark'] }
  }

  const tools = [
    {
      icon: '🎴',
      title: 'Deck Builder',
      description: 'Erstelle wettbewerbsfähige Decks',
      link: '/tcg/deck-builder?game=pokemon'
    },
    {
      icon: '📊',
      title: 'Meta Decks',
      description: 'Top Tournament Decks',
      link: '/tcg/pokemon/meta-decks'
    },
    {
      icon: '💰',
      title: 'Preis-Scanner',
      description: 'Aktuelle Kartenpreise',
      link: '/tcg/prices?game=pokemon'
    },
    {
      icon: '📈',
      title: 'Price Trends',
      description: 'Marktentwicklung',
      link: '/tcg/pokemon/price-trends'
    }
  ]

  const popularSets = [
    { name: 'Base Set', year: '1999', icon: '🌟' },
    { name: 'Jungle', year: '1999', icon: '🌴' },
    { name: 'Fossil', year: '1999', icon: '🦴' },
    { name: 'Team Rocket', year: '2000', icon: '🚀' },
    { name: 'Neo Genesis', year: '2000', icon: '💫' },
    { name: 'EX Series', year: '2003-2007', icon: '⭐' },
    { name: 'Diamond & Pearl', year: '2007-2009', icon: '💎' },
    { name: 'Black & White', year: '2011-2013', icon: '⚫⚪' },
    { name: 'XY', year: '2014-2016', icon: '✖️' },
    { name: 'Sun & Moon', year: '2017-2019', icon: '☀️🌙' },
    { name: 'Sword & Shield', year: '2020-2022', icon: '⚔️🛡️' },
    { name: 'Scarlet & Violet', year: '2023+', icon: '🔴🟣' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🎴</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Pokémon TCG
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300 italic">Gotta Catch 'Em All!</p>
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
              className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 transition-all duration-200"
            >
              <div className="text-4xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-red-400 transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-slate-400">{tool.description}</p>
            </Link>
          ))}
        </div>

        {/* Type Matchup Chart */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">⚔️ Typ-Matchup Chart</h2>
          <p className="text-slate-400 mb-6">Klicke auf einen Typ für Details zu Stärken & Schwächen</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(Object.keys(typeChart) as PokemonType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`
                  p-4 rounded-xl transition-all duration-200 transform hover:scale-105
                  ${selectedType === type
                    ? 'ring-4 ring-white/50 shadow-2xl'
                    : 'hover:shadow-xl'
                  }
                  bg-gradient-to-br ${typeChart[type].color}
                `}
              >
                <div className="text-4xl mb-2">{typeChart[type].emoji}</div>
                <div className="text-sm font-semibold text-white capitalize">{type}</div>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="mt-6 p-6 rounded-xl bg-slate-700/50 border border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{typeChart[selectedType].emoji}</span>
                <h3 className="text-2xl font-bold text-white capitalize">{selectedType}</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Stark gegen
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typeChart[selectedType].strongVs.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 text-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Schwach gegen
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typeChart[selectedType].weakTo.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Popular Sets */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6">📦 Beliebte Sets</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularSets.map((set) => (
              <button
                key={set.name}
                onClick={() => router.push(`/tcg/pokemon/sets/${set.name.toLowerCase().replace(/\s+/g, '-')}`)}
                className="p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-red-500/50 transition-all text-center"
              >
                <div className="text-3xl mb-2">{set.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{set.name}</div>
                <div className="text-xs text-slate-400">{set.year}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/tcg/pokemon/sets')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <span>Alle Sets Anzeigen</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-3xl font-bold text-red-400 mb-1">
              {loading ? '...' : stats.totalCards}
            </div>
            <div className="text-sm text-slate-400">Pokémon Cards</div>
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
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {loading ? '...' : stats.hotCards}
            </div>
            <div className="text-sm text-slate-400">Graded Cards</div>
          </div>
        </div>
      </div>
    </div>
  )
}
