'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScryfallCard {
  id: string
  name: string
  mana_cost?: string
  type_line: string
  oracle_text?: string
  image_uris?: { small: string; normal: string; art_crop: string }
  card_faces?: Array<{ image_uris?: { small: string; normal: string } }>
  prices: { usd?: string; usd_foil?: string; eur?: string; eur_foil?: string }
  set_name: string
  rarity: string
  colors?: string[]
}

interface ScryfallResponse {
  data: ScryfallCard[]
  has_more: boolean
  total_cards: number
}

const POPULAR_PRESETS = ['Lightning Bolt', 'Black Lotus', 'Counterspell', 'Sol Ring']

const COLOR_FILTERS = [
  { code: 'W', emoji: '☀️', label: 'White', bg: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' },
  { code: 'U', emoji: '💧', label: 'Blue', bg: 'bg-blue-500/20 border-blue-400/50 text-blue-300' },
  { code: 'B', emoji: '💀', label: 'Black', bg: 'bg-purple-900/30 border-purple-500/50 text-purple-300' },
  { code: 'R', emoji: '🔥', label: 'Red', bg: 'bg-red-500/20 border-red-400/50 text-red-300' },
  { code: 'G', emoji: '🌳', label: 'Green', bg: 'bg-green-500/20 border-green-400/50 text-green-300' },
]

function getRarityColor(rarity: string) {
  switch (rarity.toLowerCase()) {
    case 'mythic': return 'text-orange-400'
    case 'rare': return 'text-yellow-400'
    case 'uncommon': return 'text-blue-400'
    case 'common': return 'text-slate-400'
    default: return 'text-slate-300'
  }
}

function getRarityBadge(rarity: string) {
  switch (rarity.toLowerCase()) {
    case 'mythic': return 'bg-orange-500/20 border-orange-400/50 text-orange-300'
    case 'rare': return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
    case 'uncommon': return 'bg-blue-500/20 border-blue-400/50 text-blue-300'
    case 'common': return 'bg-slate-500/20 border-slate-400/50 text-slate-400'
    default: return 'bg-slate-700/50 border-slate-600/50 text-slate-300'
  }
}

function getCardImage(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal
  return null
}

function getCardImageSmall(card: ScryfallCard): string | null {
  if (card.image_uris?.small) return card.image_uris.small
  if (card.card_faces?.[0]?.image_uris?.small) return card.card_faces[0].image_uris.small
  return null
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-slate-700" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ScryfallCardSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeColors, setActiveColors] = useState<string[]>([])
  const [results, setResults] = useState<ScryfallCard[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null)

  function toggleColor(code: string) {
    setActiveColors(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function buildQuery(base: string, colors: string[]): string {
    let q = base.trim()
    if (colors.length > 0) {
      q += ' ' + colors.map(c => `c:${c}`).join(' ')
    }
    return q.trim()
  }

  async function handleSearch(overrideQuery?: string, overrideColors?: string[]) {
    const q = buildQuery(
      overrideQuery !== undefined ? overrideQuery : searchQuery,
      overrideColors !== undefined ? overrideColors : activeColors
    )
    if (!q) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setSelectedCard(null)

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name&dir=asc`,
        { headers: { 'Accept': 'application/json' } }
      )

      if (response.status === 404) {
        setResults([])
        setTotalCards(0)
        setError(`Keine Karten gefunden für "${q}"`)
        return
      }

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`)
      }

      const data = await response.json() as ScryfallResponse
      setResults(data.data)
      setTotalCards(data.total_cards)
    } catch (err) {
      setError('Fehler beim Laden der Karten. Bitte erneut versuchen.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  function handlePreset(preset: string) {
    setSearchQuery(preset)
    setActiveColors([])
    handleSearch(preset, [])
  }

  function handleColorToggle(code: string) {
    const newColors = activeColors.includes(code)
      ? activeColors.filter(c => c !== code)
      : [...activeColors, code]
    setActiveColors(newColors)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">🌟</span>
            <h1 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                MTG Kartensuche
              </span>
            </h1>
          </div>
          <p className="text-lg text-slate-300 mb-1">
            Scryfall · 25.000+ Karten · Preise, Artwork & Regeln
          </p>
          <Link
            href="/tcg/magic"
            className="inline-block mt-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zur Magic Collection
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Search Input */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Kartenname oder Scryfall-Suche (z.B. t:dragon cmc<=3)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || (!searchQuery.trim() && activeColors.length === 0)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? '🔄 Suche...' : '🔍 Suchen'}
            </button>
          </div>

          {/* Color Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-slate-400">Farbe:</span>
            {COLOR_FILTERS.map(color => (
              <button
                key={color.code}
                onClick={() => handleColorToggle(color.code)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  activeColors.includes(color.code)
                    ? color.bg + ' shadow-sm scale-105'
                    : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {color.emoji} {color.label}
              </button>
            ))}
            {activeColors.length > 0 && (
              <button
                onClick={() => setActiveColors([])}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition"
              >
                ✕ Filter löschen
              </button>
            )}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Beliebte Karten:</span>
            {POPULAR_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => handlePreset(preset)}
                className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-purple-700 hover:text-white transition-all"
              >
                {preset}
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

        {/* Results Layout */}
        <div className={selectedCard ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>

          {/* Results Grid */}
          <div className={selectedCard ? 'lg:col-span-2' : ''}>
            {isLoading ? (
              <LoadingSkeleton />
            ) : hasSearched && results.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Ergebnisse
                    <span className="text-base font-normal text-slate-400 ml-2">
                      ({results.length}{totalCards > results.length ? ` von ${totalCards}` : ''} Karten)
                    </span>
                  </h2>
                  {selectedCard && (
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="text-sm text-slate-400 hover:text-slate-200 transition"
                    >
                      Panel schließen ✕
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                  {results.map(card => {
                    const img = getCardImageSmall(card)
                    const isSelected = selectedCard?.id === card.id
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedCard(isSelected ? null : card)}
                        className={`text-left bg-slate-800/70 backdrop-blur-sm rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                          isSelected
                            ? 'border-purple-500 shadow-lg shadow-purple-900/30 scale-[1.02]'
                            : 'border-slate-700/50 hover:border-purple-500/40 hover:shadow-purple-900/20'
                        }`}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={card.name}
                            className="w-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="aspect-[3/4] bg-slate-900 flex items-center justify-center text-4xl">
                            🌟
                          </div>
                        )}
                        <div className="p-2 sm:p-3">
                          <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-1 leading-tight">
                            {card.name}
                          </h3>
                          <p className="text-slate-500 text-xs truncate mb-1">{card.set_name}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium border rounded px-1.5 py-0.5 ${getRarityBadge(card.rarity)}`}>
                              {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                            </span>
                            {card.prices.eur && (
                              <span className="text-green-400 text-xs font-bold">
                                {parseFloat(card.prices.eur).toFixed(2)} €
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : hasSearched && !isLoading && !error ? (
              <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-10 text-center">
                <div className="text-4xl mb-3">🌟</div>
                <p className="text-slate-400">Keine Karten gefunden</p>
              </div>
            ) : !hasSearched ? (
              <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-10 text-center">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="text-white text-xl font-semibold mb-2">Karten suchen</h3>
                <p className="text-slate-400 text-sm">
                  Gib einen Kartennamen ein oder wähle eine Farbe, um loszulegen
                </p>
              </div>
            ) : null}
          </div>

          {/* Detail Panel */}
          {selectedCard && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden sticky top-4">
                {/* Card Image */}
                {getCardImage(selectedCard) ? (
                  <img
                    src={getCardImage(selectedCard)!}
                    alt={selectedCard.name}
                    className="w-full"
                  />
                ) : (
                  <div className="aspect-[3/4] bg-slate-900 flex items-center justify-center text-6xl">
                    🌟
                  </div>
                )}

                {/* Card Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white text-lg font-bold">{selectedCard.name}</h3>
                    {selectedCard.mana_cost && (
                      <p className="text-slate-400 text-sm font-mono">{selectedCard.mana_cost}</p>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    <p className="font-medium text-slate-300">{selectedCard.type_line}</p>
                    {selectedCard.oracle_text && (
                      <p className="mt-1 leading-relaxed whitespace-pre-line">{selectedCard.oracle_text}</p>
                    )}
                  </div>

                  {/* Set & Rarity */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium border rounded px-2 py-0.5 ${getRarityBadge(selectedCard.rarity)}`}>
                      {selectedCard.rarity.charAt(0).toUpperCase() + selectedCard.rarity.slice(1)}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{selectedCard.set_name}</span>
                  </div>

                  {/* Prices */}
                  <div className="bg-slate-900/60 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preise</p>
                    {selectedCard.prices.eur ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">EUR</span>
                        <span className="text-green-400 font-bold">{parseFloat(selectedCard.prices.eur).toFixed(2)} €</span>
                      </div>
                    ) : null}
                    {selectedCard.prices.eur_foil ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">EUR Foil</span>
                        <span className="text-purple-400 font-bold">{parseFloat(selectedCard.prices.eur_foil).toFixed(2)} €</span>
                      </div>
                    ) : null}
                    {selectedCard.prices.usd ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">USD</span>
                        <span className="text-blue-400">${parseFloat(selectedCard.prices.usd).toFixed(2)}</span>
                      </div>
                    ) : null}
                    {selectedCard.prices.usd_foil ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">USD Foil</span>
                        <span className="text-blue-300">${parseFloat(selectedCard.prices.usd_foil).toFixed(2)}</span>
                      </div>
                    ) : null}
                    {!selectedCard.prices.eur && !selectedCard.prices.usd && (
                      <p className="text-xs text-slate-500">Kein Preis verfügbar</p>
                    )}
                  </div>

                  {/* Actions */}
                  <Link
                    href="/collections"
                    className="block w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold text-center rounded-xl hover:shadow-lg transition-all"
                  >
                    + Zur Sammlung hinzufügen
                  </Link>

                  <button
                    onClick={() => setSelectedCard(null)}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500">
            Powered by Scryfall · Kein API-Key · Täglich aktualisierte Preise
          </p>
        </div>

      </div>
    </div>
  )
}
