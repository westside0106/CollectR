'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TCGCard {
  id: string
  name: string
  description: string
  image_url: string | null
  price: number
  quantity: number
  status: string
  attributes: {
    tcgGame?: 'pokemon' | 'yugioh' | 'magic'
    tcgSet?: string
    tcgRarity?: string
    tcgNumber?: string
    tcgGraded?: boolean
    tcgGrade?: string
    tcgGradingCompany?: string
  }
  collection_id: string
  collection_name: string
  created_at: string
}

interface TCGStats {
  totalCards: number
  totalValue: number
  rarityDistribution: Record<string, number>
  gameDistribution: Record<string, number>
  gradedCards: number
  setCompletion: Record<string, { have: number; total: number }>
}

export default function TCGCollectionPage() {
  const [cards, setCards] = useState<TCGCard[]>([])
  const [filteredCards, setFilteredCards] = useState<TCGCard[]>([])
  const [stats, setStats] = useState<TCGStats>({
    totalCards: 0,
    totalValue: 0,
    rarityDistribution: {},
    gameDistribution: {},
    gradedCards: 0,
    setCompletion: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [setInfoCache, setSetInfoCache] = useState<Record<string, { total: number, game: string }>>({})

  // Filters
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [selectedSet, setSelectedSet] = useState<string>('all')
  const [showGradedOnly, setShowGradedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'price' | 'recent'>('recent')

  useEffect(() => {
    loadTCGCards()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cards, selectedGame, selectedRarity, selectedSet, showGradedOnly, sortBy])

  const loadTCGCards = async () => {
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

      // Filter items that have tcgGame attribute
      const tcgCards: TCGCard[] = (items || [])
        .filter(item => item.attributes?.tcgGame)
        .map(item => {
          const collection = collections.find(c => c.id === item.collection_id)
          return {
            ...item,
            collection_name: collection?.name || 'Unknown Collection'
          }
        })

      setCards(tcgCards)
      await calculateStats(tcgCards)
    } catch (error) {
      console.error('Error loading TCG cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSetInfo = async (setName: string, game: string): Promise<number> => {
    // Check cache first
    const cacheKey = `${game}:${setName}`
    if (setInfoCache[cacheKey]) {
      return setInfoCache[cacheKey].total
    }

    try {
      const response = await fetch(
        `/api/tcg-set-info?game=${game}&setName=${encodeURIComponent(setName)}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.set) {
          const total = data.set.totalCards || 0
          // Cache the result
          setSetInfoCache(prev => ({
            ...prev,
            [cacheKey]: { total, game }
          }))
          return total
        }
      }
    } catch (error) {
      console.error(`Failed to fetch set info for ${setName}:`, error)
    }

    // Return 0 if fetch failed
    return 0
  }

  const calculateStats = async (tcgCards: TCGCard[]) => {
    const stats: TCGStats = {
      totalCards: tcgCards.reduce((sum, card) => sum + card.quantity, 0),
      totalValue: tcgCards.reduce((sum, card) => sum + (card.price * card.quantity), 0),
      rarityDistribution: {},
      gameDistribution: {},
      gradedCards: tcgCards.filter(card => card.attributes.tcgGraded).length,
      setCompletion: {}
    }

    tcgCards.forEach(card => {
      // Rarity distribution
      const rarity = card.attributes.tcgRarity || 'Unknown'
      stats.rarityDistribution[rarity] = (stats.rarityDistribution[rarity] || 0) + card.quantity

      // Game distribution
      const game = card.attributes.tcgGame || 'Unknown'
      stats.gameDistribution[game] = (stats.gameDistribution[game] || 0) + card.quantity

      // Set completion tracking (prepare data structure)
      const set = card.attributes.tcgSet
      if (set && game !== 'Unknown') {
        if (!stats.setCompletion[set]) {
          stats.setCompletion[set] = { have: 0, total: 0 }
        }
        stats.setCompletion[set].have += card.quantity
      }
    })

    // Fetch real set sizes for all sets
    const setPromises = Object.keys(stats.setCompletion).map(async (setName) => {
      // Find the game for this set from cards
      const cardWithSet = tcgCards.find(c => c.attributes.tcgSet === setName)
      const game = cardWithSet?.attributes.tcgGame || 'pokemon'

      const totalCards = await fetchSetInfo(setName, game)
      stats.setCompletion[setName].total = totalCards
    })

    // Wait for all set info to be fetched
    await Promise.all(setPromises)

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = [...cards]

    // Game filter
    if (selectedGame !== 'all') {
      filtered = filtered.filter(card => card.attributes.tcgGame === selectedGame)
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(card => card.attributes.tcgRarity === selectedRarity)
    }

    // Set filter
    if (selectedSet !== 'all') {
      filtered = filtered.filter(card => card.attributes.tcgSet === selectedSet)
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
        case 'price':
          return b.price - a.price
        case 'rarity':
          return (a.attributes.tcgRarity || '').localeCompare(b.attributes.tcgRarity || '')
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredCards(filtered)
  }

  const getRarityColor = (rarity?: string) => {
    const rarityColors: Record<string, string> = {
      'Common': 'text-slate-400',
      'Uncommon': 'text-green-400',
      'Rare': 'text-blue-400',
      'Ultra Rare': 'text-purple-400',
      'Secret Rare': 'text-yellow-400',
      'Legendary': 'text-orange-400',
      'Mythic': 'text-red-400'
    }
    return rarityColors[rarity || ''] || 'text-slate-400'
  }

  const getGameEmoji = (game?: string) => {
    const gameEmojis: Record<string, string> = {
      'pokemon': '🎴',
      'yugioh': '🃏',
      'magic': '🌟'
    }
    return gameEmojis[game || ''] || '🎴'
  }

  const uniqueSets = Array.from(new Set(cards.map(c => c.attributes.tcgSet).filter(Boolean)))
  const uniqueRarities = Array.from(new Set(cards.map(c => c.attributes.tcgRarity).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-lg sm:text-2xl">Loading your TCG collection...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto container-responsive py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                  🎴 TCG Collection
                </span>
              </h1>
              <p className="text-base sm:text-xl text-slate-300 mt-2">
                Deine Trading Card Game Sammlung
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
            <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">📦</div>
            <div className="text-xl sm:text-3xl font-bold text-yellow-400">{Object.keys(stats.setCompletion).length}</div>
            <div className="text-xs sm:text-sm text-slate-400">Unique Sets</div>
          </div>
        </div>

        {/* Game Distribution */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Game Distribution</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {Object.entries(stats.gameDistribution).map(([game, count]) => (
              <div key={game} className="text-center p-3 sm:p-4 rounded-lg bg-slate-900/50">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{getGameEmoji(game)}</div>
                <div className="text-lg sm:text-2xl font-bold text-white">{count}</div>
                <div className="text-xs sm:text-sm text-slate-400 capitalize">{game}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Game Filter */}
            <div>
              <label className="text-xs sm:text-sm text-slate-400 mb-1 block">Game</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-sm sm:text-base"
              >
                <option value="all">All Games</option>
                <option value="pokemon">🎴 Pokémon</option>
                <option value="yugioh">🃏 Yu-Gi-Oh!</option>
                <option value="magic">🌟 Magic</option>
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
                <option value="rarity">Rarity</option>
              </select>
            </div>

            {/* Graded Toggle */}
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

        {/* Cards Display */}
        {filteredCards.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎴</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Noch keine TCG-Karten</h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
              Füge deine ersten Trading Cards hinzu
            </p>
            <Link
              href="/tcg/prices"
              className="inline-block button-responsive bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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
                      {getGameEmoji(card.attributes.tcgGame)}
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
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {card.name}
                  </h3>

                  {card.attributes.tcgSet && (
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2 line-clamp-1">{card.attributes.tcgSet}</p>
                  )}

                  {card.attributes.tcgRarity && (
                    <p className={`text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 ${getRarityColor(card.attributes.tcgRarity)}`}>
                      ⭐ {card.attributes.tcgRarity}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-lg font-bold text-green-400">
                      {card.price.toFixed(2)} €
                    </span>
                    <span className="text-xs text-slate-500">
                      {getGameEmoji(card.attributes.tcgGame)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr className="text-left text-xs sm:text-sm text-slate-400">
                    <th className="p-2 sm:p-4">Card</th>
                    <th className="p-2 sm:p-4">Game</th>
                    <th className="p-2 sm:p-4 hidden sm:table-cell">Set</th>
                    <th className="p-2 sm:p-4 hidden md:table-cell">Rarity</th>
                    <th className="p-2 sm:p-4">Qty</th>
                    <th className="p-2 sm:p-4">Price</th>
                    <th className="p-2 sm:p-4 hidden sm:table-cell">Total</th>
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
                          <div className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{card.name}</div>
                          {card.attributes.tcgGraded && (
                            <div className="text-[10px] sm:text-xs text-yellow-400">
                              {card.attributes.tcgGradingCompany} {card.attributes.tcgGrade}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="p-2 sm:p-4">
                      <span className="capitalize text-white text-xs sm:text-sm">
                        <span className="sm:hidden">{getGameEmoji(card.attributes.tcgGame)}</span>
                        <span className="hidden sm:inline">{getGameEmoji(card.attributes.tcgGame)} {card.attributes.tcgGame}</span>
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-slate-300 text-xs sm:text-sm hidden sm:table-cell">{card.attributes.tcgSet || '-'}</td>
                    <td className="p-2 sm:p-4 hidden md:table-cell">
                      <span className={`${getRarityColor(card.attributes.tcgRarity)} text-xs sm:text-sm`}>
                        {card.attributes.tcgRarity || '-'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-white text-xs sm:text-sm">{card.quantity}</td>
                    <td className="p-2 sm:p-4 text-green-400 text-xs sm:text-sm">{card.price.toFixed(2)} €</td>
                    <td className="p-2 sm:p-4 text-green-400 font-bold text-xs sm:text-sm hidden sm:table-cell">
                      {(card.price * card.quantity).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 sm:mt-6 text-center text-slate-400 text-sm sm:text-base">
          {filteredCards.length} von {cards.length} Karten angezeigt
        </div>
      </div>
    </div>
  )
}
