'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type GameType = 'pokemon' | 'yugioh' | 'magic'

interface PriceResult {
  cardName: string
  setName?: string
  imageUrl?: string
  prices: {
    market?: number
    low?: number
    mid?: number
    high?: number
  }
  currency: string
  source: string
  lastUpdated: string
}

function TCGPricesContent() {
  const searchParams = useSearchParams()
  const [selectedGame, setSelectedGame] = useState<GameType>('pokemon')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PriceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const game = searchParams.get('game') as GameType
    if (game && ['pokemon', 'yugioh', 'magic'].includes(game)) {
      setSelectedGame(game)
    }
  }, [searchParams])

  // Clear search when game changes
  useEffect(() => {
    setSearchQuery('')
    setSearchResults([])
  }, [selectedGame])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch(
        `/api/card-prices?game=${selectedGame}&query=${encodeURIComponent(searchQuery)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch prices')
      }

      const data: PriceResult[] = await response.json()
      setSearchResults(data)

      if (data.length === 0) {
        alert(`❌ Keine Preise gefunden für "${searchQuery}".\n\nTipps:\n• Versuche verschiedene Schreibweisen\n• Prüfe die Rechtschreibung\n• Nicht alle Karten haben verfügbare Preisdaten`)
      }
    } catch (error) {
      console.error('Price search error:', error)
      alert('❌ Fehler beim Laden der Preise. Bitte versuche es erneut.')
    } finally {
      setIsSearching(false)
    }
  }

  const openEbaySoldListings = (cardName: string) => {
    const ebayUrl = `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(cardName)}&_sacat=0&LH_Complete=1&LH_Sold=1`
    window.open(ebayUrl, '_blank')
  }

  const trendingCards = [
    { name: 'Charizard VMAX', game: 'pokemon', price: 245.00, change: '+15%' },
    { name: 'Dark Magician Girl', game: 'yugioh', price: 89.50, change: '+8%' },
    { name: 'Black Lotus', game: 'magic', price: 25000.00, change: '+2%' },
    { name: 'Pikachu VMAX', game: 'pokemon', price: 12.50, change: '-5%' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">💰</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                TCG Price Checker
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Live Marktpreise & Trends für alle Trading Card Games
          </p>
          <Link
            href="/tcg"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu TCG Übersicht
          </Link>
        </div>

        {/* Game Selection */}
        <div className="mb-8">
          <div className="flex justify-center gap-3">
            {[
              { id: 'pokemon', name: 'Pokémon', emoji: '🎴' },
              { id: 'yugioh', name: 'Yu-Gi-Oh!', emoji: '🃏' },
              { id: 'magic', name: 'Magic', emoji: '🌟' }
            ].map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id as GameType)}
                className={`
                  px-6 py-3 rounded-xl transition-all duration-200 font-semibold
                  ${selectedGame === game.id
                    ? 'bg-green-600 text-white ring-4 ring-green-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <span className="text-2xl mr-2">{game.emoji}</span>
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder={`Suche nach ${selectedGame === 'pokemon' ? 'Pokémon' : selectedGame === 'yugioh' ? 'Yu-Gi-Oh!' : 'Magic'} Karten...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? '🔄 Suche...' : '🔍 Suchen'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-400">Schnellsuche:</span>
            {selectedGame === 'pokemon' && ['Charizard', 'Pikachu', 'Mewtwo'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  setTimeout(() => handleSearch(), 100)
                }}
                className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-all"
              >
                {term}
              </button>
            ))}
            {selectedGame === 'yugioh' && ['Dark Magician', 'Blue-Eyes', 'Red-Eyes'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  setTimeout(() => handleSearch(), 100)
                }}
                className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-all"
              >
                {term}
              </button>
            ))}
            {selectedGame === 'magic' && ['Lightning Bolt', 'Counterspell', 'Sol Ring'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  setTimeout(() => handleSearch(), 100)
                }}
                className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Suchergebnisse</h2>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg bg-slate-900/50 border border-slate-600"
                >
                  <div className="flex gap-4 mb-4">
                    {result.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={result.imageUrl}
                          alt={result.cardName}
                          className="w-24 h-auto rounded-lg border-2 border-slate-700"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{result.cardName}</h3>
                        {result.setName && (
                          <p className="text-sm text-slate-400 mb-2">{result.setName}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          Quelle: {result.source} • {new Date(result.lastUpdated).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">
                          {result.prices.market?.toFixed(2)} €
                        </div>
                        <div className="text-sm font-semibold text-slate-400 mt-1">
                          Marktpreis
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Details */}
                  {(result.prices.low || result.prices.mid || result.prices.high) && (
                    <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-slate-700">
                      {result.prices.low && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">LOW</div>
                          <div className="text-lg font-semibold text-slate-300">{result.prices.low.toFixed(2)} €</div>
                        </div>
                      )}
                      {result.prices.mid && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">MID</div>
                          <div className="text-lg font-semibold text-slate-300">{result.prices.mid.toFixed(2)} €</div>
                        </div>
                      )}
                      {result.prices.high && (
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">HIGH</div>
                          <div className="text-lg font-semibold text-slate-300">{result.prices.high.toFixed(2)} €</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/collections/new?prefill=${encodeURIComponent(JSON.stringify({ name: result.cardName, price: result.prices.market }))}`}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                    >
                      ➕ Zu Sammlung
                    </Link>
                    <button
                      onClick={() => openEbaySoldListings(result.cardName)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      🛒 eBay Verkäufe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Trending Cards */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🔥 Trending Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingCards.map((card, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-600 hover:border-green-500/50 transition-all cursor-pointer"
              >
                <div className="text-sm text-slate-400 mb-1 capitalize">{card.game}</div>
                <h3 className="font-semibold text-white mb-2">{card.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-400">
                    {card.price.toFixed(2)} €
                  </span>
                  <span className={`text-sm font-semibold ${
                    card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {card.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Live Pricing</h3>
            <p className="text-sm text-slate-400">
              Echtzeit-Preise von pokemontcg.io, YGOPRODeck & Scryfall
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-semibold text-white mb-2">Price History</h3>
            <p className="text-sm text-slate-400">
              Verfolge Preisentwicklungen über Zeit mit Charts
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="font-semibold text-white mb-2">Price Alerts</h3>
            <p className="text-sm text-slate-400">
              Benachrichtigungen bei Preisänderungen deiner Watch-List
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Price Checker Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Preise werden von offiziellen APIs bezogen (pokemontcg.io, YGOPRODeck, Scryfall)</li>
            <li>• 24h Caching für schnellere Abfragen</li>
            <li>• Graded Card Preise werden automatisch mit Multiplier berechnet</li>
            <li>• Preise in EUR (automatische Umrechnung von USD)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function TCGPricesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
      <TCGPricesContent />
    </Suspense>
  )
}
