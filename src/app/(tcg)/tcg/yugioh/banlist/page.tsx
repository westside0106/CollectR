'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BanlistCard {
  name: string
  status: 'Forbidden' | 'Limited' | 'Semi-Limited'
  reason: string
  type: string
}

export default function YuGiOhBanlistPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Forbidden' | 'Limited' | 'Semi-Limited'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const banlistCards: BanlistCard[] = [
    {
      name: 'Maxx "C"',
      status: 'Forbidden',
      reason: 'Zu mächtiger Hand-Advantage',
      type: 'Effect Monster'
    },
    {
      name: 'Mystic Mine',
      status: 'Forbidden',
      reason: 'Stoppt Spiel komplett',
      type: 'Field Spell'
    },
    {
      name: 'Red-Eyes Dark Dragoon',
      status: 'Forbidden',
      reason: 'Zu stark, schwer zu entfernen',
      type: 'Fusion Monster'
    },
    {
      name: 'Pot of Prosperity',
      status: 'Limited',
      reason: 'Starker Draw-Power',
      type: 'Normal Spell'
    },
    {
      name: 'Called by the Grave',
      status: 'Limited',
      reason: 'Universal Counter',
      type: 'Quick-Play Spell'
    },
    {
      name: 'Harpie\'s Feather Duster',
      status: 'Limited',
      reason: 'Mass Removal',
      type: 'Normal Spell'
    },
    {
      name: 'Evenly Matched',
      status: 'Semi-Limited',
      reason: 'Board Wipe Potential',
      type: 'Trap Card'
    },
    {
      name: 'Ash Blossom & Joyous Spring',
      status: 'Semi-Limited',
      reason: 'Universal Hand Trap',
      type: 'Effect Monster'
    },
    {
      name: 'Nibiru, the Primal Being',
      status: 'Semi-Limited',
      reason: 'Board Break',
      type: 'Effect Monster'
    }
  ]

  const filteredCards = banlistCards.filter(card => {
    const matchesStatus = selectedStatus === 'all' || card.status === selectedStatus
    const matchesSearch = !searchQuery || card.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Forbidden': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'Limited': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'Semi-Limited': return 'bg-orange-500/20 text-orange-300 border-orange-500/50'
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Forbidden': return '🚫'
      case 'Limited': return '1️⃣'
      case 'Semi-Limited': return '2️⃣'
      default: return '❓'
    }
  }

  const stats = {
    forbidden: banlistCards.filter(c => c.status === 'Forbidden').length,
    limited: banlistCards.filter(c => c.status === 'Limited').length,
    semiLimited: banlistCards.filter(c => c.status === 'Semi-Limited').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">📋</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Yu-Gi-Oh! Banlist
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Aktuelle Forbidden & Limited Liste (TCG Format)
          </p>
          <Link
            href="/tcg/yugioh"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Yu-Gi-Oh!
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-6 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="text-4xl font-bold text-red-400 mb-1">{stats.forbidden}</div>
            <div className="text-sm text-slate-300">🚫 Forbidden</div>
            <div className="text-xs text-slate-500 mt-1">0 Kopien erlaubt</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-4xl font-bold text-yellow-400 mb-1">{stats.limited}</div>
            <div className="text-sm text-slate-300">1️⃣ Limited</div>
            <div className="text-xs text-slate-500 mt-1">1 Kopie erlaubt</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <div className="text-4xl font-bold text-orange-400 mb-1">{stats.semiLimited}</div>
            <div className="text-sm text-slate-300">2️⃣ Semi-Limited</div>
            <div className="text-xs text-slate-500 mt-1">2 Kopien erlaubt</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Status Filter */}
          <div className="flex justify-center gap-3">
            {['all', 'Forbidden', 'Limited', 'Semi-Limited'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status as any)}
                className={`
                  px-6 py-3 rounded-xl transition-all duration-200 font-semibold
                  ${selectedStatus === status
                    ? 'bg-purple-600 text-white ring-4 ring-purple-500/50'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                {status === 'all' ? 'Alle' : status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Kartenname suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Banlist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {filteredCards.map((card, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border-2 ${getStatusColor(card.status)} transition-all hover:scale-105`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{card.name}</h3>
                <div className="text-3xl">{getStatusIcon(card.status)}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="font-semibold">{card.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Typ: </span>
                  <span className="text-slate-300">{card.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Grund: </span>
                  <span className="text-slate-300">{card.reason}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl">Keine Karten gefunden</p>
            <p className="text-sm mt-2">Versuche eine andere Suche</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>💡</span> Banlist Info
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• <strong>Forbidden (0):</strong> Karte darf nicht im Deck oder Extra Deck sein</li>
            <li>• <strong>Limited (1):</strong> Maximal 1 Kopie dieser Karte erlaubt</li>
            <li>• <strong>Semi-Limited (2):</strong> Maximal 2 Kopien dieser Karte erlaubt</li>
            <li>• Die Banlist wird regelmäßig aktualisiert (ca. alle 3 Monate)</li>
            <li>• Diese Liste gilt für das TCG Format (nicht OCG)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
