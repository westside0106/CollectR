'use client'

import { useState } from 'react'
import Link from 'next/link'

type Format = 'Standard' | 'Pioneer' | 'Modern' | 'Legacy' | 'Vintage' | 'Commander' | 'Pauper'

interface FormatInfo {
  name: Format
  description: string
  cardPool: string
  banlist: string[]
  deckSize: string
  popularity: number
  icon: string
  color: string
}

export default function MagicFormatCheckerPage() {
  const [selectedFormat, setSelectedFormat] = useState<Format>('Commander')
  const [cardToCheck, setCardToCheck] = useState('')

  const formats: FormatInfo[] = [
    {
      name: 'Standard',
      description: 'Aktuellste Sets der letzten 2 Jahre',
      cardPool: 'Letzte 5-8 Sets (rotiert jährlich)',
      banlist: ['The Meathook Massacre', 'Fable of the Mirror-Breaker'],
      deckSize: 'Minimum 60 Karten',
      popularity: 75,
      icon: '📋',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      name: 'Pioneer',
      description: 'Modern Light - ab Return to Ravnica',
      cardPool: 'Return to Ravnica (2012) bis heute',
      banlist: ['Oko, Thief of Crowns', 'Field of the Dead', 'Inverter of Truth'],
      deckSize: 'Minimum 60 Karten',
      popularity: 60,
      icon: '🌅',
      color: 'from-yellow-600 to-amber-600'
    },
    {
      name: 'Modern',
      description: 'Powerful Format ab 8th Edition',
      cardPool: '8th Edition (2003) bis heute',
      banlist: ['Splinter Twin', 'Mox Opal', 'Once Upon a Time'],
      deckSize: 'Minimum 60 Karten',
      popularity: 85,
      icon: '⚡',
      color: 'from-orange-600 to-red-600'
    },
    {
      name: 'Legacy',
      description: 'Fast alle Karten der Magic Geschichte',
      cardPool: 'Alle Sets außer Un-Sets, Silver-Border',
      banlist: ['Black Lotus', 'Ancestral Recall', 'Time Walk', 'Bazaar of Baghdad'],
      deckSize: 'Minimum 60 Karten',
      popularity: 40,
      icon: '📜',
      color: 'from-green-600 to-emerald-600'
    },
    {
      name: 'Vintage',
      description: 'Mächtigstes Format - Fast alles erlaubt',
      cardPool: 'Alle Karten, viele Restricted (nur 1x)',
      banlist: ['Chaos Orb', 'Shahrazad'] /* Rest ist restricted */,
      deckSize: 'Minimum 60 Karten',
      popularity: 25,
      icon: '🏆',
      color: 'from-pink-600 to-rose-600'
    },
    {
      name: 'Commander',
      description: 'Multiplayer Singleton Format',
      cardPool: 'Fast alle Karten (außer Un-Sets)',
      banlist: ['Biorhythm', 'Coalition Victory', 'Karakas', 'Limited Resources'],
      deckSize: '100 Karten (Singleton)',
      popularity: 95,
      icon: '👑',
      color: 'from-purple-600 to-indigo-600'
    },
    {
      name: 'Pauper',
      description: 'Nur Common Karten',
      cardPool: 'Alle Commons aller Sets',
      banlist: ['High Tide', 'Hymn to Tourach', 'Sinkhole'],
      deckSize: 'Minimum 60 Karten',
      popularity: 50,
      icon: '🔰',
      color: 'from-slate-600 to-gray-600'
    }
  ]

  const currentFormat = formats.find(f => f.name === selectedFormat)!

  const checkCardLegality = () => {
    if (!cardToCheck) return

    // Simplified legality check (in reality würde man Scryfall API nutzen)
    const bannedInCurrent = currentFormat.banlist.some(card =>
      card.toLowerCase() === cardToCheck.toLowerCase()
    )

    if (bannedInCurrent) {
      alert(`❌ "${cardToCheck}" ist in ${selectedFormat} VERBOTEN!`)
    } else {
      alert(`✅ "${cardToCheck}" könnte in ${selectedFormat} legal sein!\n\nHinweis: Für genaue Info nutze Scryfall.com`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">⚖️</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Magic Format Checker
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Prüfe Karten-Legalität in verschiedenen Formaten
          </p>
          <Link
            href="/tcg/magic"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Magic
          </Link>
        </div>

        {/* Format Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">Wähle ein Format:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {formats.map((format) => (
              <button
                key={format.name}
                onClick={() => setSelectedFormat(format.name)}
                className={`
                  p-4 rounded-xl transition-all duration-200 text-center
                  ${selectedFormat === format.name
                    ? 'ring-4 ring-white/50 shadow-2xl scale-105'
                    : 'hover:scale-105'
                  }
                  bg-gradient-to-br ${format.color}
                `}
              >
                <div className="text-3xl mb-2">{format.icon}</div>
                <div className="text-sm font-semibold text-white">{format.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Format Details */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-6xl">{currentFormat.icon}</div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{currentFormat.name}</h2>
              <p className="text-slate-300">{currentFormat.description}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{currentFormat.popularity}%</div>
              <div className="text-sm text-slate-400">Beliebtheit</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">📚 Card Pool</h3>
              <p className="text-slate-300 text-sm">{currentFormat.cardPool}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">📦 Deck Size</h3>
              <p className="text-slate-300 text-sm">{currentFormat.deckSize}</p>
            </div>
          </div>

          {/* Banlist Preview */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <h3 className="text-lg font-semibold text-red-300 mb-3">🚫 Beispiel Banlist</h3>
            <div className="flex flex-wrap gap-2">
              {currentFormat.banlist.slice(0, 6).map((card, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm"
                >
                  {card}
                </span>
              ))}
              {currentFormat.banlist.length > 6 && (
                <span className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm">
                  +{currentFormat.banlist.length - 6} mehr
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Checker */}
        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🔍 Karten-Legalität Prüfen</h2>
          <p className="text-slate-400 mb-4 text-sm">
            Gib einen Kartennamen ein um zu prüfen ob er im gewählten Format legal ist
          </p>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="z.B. Black Lotus, Lightning Bolt..."
              value={cardToCheck}
              onChange={(e) => setCardToCheck(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkCardLegality()}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={checkCardLegality}
              disabled={!cardToCheck}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prüfen
            </button>
          </div>
        </div>

        {/* Format Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-white mb-2">Schnellste Formate</h3>
            <p className="text-sm text-slate-400">
              Vintage, Legacy: Spiele enden oft Turn 2-4
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-semibold text-white mb-2">Beliebteste Formate</h3>
            <p className="text-sm text-slate-400">
              Commander (95%), Modern (85%), Standard (75%)
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-white mb-2">Budget-Friendly</h3>
            <p className="text-sm text-slate-400">
              Pauper, Standard: Günstigere Einstiegshürde
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Format Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• <strong>Rotation:</strong> Nur Standard hat Rotation (jährlich)</li>
            <li>• <strong>Banlist Updates:</strong> Mehrmals pro Jahr je nach Format</li>
            <li>• <strong>Power Level:</strong> Vintage &gt; Legacy &gt; Modern &gt; Pioneer &gt; Standard</li>
            <li>• <strong>Commander:</strong> Eigene Banlist, optimiert für Multiplayer</li>
            <li>• Für genaue Legalität nutze <a href="https://scryfall.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Scryfall.com</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
