'use client'

import { useState } from 'react'
import Link from 'next/link'

interface WishlistItem {
  id: string
  name: string
  platform: string
  releaseDate: string
  currentPrice: number
  targetPrice: number
  priceAlert: boolean
}

export default function GamingWishlistPage() {
  const [wishlistItems] = useState<WishlistItem[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'release'>('release')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🎯</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Gaming Wishlist
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Plane deine nächsten Gaming-Käufe
          </p>
          <Link
            href="/gaming"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Gaming Übersicht
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8 justify-between">
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="release">Nach Release-Datum</option>
              <option value="price">Nach Preis</option>
              <option value="name">Nach Name</option>
            </select>
          </div>

          <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            ➕ Spiel hinzufügen
          </button>
        </div>

        {/* Wishlist */}
        {wishlistItems.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-12 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Deine Wishlist ist leer
            </h2>
            <p className="text-slate-400 mb-6">
              Füge Spiele hinzu, die du kaufen möchtest
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/gaming/prices"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Preise durchsuchen
              </Link>
              <button className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Manuell hinzufügen
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Wishlist items would go here */}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-3xl font-bold text-purple-400 mb-1">0</div>
            <div className="text-sm text-slate-400">Spiele auf Wishlist</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-3xl font-bold text-green-400 mb-1">0.00 €</div>
            <div className="text-sm text-slate-400">Gesamtwert Wishlist</div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-3xl font-bold text-amber-400 mb-1">0</div>
            <div className="text-sm text-slate-400">Aktive Preis-Alerts</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-5xl mb-4">📉</div>
            <h3 className="text-xl font-semibold text-white mb-2">Preisverfolgung</h3>
            <p className="text-slate-400">
              Verfolge Preisentwicklungen deiner Wunschspiele
            </p>
          </div>
          <div>
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-white mb-2">Preis-Alerts</h3>
            <p className="text-slate-400">
              Werde benachrichtigt bei Preissenkungen
            </p>
          </div>
          <div>
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">Release-Kalender</h3>
            <p className="text-slate-400">
              Verpasse keine Neuerscheinungen
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
