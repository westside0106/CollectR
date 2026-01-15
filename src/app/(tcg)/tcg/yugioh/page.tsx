'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface YuGiOhCard {
  id: string
  name: string
  description: string
  image_url: string | null
  price: number
  quantity: number
  status: string
  attributes: {
    tcgGame?: 'yugioh'
    tcgSet?: string
    tcgRarity?: string
    tcgNumber?: string
    tcgGraded?: boolean
    tcgGrade?: string
    tcgGradingCompany?: string
    // Yu-Gi-Oh!-specific
    yugiohCardType?: string // Monster, Spell, Trap
    yugiohAttribute?: string // DARK, LIGHT, FIRE, etc.
    yugiohLevel?: number
    yugiohRank?: number // XYZ
    yugiohATK?: number
    yugiohDEF?: number
    yugiohMonsterType?: string // Dragon, Spellcaster, etc.
  }
  collection_id: string
  collection_name: string
  created_at: string
}

interface YuGiOhStats {
  totalCards: number
  totalValue: number
  attributeDistribution: Record<string, number>
  cardTypeDistribution: Record<string, number>
  gradedCards: number
  averageATK: number
  averageDEF: number
}

const YUGIOH_ATTRIBUTES = {
  'DARK': { emoji: '🌙', bg: 'bg-purple-900/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  'LIGHT': { emoji: '✨', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  'FIRE': { emoji: '🔥', bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  'WATER': { emoji: '💧', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  'EARTH': { emoji: '🌍', bg: 'bg-amber-600/20', border: 'border-amber-600/50', text: 'text-amber-400' },
  'WIND': { emoji: '💨', bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  'DIVINE': { emoji: '👁️', bg: 'bg-yellow-300/20', border: 'border-yellow-300/50', text: 'text-yellow-200' },
}

const YUGIOH_CARD_TYPES = {
  'Monster': { emoji: '👹', color: 'text-orange-400' },
  'Spell': { emoji: '📗', color: 'text-green-400' },
  'Trap': { emoji: '🪤', color: 'text-pink-400' },
}

export default function YuGiOhCollectionPage() {
  const [cards, setCards] = useState<YuGiOhCard[]>([])
  const [filteredCards, setFilteredCards] = useState<YuGiOhCard[]>([])
  const [stats, setStats] = useState<YuGiOhStats>({
    totalCards: 0,
    totalValue: 0,
    attributeDistribution: {},
    cardTypeDistribution: {},
    gradedCards: 0,
    averageATK: 0,
    averageDEF: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedAttribute, setSelectedAttribute] = useState<string>('all')
  const [selectedCardType, setSelectedCardType] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedSet, setSelectedSet] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [showGradedOnly, setShowGradedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'atk' | 'price' | 'recent'>('recent')

  useEffect(() => {
    loadYuGiOhCards()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cards, selectedAttribute, selectedCardType, selectedLevel, selectedSet, selectedRarity, showGradedOnly, sortBy])

  const loadYuGiOhCards = async () => {
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

      // Filter items that are Yu-Gi-Oh! cards
      const yugiohCards: YuGiOhCard[] = (items || [])
        .filter(item => item.attributes?.tcgGame === 'yugioh')
        .map(item => {
          const collection = collections.find(c => c.id === item.collection_id)
          return {
            ...item,
            collection_name: collection?.name || 'Unknown Collection'
          }
        })

      setCards(yugiohCards)
      calculateStats(yugiohCards)
    } catch (error) {
      console.error('Error loading TCG cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (yugiohCards: YuGiOhCard[]) => {
    const stats: YuGiOhStats = {
      totalCards: yugiohCards.reduce((sum, card) => sum + card.quantity, 0),
      totalValue: yugiohCards.reduce((sum, card) => sum + (card.price * card.quantity), 0),
      attributeDistribution: {},
      cardTypeDistribution: {},
      gradedCards: yugiohCards.filter(card => card.attributes.tcgGraded).length,
      averageATK: 0,
      averageDEF: 0
    }

    let totalATK = 0
    let atkCount = 0
    let totalDEF = 0
    let defCount = 0

    yugiohCards.forEach(card => {
      // Attribute distribution
      const attribute = card.attributes.yugiohAttribute
      if (attribute) {
        stats.attributeDistribution[attribute] = (stats.attributeDistribution[attribute] || 0) + card.quantity
      }

      // Card Type distribution (Monster/Spell/Trap)
      const cardType = card.attributes.yugiohCardType
      if (cardType) {
        stats.cardTypeDistribution[cardType] = (stats.cardTypeDistribution[cardType] || 0) + card.quantity
      }

      // Average ATK/DEF
      if (card.attributes.yugiohATK !== undefined) {
        totalATK += card.attributes.yugiohATK * card.quantity
        atkCount += card.quantity
      }
      if (card.attributes.yugiohDEF !== undefined) {
        totalDEF += card.attributes.yugiohDEF * card.quantity
        defCount += card.quantity
      }
    })

    stats.averageATK = atkCount > 0 ? Math.round(totalATK / atkCount) : 0
    stats.averageDEF = defCount > 0 ? Math.round(totalDEF / defCount) : 0

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = [...cards]

    // Attribute filter
    if (selectedAttribute !== 'all') {
      filtered = filtered.filter(card => card.attributes.yugiohAttribute === selectedAttribute)
    }

    // Card Type filter
    if (selectedCardType !== 'all') {
      filtered = filtered.filter(card => card.attributes.yugiohCardType === selectedCardType)
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(card =>
        card.attributes.yugiohLevel?.toString() === selectedLevel ||
        card.attributes.yugiohRank?.toString() === selectedLevel
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
        case 'atk':
          return (b.attributes.yugiohATK || 0) - (a.attributes.yugiohATK || 0)
        case 'price':
          return b.price - a.price
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredCards(filtered)
  }

  const getAttributeStyle = (attribute?: string) => {
    return YUGIOH_ATTRIBUTES[attribute as keyof typeof YUGIOH_ATTRIBUTES] || YUGIOH_ATTRIBUTES['DARK']
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'secret rare': return 'text-red-400'
      case 'ultra rare': return 'text-yellow-400'
      case 'rare': return 'text-blue-400'
      case 'super rare': return 'text-purple-400'
      case 'common': return 'text-slate-400'
      default: return 'text-slate-300'
    }
  }

  const uniqueRarities = Array.from(new Set(cards.map(c => c.attributes.tcgRarity).filter(Boolean)))
  const uniqueLevels = Array.from(new Set(cards.map(c => c.attributes.yugiohLevel || c.attributes.yugiohRank).filter(Boolean))).sort((a, b) => a - b)
  const uniqueSets = Array.from(new Set(cards.map(c => c.attributes.tcgSet).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center">
        <div className="text-white text-2xl">Loading your Yu-Gi-Oh! collection...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-pink-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  🃏 Yu-Gi-Oh! Collection
                </span>
              </h1>
              <p className="text-xl text-slate-300 mt-2">
                It's Time to Duel! - Deine Yu-Gi-Oh! TCG Sammlung
              </p>
            </div>
            <Link
              href="/tcg"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ← Zurück zu TCG
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <div className="text-4xl mb-2">🎴</div>
            <div className="text-3xl font-bold text-white">{stats.totalCards}</div>
            <div className="text-sm text-slate-400">Total Cards</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-400">{stats.totalValue.toFixed(2)} €</div>
            <div className="text-sm text-slate-400">Collection Value</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-blue-400">{stats.gradedCards}</div>
            <div className="text-sm text-slate-400">Graded Cards</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.averageATK} / {stats.averageDEF}</div>
            <div className="text-sm text-slate-400">Avg. ATK / DEF</div>
          </div>
        </div>

        {/* Attribute Distribution */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Attribute Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {Object.entries(stats.attributeDistribution).map(([attribute, count]) => {
              const attrInfo = YUGIOH_ATTRIBUTES[attribute as keyof typeof YUGIOH_ATTRIBUTES]
              if (!attrInfo) return null
              return (
                <div key={attribute} className={`text-center p-4 rounded-lg ${attrInfo.bg} border ${attrInfo.border}`}>
                  <div className="text-3xl mb-2">{attrInfo.emoji}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className={`text-sm ${attrInfo.text}`}>{attribute}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Type Distribution */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Card Type Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.cardTypeDistribution).map(([type, count]) => {
              const typeInfo = YUGIOH_CARD_TYPES[type as keyof typeof YUGIOH_CARD_TYPES]
              if (!typeInfo) return null
              return (
                <div key={type} className="text-center p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="text-3xl mb-2">{typeInfo.emoji}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className={`text-sm ${typeInfo.color}`}>{type}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Attribute Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Attribute</label>
              <select
                value={selectedAttribute}
                onChange={(e) => setSelectedAttribute(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="all">All Attributes</option>
                {Object.entries(YUGIOH_ATTRIBUTES).map(([attr, info]) => (
                  <option key={attr} value={attr}>{info.emoji} {attr}</option>
                ))}
              </select>
            </div>

            {/* Card Type Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Card Type</label>
              <select
                value={selectedCardType}
                onChange={(e) => setSelectedCardType(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="all">All Types</option>
                {Object.entries(YUGIOH_CARD_TYPES).map(([type, info]) => (
                  <option key={type} value={type}>{info.emoji} {type}</option>
                ))}
              </select>
            </div>

            {/* Level/Rank Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Level/Rank</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="all">All Levels</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level.toString()}>★{level}</option>
                ))}
              </select>
            </div>

            {/* Set Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Set</label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="all">All Sets</option>
                {uniqueSets.map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Rarity</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="all">All Rarities</option>
                {uniqueRarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </div>

            {/* Graded Toggle */}
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="graded"
                checked={showGradedOnly}
                onChange={(e) => setShowGradedOnly(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-900/50"
              />
              <label htmlFor="graded" className="text-white">Nur Graded</label>
            </div>

            {/* View Mode */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📱 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📋 List
              </button>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white"
              >
                <option value="recent">Neueste zuerst</option>
                <option value="name">Name A-Z</option>
                <option value="price">Preis (hoch-niedrig)</option>
                <option value="rarity">Rarity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards Display */}
        {filteredCards.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🎴</div>
            <h3 className="text-2xl font-bold text-white mb-2">Noch keine TCG-Karten</h3>
            <p className="text-slate-400 mb-6">
              Füge deine ersten Trading Cards hinzu
            </p>
            <Link
              href="/tcg/prices"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              🔍 Karten suchen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                      🃏
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
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {card.name}
                  </h3>

                  {card.attributes.tcgSet && (
                    <p className="text-xs text-slate-400 mb-2">{card.attributes.tcgSet}</p>
                  )}

                  {card.attributes.tcgRarity && (
                    <p className={`text-xs font-semibold mb-2 ${getRarityColor(card.attributes.tcgRarity)}`}>
                      ⭐ {card.attributes.tcgRarity}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-400">
                      {card.price.toFixed(2)} €
                    </span>
                    <span className="text-xs text-slate-500">
                      🃏
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="p-4">Card</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Set</th>
                  <th className="p-4">Rarity</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-t border-slate-700 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/collections/${card.collection_id}/items/${card.id}`}
                        className="flex items-center gap-3 hover:text-purple-400 transition-colors"
                      >
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-12 h-16 object-cover rounded border border-slate-600"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-white">{card.name}</div>
                          {card.attributes.tcgGraded && (
                            <div className="text-xs text-yellow-400">
                              {card.attributes.tcgGradingCompany} {card.attributes.tcgGrade}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-white">
                        🃏 {card.attributes.tcgGame}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{card.attributes.tcgSet || '-'}</td>
                    <td className="p-4">
                      <span className={getRarityColor(card.attributes.tcgRarity)}>
                        {card.attributes.tcgRarity || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-white">{card.quantity}</td>
                    <td className="p-4 text-green-400">{card.price.toFixed(2)} €</td>
                    <td className="p-4 text-green-400 font-bold">
                      {(card.price * card.quantity).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 text-center text-slate-400">
          {filteredCards.length} von {cards.length} Karten angezeigt
        </div>
      </div>
    </div>
  )
}
