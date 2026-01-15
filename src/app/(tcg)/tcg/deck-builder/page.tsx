'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

type GameType = 'pokemon' | 'yugioh' | 'magic'

interface Card {
  id: string
  name: string
  count: number
}

interface DeckConstraints {
  min: number
  max: number | null
  maxCopies: number
  allowsExtraDeck: boolean
  extraMin?: number
  extraMax?: number
  commanderMode?: boolean
}

function DeckBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [selectedGame, setSelectedGame] = useState<GameType>('pokemon')
  const [deckName, setDeckName] = useState('')
  const [mainDeck, setMainDeck] = useState<Card[]>([])
  const [sideDeck, setSideDeck] = useState<Card[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

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
    setSearchError(null)
  }, [selectedGame])

  // Search cards when query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    const searchCards = async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const { searchCards: searchFn } = await import('@/lib/card-search-api')
        const results = await searchFn(selectedGame, searchQuery)
        setSearchResults(results)

        if (results.length === 0) {
          setSearchError('Keine Karten gefunden. Versuche eine andere Suche.')
        }
      } catch (error) {
        console.error('Card search error:', error)
        setSearchResults([])
        const errorMsg = `Kartensuchfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        setSearchError(errorMsg)
        showToast(errorMsg, 'error')
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchCards, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedGame, showToast])

  const deckConstraints: Record<GameType, DeckConstraints> = {
    pokemon: { min: 60, max: 60, maxCopies: 4, allowsExtraDeck: false },
    yugioh: { min: 40, max: 60, maxCopies: 3, allowsExtraDeck: true, extraMin: 0, extraMax: 15 },
    magic: { min: 60, max: null, maxCopies: 4, allowsExtraDeck: false, commanderMode: false }
  }

  const getCurrentConstraints = () => deckConstraints[selectedGame]
  const totalCards = mainDeck.reduce((sum, card) => sum + card.count, 0)
  const extraCards = sideDeck.reduce((sum, card) => sum + card.count, 0)

  const addCardToDeck = (card: any) => {
    const existingCard = mainDeck.find(c => c.id === card.id)

    if (existingCard) {
      // Increment count if below maxCopies
      if (existingCard.count < getCurrentConstraints().maxCopies) {
        setMainDeck(mainDeck.map(c =>
          c.id === card.id ? { ...c, count: c.count + 1 } : c
        ))
      }
    } else {
      // Add new card
      setMainDeck([...mainDeck, { id: card.id, name: card.name, count: 1 }])
    }
  }

  const removeCardFromDeck = (cardId: string) => {
    setMainDeck(mainDeck.filter(c => c.id !== cardId))
  }

  const removeCardFromSideDeck = (cardId: string) => {
    setSideDeck(sideDeck.filter(c => c.id !== cardId))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🎯</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Deck Builder
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Erstelle wettbewerbsfähige Decks für alle TCG Games
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
                    ? 'bg-purple-600 text-white ring-4 ring-purple-500/50'
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Search */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-4">🔍 Kartensuche</h2>

              <input
                type="text"
                placeholder="Kartenname suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="animate-spin text-4xl mb-2">🔄</div>
                    <p>Suche...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => addCardToDeck(card)}
                      className="w-full p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-600 hover:border-purple-500 transition-all text-left group"
                    >
                      <div className="flex gap-3">
                        {card.imageUrl && (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm truncate group-hover:text-purple-300">
                            {card.name}
                          </div>
                          {card.rarity && (
                            <div className="text-xs text-yellow-400 mt-1">
                              ⭐ {card.rarity}
                            </div>
                          )}
                          {card.set && (
                            <div className="text-xs text-slate-400 mt-1 truncate">
                              {card.set}
                            </div>
                          )}
                          {card.type && (
                            <div className="text-xs text-slate-500 mt-1 truncate">
                              {card.type}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : searchQuery.length > 0 ? (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-2">{searchError ? '⚠️' : '🔍'}</p>
                    {searchError ? (
                      <>
                        <p className="text-red-400 font-semibold mb-2">Fehler</p>
                        <p className="text-sm text-slate-300">{searchError}</p>
                        <div className="mt-4 text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3">
                          <p className="font-semibold mb-2">Mögliche Ursachen:</p>
                          <ul className="text-left space-y-1">
                            <li>• API-Verbindung fehlgeschlagen</li>
                            <li>• Kartenname falsch geschrieben</li>
                            <li>• Probiere Yu-Gi-Oh! oder Magic (funktionieren ohne API Key)</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400">Keine Karten gefunden</p>
                        <p className="text-sm text-slate-500 mt-2">Versuche eine andere Suche</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-4xl mb-2">🎴</p>
                    <p>Starte die Suche</p>
                    <p className="text-sm mt-2">Gib einen Kartennamen ein</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deck Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deck Info */}
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <input
                type="text"
                placeholder="Deck Name..."
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white text-2xl font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Main Deck:</span>
                  <span className={`font-bold ${
                    totalCards >= getCurrentConstraints().min &&
                    (getCurrentConstraints().max === null || totalCards <= (getCurrentConstraints().max || 0))
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {totalCards}
                  </span>
                  <span className="text-slate-500">
                    / {getCurrentConstraints().min}
                    {getCurrentConstraints().max && `-${getCurrentConstraints().max}`}
                  </span>
                </div>

                {getCurrentConstraints().allowsExtraDeck && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Extra Deck:</span>
                    <span className={`font-bold ${
                      extraCards <= (getCurrentConstraints().extraMax || 0)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {extraCards}
                    </span>
                    <span className="text-slate-500">
                      / {getCurrentConstraints().extraMax}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Deck */}
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">📦 Main Deck</h2>

              {mainDeck.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-5xl mb-4">🎴</p>
                  <p>Noch keine Karten im Deck</p>
                  <p className="text-sm mt-2">Suche und füge Karten hinzu</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mainDeck.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-600"
                    >
                      <span className="text-white font-medium">{card.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">x{card.count}</span>
                        <button
                          onClick={() => removeCardFromDeck(card.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side/Extra Deck */}
            {getCurrentConstraints().allowsExtraDeck && (
              <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">⭐ Extra Deck</h2>

                {sideDeck.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>Noch keine Extra Deck Karten</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sideDeck.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-600"
                      >
                        <span className="text-white font-medium">{card.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">x{card.count}</span>
                          <button
                            onClick={() => removeCardFromSideDeck(card.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                disabled={!deckName || totalCards < getCurrentConstraints().min}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Deck Speichern
              </button>
              <button
                onClick={() => router.push('/tcg')}
                className="px-6 py-4 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>💡</span> Deck Building Tipps
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Halte dich an das Minimum von {getCurrentConstraints().min} Karten</li>
            <li>• Maximal {getCurrentConstraints().maxCopies} Kopien pro Karte (außer Basis-Energien bei Pokémon)</li>
            {selectedGame === 'yugioh' && <li>• Beachte die aktuelle Banlist (Forbidden, Limited, Semi-Limited)</li>}
            {selectedGame === 'magic' && <li>• Achte auf deine Mana-Kurve und Farbverteilung</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function DeckBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center"><div className="text-white text-2xl">Loading...</div></div>}>
      <DeckBuilderContent />
    </Suspense>
  )
}
