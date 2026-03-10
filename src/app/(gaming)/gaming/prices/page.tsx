'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CheapSharkDeal {
  title: string
  salePrice: string
  normalPrice: string
  savings: string
  storeID: string
  thumb: string
  dealID: string
  metacriticScore: string
  steamAppID: string | null
  isOnSale: string
}

const STORE_NAMES: Record<string, string> = {
  '1': 'Steam',
  '7': 'GOG',
  '11': 'Humble',
  '23': 'GameBillet',
  '25': 'GamersGate',
  '27': 'GreenManGaming',
}

const QUICK_TERMS = ['Zelda', 'Elden Ring', 'Cyberpunk', 'Hollow Knight']

function DealCard({ deal }: { deal: CheapSharkDeal }) {
  const salePrice = parseFloat(deal.salePrice)
  const normalPrice = parseFloat(deal.normalPrice)
  const savings = parseFloat(deal.savings)
  const metacritic = parseInt(deal.metacriticScore, 10)
  const storeName = STORE_NAMES[deal.storeID] ?? `Store ${deal.storeID}`
  const dealLink = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-900/20">
      {/* Thumbnail */}
      <div className="relative">
        {deal.thumb ? (
          <img
            src={deal.thumb}
            alt={deal.title}
            className="w-full h-32 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-32 bg-slate-900 flex items-center justify-center text-4xl">
            🎮
          </div>
        )}
        {savings > 0 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{Math.round(savings)}%
          </div>
        )}
        {metacritic > 0 && (
          <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-lg ${
            metacritic >= 75 ? 'bg-green-600' : metacritic >= 50 ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            MC {metacritic}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-2 leading-tight">{deal.title}</h3>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-green-400 text-lg font-bold">
            ${salePrice.toFixed(2)}
          </span>
          {savings > 0 && (
            <span className="text-slate-500 text-xs line-through">
              ${normalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">{storeName}</span>
          <a
            href={dealLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Zum Deal ↗
          </a>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden animate-pulse">
          <div className="w-full h-32 bg-slate-700" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-700 rounded w-3/4" />
            <div className="h-5 bg-slate-700 rounded w-1/2" />
            <div className="h-7 bg-slate-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GamingPricesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CheapSharkDeal[]>([])
  const [trendingDeals, setTrendingDeals] = useState<CheapSharkDeal[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    loadTrending()
  }, [])

  async function loadTrending() {
    setIsTrendingLoading(true)
    try {
      const params = new URLSearchParams({
        pageSize: '12',
        sortBy: 'Savings',
      })
      const response = await fetch(`https://www.cheapshark.com/api/1.0/deals?${params}`, {
        headers: { 'Accept': 'application/json' }
      })
      if (!response.ok) throw new Error('API error')
      const deals = await response.json() as CheapSharkDeal[]
      setTrendingDeals(deals)
    } catch (err) {
      console.error('Failed to load trending deals:', err)
    } finally {
      setIsTrendingLoading(false)
    }
  }

  async function handleSearch(query?: string) {
    const q = (query ?? searchQuery).trim()
    if (!q) return

    if (query) setSearchQuery(query)
    setIsSearching(true)
    setError(null)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        title: encodeURIComponent(q),
        pageSize: '20',
        sortBy: 'Price',
      })
      const response = await fetch(`https://www.cheapshark.com/api/1.0/deals?${params}`, {
        headers: { 'Accept': 'application/json' }
      })
      if (!response.ok) throw new Error('API-Fehler beim Abrufen der Deals')
      const deals = await response.json() as CheapSharkDeal[]
      setSearchResults(deals)
      if (deals.length === 0) {
        setError(`Keine Deals gefunden für "${q}"`)
      }
    } catch (err) {
      setError('Fehler beim Laden der Preise. Bitte erneut versuchen.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleQuickSearch(term: string) {
    setSearchQuery(term)
    handleSearch(term)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">💰</span>
            <h1 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-green-400 bg-clip-text text-transparent">
                Gaming Deals
              </span>
            </h1>
          </div>
          <p className="text-lg text-slate-300 mb-1">
            Echtzeit-Preise von 30+ Shops — powered by CheapShark
          </p>
          <Link
            href="/gaming"
            className="inline-block mt-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Gaming Übersicht
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Spiel suchen (z.B. Cyberpunk 2077)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSearching ? '🔄 Suche...' : '🔍 Suchen'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Schnellsuche:</span>
            {QUICK_TERMS.map(term => (
              <button
                key={term}
                onClick={() => handleQuickSearch(term)}
                className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-purple-700 hover:text-white transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                🔍 Suchergebnisse
                {searchResults.length > 0 && (
                  <span className="text-base font-normal text-slate-400 ml-2">({searchResults.length} Deals)</span>
                )}
              </h2>
              {searchResults.length > 0 && (
                <button
                  onClick={() => { setHasSearched(false); setSearchResults([]); setSearchQuery(''); setError(null) }}
                  className="text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  Zurücksetzen
                </button>
              )}
            </div>

            {isSearching ? (
              <LoadingSkeleton count={8} />
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map(deal => (
                  <DealCard key={deal.dealID} deal={deal} />
                ))}
              </div>
            ) : !error ? (
              <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-10 text-center">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-slate-400">Keine Deals gefunden</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Trending Deals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">🔥 Trending Deals</h2>
            <span className="text-sm text-slate-400">– beste Rabatte gerade</span>
          </div>

          {isTrendingLoading ? (
            <LoadingSkeleton count={12} />
          ) : trendingDeals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingDeals.map(deal => (
                <DealCard key={deal.dealID} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-10 text-center">
              <div className="text-4xl mb-3">😴</div>
              <p className="text-slate-400">Trending-Deals konnten nicht geladen werden</p>
              <button onClick={loadTrending} className="mt-3 text-sm text-purple-400 hover:text-purple-300 transition">
                Erneut versuchen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500">
            Powered by CheapShark API · Keine API-Key · Echtzeit-Preise von 30+ Shops
          </p>
        </div>

      </div>
    </div>
  )
}
