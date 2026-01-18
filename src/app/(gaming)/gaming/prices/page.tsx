'use client'

import { useState } from 'react'
import Link from 'next/link'

type GamePlatform = 'all' | 'playstation' | 'xbox' | 'nintendo' | 'pc'

interface PriceComparison {
  gameName: string
  platform: string
  prices: Array<{
    retailer: string
    price: number
    url: string
    availability: 'in_stock' | 'limited' | 'out_of_stock'
  }>
  lowestPrice: number
  highestPrice: number
  averagePrice: number
}

export default function GamingPricesPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<GamePlatform>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PriceComparison[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // TODO: Implement actual price search
    // For now, show placeholder
    setTimeout(() => {
      setSearchResults([])
      setIsSearching(false)
    }, 1000)
  }

  // TODO: Replace with real-time trending data from API
  const trendingGames = [
    { name: 'The Legend of Zelda: Tears of the Kingdom', platform: 'Nintendo Switch', price: 59.99, trend: '+5%' },
    { name: 'Baldur\'s Gate 3', platform: 'PC', price: 59.99, trend: '+2%' },
    { name: 'Spider-Man 2', platform: 'PlayStation 5', price: 69.99, trend: '-8%' },
    { name: 'Starfield', platform: 'Xbox Series X', price: 69.99, trend: '-15%' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">💰</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Gaming Price Checker
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Vergleiche Preise für Spiele über alle Händler
          </p>
          <Link
            href="/gaming"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Gaming Übersicht
          </Link>
        </div>

        {/* Platform Selection */}
        <div className="mb-4 sm:mb-6 sm:mb-8">
          <div className="flex justify-center gap-3">
            {[
              { id: 'all', name: 'Alle', emoji: '🎮' },
              { id: 'playstation', name: 'PlayStation', emoji: '🎮' },
              { id: 'xbox', name: 'Xbox', emoji: '🟢' },
              { id: 'nintendo', name: 'Nintendo', emoji: '🔴' },
              { id: 'pc', name: 'PC', emoji: '💻' }
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id as GamePlatform)}
                className={`
                  px-6 py-3 rounded-xl transition-all duration-200 font-semibold
                  ${selectedPlatform === platform.id
                    ? 'bg-purple-600 text-white ring-4 ring-purple-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                <span className="text-2xl mr-2">{platform.emoji}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl card-padding border border-slate-700 mb-4 sm:mb-6 sm:mb-8">
          <div className="flex gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Suche nach Spiel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? '🔄 Suche...' : '🔍 Suchen'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-400">Schnellsuche:</span>
            {['Zelda', 'FIFA 24', 'GTA 6', 'Elden Ring'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  handleSearch()
                }}
                className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl card-padding border border-slate-700 mb-4 sm:mb-6 sm:mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Preisvergleich</h2>
            {/* Results would go here */}
          </div>
        )}

        {/* Trending Games */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl card-padding border border-slate-700 mb-4 sm:mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🔥 Trending Spiele</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {trendingGames.map((game, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-600 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <div className="text-sm text-slate-400 mb-1">{game.platform}</div>
                <h3 className="font-semibold text-white mb-2 text-sm">{game.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-green-400">
                    {game.price.toFixed(2)} €
                  </span>
                  <span className={`text-sm font-semibold ${
                    game.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {game.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retailers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 sm:mb-8">
          {['Amazon', 'MediaMarkt', 'GameStop', 'Steam'].map((retailer) => (
            <div key={retailer} className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-semibold text-white">{retailer}</h3>
              <p className="text-xs text-slate-400 mt-1">Preise werden verglichen</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Echtzeit-Preise</h3>
            <p className="text-sm text-slate-400">
              Aktuelle Preise von allen großen Händlern
            </p>
          </div>

          <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-semibold text-white mb-2">Preisverlauf</h3>
            <p className="text-sm text-slate-400">
              Historische Preisentwicklung mit Charts
            </p>
          </div>

          <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="font-semibold text-white mb-2">Preis-Alerts</h3>
            <p className="text-sm text-slate-400">
              Benachrichtigung bei Preissenkungen
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 card-padding rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Price Checker Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Preise werden täglich aktualisiert</li>
            <li>• Vergleicht über 10 verschiedene Händler</li>
            <li>• Berücksichtigt Versandkosten</li>
            <li>• Zeigt Verfügbarkeit in Echtzeit</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
