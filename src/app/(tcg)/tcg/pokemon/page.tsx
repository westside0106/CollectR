'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface PokemonCard {
  id: string
  name: string
  description: string
  image_url: string | null
  price: number
  quantity: number
  status: string
  attributes: {
    tcgGame?: 'pokemon'
    tcgSet?: string
    tcgRarity?: string
    tcgNumber?: string
    tcgGraded?: boolean
    tcgGrade?: string
    tcgGradingCompany?: string
    // Pokemon-specific
    pokemonType?: string
    pokemonTypes?: string[]
    pokemonHP?: number
    pokemonGeneration?: number
  }
  collection_id: string
  collection_name: string
  created_at: string
}

interface PokemonStats {
  totalCards: number
  totalValue: number
  typeDistribution: Record<string, number>
  generationDistribution: Record<number, number>
  gradedCards: number
  averageHP: number
}

const POKEMON_TYPES = {
  'Fire': { emoji: '🔥', bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  'Water': { emoji: '💧', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  'Grass': { emoji: '🌿', bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  'Electric': { emoji: '⚡', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  'Psychic': { emoji: '🔮', bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  'Fighting': { emoji: '👊', bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  'Darkness': { emoji: '🌙', bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400' },
  'Metal': { emoji: '⚙️', bg: 'bg-slate-400/20', border: 'border-slate-400/50', text: 'text-slate-300' },
  'Dragon': { emoji: '🐉', bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  'Fairy': { emoji: '✨', bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  'Colorless': { emoji: '⭐', bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-300' },
  'Lightning': { emoji: '⚡', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
}

export default function PokemonCollectionPage() {
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<PokemonStats>({
    totalCards: 0,
    totalValue: 0,
    typeDistribution: {},
    generationDistribution: {},
    gradedCards: 0,
    averageHP: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all')
  const [selectedSet, setSelectedSet] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showGradedOnly, setShowGradedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'hp' | 'price' | 'recent'>('recent')

  useEffect(() => {
    loadPokemonCards()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cards, selectedType, selectedGeneration, selectedSet, selectedRarity, showGradedOnly, sortBy])

  const loadPokemonCards = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Get all collections for the user
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)

      if (collectionsError) throw collectionsError

      if (!collections || collections.length === 0) {
        setIsLoading(false)
        return
      }

      const collectionIds = collections.map(c => c.id)

      // Get all items that have TCG attributes
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('collection_id', collectionIds)

      if (itemsError) throw itemsError

      // Filter items that are Pokemon cards
      const pokemonCards: PokemonCard[] = (items || [])
        .filter(item => item.attributes?.tcgGame === 'pokemon')
        .map(item => {
          const collection = collections.find(c => c.id === item.collection_id)
          return {
            ...item,
            collection_name: collection?.name || 'Unknown Collection'
          }
        })

      setCards(pokemonCards)
      calculateStats(pokemonCards)
    } catch (error) {
      console.error('Error loading TCG cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (pokemonCards: PokemonCard[]) => {
    const stats: PokemonStats = {
      totalCards: pokemonCards.reduce((sum, card) => sum + card.quantity, 0),
      totalValue: pokemonCards.reduce((sum, card) => sum + (card.price * card.quantity), 0),
      typeDistribution: {},
      generationDistribution: {},
      gradedCards: pokemonCards.filter(card => card.attributes.tcgGraded).length,
      averageHP: 0
    }

    let totalHP = 0
    let hpCount = 0

    pokemonCards.forEach(card => {
      // Type distribution
      const types = card.attributes.pokemonTypes || [card.attributes.pokemonType]
      types.forEach(type => {
        if (type) {
          stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + card.quantity
        }
      })

      // Generation distribution
      const gen = card.attributes.pokemonGeneration
      if (gen) {
        stats.generationDistribution[gen] = (stats.generationDistribution[gen] || 0) + card.quantity
      }

      // Average HP
      if (card.attributes.pokemonHP) {
        totalHP += card.attributes.pokemonHP * card.quantity
        hpCount += card.quantity
      }
    })

    stats.averageHP = hpCount > 0 ? Math.round(totalHP / hpCount) : 0

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = [...cards]

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(card => {
        const types = card.attributes.pokemonTypes || [card.attributes.pokemonType]
        return types.includes(selectedType)
      })
    }

    // Generation filter
    if (selectedGeneration !== 'all') {
      filtered = filtered.filter(card =>
        card.attributes.pokemonGeneration?.toString() === selectedGeneration
      )
    }

    // Set filter
    if (selectedSet !== 'all') {
      filtered = filtered.filter(card => card.attributes.tcgSet === selectedSet)
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(card => card.attributes.tcgRarity === selectedRarity)
    }

    // Graded filter
    if (showGradedOnly) {
      filtered = filtered.filter(card => card.attributes.tcgGraded)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'hp':
          return (b.attributes.pokemonHP || 0) - (a.attributes.pokemonHP || 0)
        case 'price':
          return b.price - a.price
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredCards(filtered)
  }

  const getTypeStyle = (type?: string) => {
    return POKEMON_TYPES[type as keyof typeof POKEMON_TYPES] || POKEMON_TYPES['Colorless']
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'secret rare': return 'text-red-400'
      case 'ultra rare': return 'text-yellow-400'
      case 'rare': return 'text-blue-400'
      case 'uncommon': return 'text-green-400'
      case 'common': return 'text-slate-400'
      default: return 'text-slate-300'
    }
  }

  const uniqueRarities = Array.from(new Set(cards.map(c => c.attributes.tcgRarity).filter(Boolean)))
  const uniqueGenerations = Array.from(new Set(cards.map(c => c.attributes.pokemonGeneration).filter((g): g is number => g !== undefined))).sort((a, b) => a - b)
  const uniqueSets = Array.from(new Set(cards.map(c => c.attributes.tcgSet).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-yellow-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-lg sm:text-2xl">Loading your Pokémon collection...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-yellow-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto container-responsive py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                  🎴 Pokémon Collection
                </span>
              </h1>
              <p className="text-base sm:text-xl text-slate-300 mt-2">
                Gotta Catch 'Em All! - Deine Pokémon TCG Sammlung
              </p>
            </div>
            <Link
              href="/tcg"
              className="button-responsive bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors w-full sm:w-auto text-center whitespace-nowrap"
            >
              ← Zurück zu TCG
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-purple-500/30">
            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🎴</div>
            <div className="text-xl sm:text-3xl font-bold text-white">{stats.totalCards}</div>
            <div className="text-xs sm:text-sm text-slate-400">Total Cards</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-green-500/30">
            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">💰</div>
            <div className="text-xl sm:text-3xl font-bold text-green-400">{stats.totalValue.toFixed(2)} €</div>
            <div className="text-xs sm:text-sm text-slate-400">Collection Value</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-blue-500/30">
            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">⭐</div>
            <div className="text-xl sm:text-3xl font-bold text-blue-400">{stats.gradedCards}</div>
            <div className="text-xs sm:text-sm text-slate-400">Graded Cards</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-yellow-500/30">
            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">❤️</div>
            <div className="text-xl sm:text-3xl font-bold text-yellow-400">{stats.averageHP}</div>
            <div className="text-xs sm:text-sm text-slate-400">Avg. HP</div>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Type Distribution</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
            {Object.entries(stats.typeDistribution).map(([type, count]) => {
              const typeInfo = POKEMON_TYPES[type as keyof typeof POKEMON_TYPES]
              if (!typeInfo) return null
              return (
                <div key={type} className={`text-center p-2 sm:p-4 rounded-lg ${typeInfo.bg} border ${typeInfo.border}`}>
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{typeInfo.emoji}</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{count}</div>
                  <div className={`text-xs sm:text-sm ${typeInfo.text}`}>{type}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Generation Distribution */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Generation Distribution</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-4">
            {Object.entries(stats.generationDistribution).map(([gen, count]) => (
              <div key={gen} className="text-center p-2 sm:p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="text-lg sm:text-2xl font-bold text-white">{count}</div>
                <div className="text-xs sm:text-sm text-slate-400">Gen {gen}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="all">All Types</option>
                {Object.entries(POKEMON_TYPES).map(([type, info]) => (
                  <option key={type} value={type}>{info.emoji} {type}</option>
                ))}
              </select>
            </div>

            {/* Generation Filter */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Generation</label>
              <select
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="all">All Generations</option>
                {uniqueGenerations.map(gen => (
                  <option key={gen} value={gen.toString()}>Gen {gen}</option>
                ))}
              </select>
            </div>

            {/* Set Filter */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Set</label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="all">All Sets</option>
                {uniqueSets.map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Rarity</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="all">All Rarities</option>
                {uniqueRarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="recent">Neueste zuerst</option>
                <option value="name">Name A-Z</option>
                <option value="price">Preis (hoch-niedrig)</option>
                <option value="hp">HP (hoch-niedrig)</option>
              </select>
            </div>

            {/* Graded Toggle and View Mode */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="graded"
                  checked={showGradedOnly}
                  onChange={(e) => setShowGradedOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900/50"
                />
                <label htmlFor="graded" className="text-white text-sm sm:text-base">Nur Graded</label>
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span className="hidden sm:inline">📱 Grid</span>
                  <span className="sm:hidden">📱</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span className="hidden sm:inline">📋 List</span>
                  <span className="sm:hidden">📋</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Display */}
        {filteredCards.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎴</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Noch keine Pokémon Karten</h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
              Füge deine ersten Pokémon TCG Karten hinzu
            </p>
            <Link
              href="/tcg/prices"
              className="inline-block button-responsive bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              🔍 Karten suchen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {filteredCards.map((card) => (
              <Link
                key={card.id}
                href={`/collections/${card.collection_id}/items/${card.id}`}
                className="group relative bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Card Image */}
                <div className="aspect-[3/4] bg-slate-900/50 relative overflow-hidden">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎴
                    </div>
                  )}

                  {/* Graded Badge */}
                  {card.attributes.tcgGraded && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-slate-900 px-2 py-1 rounded text-xs font-bold">
                      {card.attributes.tcgGradingCompany} {card.attributes.tcgGrade}
                    </div>
                  )}

                  {/* Quantity Badge */}
                  {card.quantity > 1 && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                      x{card.quantity}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-2 sm:p-4">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {card.name}
                  </h3>

                  {card.attributes.tcgSet && (
                    <p className="text-xs text-slate-400 mb-1 sm:mb-2 truncate">{card.attributes.tcgSet}</p>
                  )}

                  {card.attributes.tcgRarity && (
                    <p className={`text-xs font-semibold mb-1 sm:mb-2 ${getRarityColor(card.attributes.tcgRarity)}`}>
                      ⭐ {card.attributes.tcgRarity}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-lg font-bold text-green-400">
                      {card.price.toFixed(2)} €
                    </span>
                    <span className="text-xs text-slate-500">
                      🎴
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-slate-700 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-xs sm:text-sm text-slate-400">
                  <th className="p-2 sm:p-4">Card</th>
                  <th className="p-2 sm:p-4 hidden sm:table-cell">Game</th>
                  <th className="p-2 sm:p-4 hidden md:table-cell">Set</th>
                  <th className="p-2 sm:p-4 hidden lg:table-cell">Rarity</th>
                  <th className="p-2 sm:p-4">Qty</th>
                  <th className="p-2 sm:p-4">Price</th>
                  <th className="p-2 sm:p-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-t border-slate-700 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="p-2 sm:p-4">
                      <Link
                        href={`/collections/${card.collection_id}/items/${card.id}`}
                        className="flex items-center gap-2 sm:gap-3 hover:text-purple-400 transition-colors"
                      >
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-8 h-10 sm:w-12 sm:h-16 object-cover rounded border border-slate-600"
                          />
                        )}
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-white">{card.name}</div>
                          {card.attributes.tcgGraded && (
                            <div className="text-xs text-yellow-400">
                              {card.attributes.tcgGradingCompany} {card.attributes.tcgGrade}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="p-2 sm:p-4 hidden sm:table-cell">
                      <span className="text-xs sm:text-sm capitalize text-white">
                        🎴 {card.attributes.tcgGame}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-slate-300 hidden md:table-cell">{card.attributes.tcgSet || '-'}</td>
                    <td className="p-2 sm:p-4 hidden lg:table-cell">
                      <span className={`text-xs sm:text-sm ${getRarityColor(card.attributes.tcgRarity)}`}>
                        {card.attributes.tcgRarity || '-'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-white">{card.quantity}</td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-green-400">{card.price.toFixed(2)} €</td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-green-400 font-bold">
                      {(card.price * card.quantity).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 text-center text-sm sm:text-base text-slate-400">
          {filteredCards.length} von {cards.length} Karten angezeigt
        </div>
      </div>
    </div>
  )
}
