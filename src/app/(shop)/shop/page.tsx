'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'
import { useShopStats } from '@/hooks/useShopStats'

type ShopFeature = 'marketplace' | 'inventory' | 'orders' | 'analytics' | 'integration'

export default function ShopLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.shop
  const [selectedFeature, setSelectedFeature] = useState<ShopFeature | null>(null)
  const { stats, loading } = useShopStats()

  const features = [
    {
      id: 'marketplace' as ShopFeature,
      name: 'Marktplatz',
      emoji: '🏪',
      color: 'from-green-600 to-emerald-600',
      description: 'Verkaufen & Handeln',
      features: ['Multi-Plattform Listings', 'Preis-Vergleich', 'Automatische Sync', 'Gebühren-Kalkulator']
    },
    {
      id: 'inventory' as ShopFeature,
      name: 'Inventar',
      emoji: '📦',
      color: 'from-blue-600 to-cyan-600',
      description: 'Lagerverwaltung',
      features: ['Stock-Tracking', 'SKU-Management', 'Barcode-Scanner', 'Reorder-Alerts']
    },
    {
      id: 'orders' as ShopFeature,
      name: 'Bestellungen',
      emoji: '📋',
      color: 'from-purple-600 to-indigo-600',
      description: 'Order Management',
      features: ['Zentralisierte Verwaltung', 'Versand-Labels', 'Status-Tracking', 'Rechnungs-Generator']
    },
    {
      id: 'analytics' as ShopFeature,
      name: 'Analytics',
      emoji: '📊',
      color: 'from-orange-600 to-red-600',
      description: 'Verkaufs-Analysen',
      features: ['Umsatz-Statistiken', 'Bestseller-Reports', 'Profit-Margins', 'Trend-Analyse']
    },
    {
      id: 'integration' as ShopFeature,
      name: 'Integrationen',
      emoji: '🔌',
      color: 'from-pink-600 to-rose-600',
      description: 'Platform-Anbindung',
      features: ['eBay API', 'Shopify Sync', 'Amazon FBA', 'Cardmarket Connect']
    }
  ]

  const quickActions = [
    {
      icon: '➕',
      title: 'Listing Erstellen',
      description: 'Schnell verkaufen',
      action: () => router.push('/shop/create-listing')
    },
    {
      icon: '📦',
      title: 'Inventar',
      description: 'Lagerbestand prüfen',
      action: () => router.push('/shop/inventory')
    },
    {
      icon: '💰',
      title: 'Verkäufe',
      description: 'Umsatz & Orders',
      action: () => router.push('/shop/sales')
    },
    {
      icon: '⚙️',
      title: 'Integrationen',
      description: 'Plattformen verbinden',
      action: () => router.push('/shop/integrations')
    }
  ]

  const platforms = [
    { name: 'eBay', icon: '🏷️', status: 'Connected' },
    { name: 'Shopify', icon: '🛍️', status: 'Available' },
    { name: 'Cardmarket', icon: '🎴', status: 'Available' },
    { name: 'Amazon', icon: '📦', status: 'Coming Soon' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-6xl">{theme.emoji}</span>
              <h1 className="text-5xl sm:text-6xl font-bold">
                <span className={`bg-gradient-to-r ${theme.darkColors.gradient} bg-clip-text text-transparent`}>
                  {theme.name}
                </span>
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Deine All-in-One Plattform für Sammler-Commerce & Marktplatz-Integration
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-green-500/50 transition-all duration-200 text-left"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Platform Integrations Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Plattform-Integrationen</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.name}
                  className="p-6 rounded-xl bg-slate-700/50 border border-slate-600 text-center"
                >
                  <div className="text-4xl mb-2">{platform.icon}</div>
                  <div className="font-semibold text-white mb-1">{platform.name}</div>
                  <div className={`text-xs ${
                    platform.status === 'Connected'
                      ? 'text-green-400'
                      : platform.status === 'Available'
                      ? 'text-blue-400'
                      : 'text-slate-400'
                  }`}>
                    {platform.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/shop/integrations')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <span>Plattformen Verbinden</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Feature Selection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Alle Features im Überblick
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  onClick={() => setSelectedFeature(feature.id)}
                  className={`
                    relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${selectedFeature === feature.id
                      ? 'ring-4 ring-white/50 shadow-2xl'
                      : 'hover:shadow-xl'
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${selectedFeature === feature.id ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.5)'} 0%, rgba(15,23,42,0.8) 100%)`
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 rounded-2xl`}></div>

                  <div className="relative z-10">
                    <div className="text-6xl mb-4 text-center">{feature.emoji}</div>
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-center text-slate-300 mb-6 italic">
                      {feature.description}
                    </p>

                    <div className="space-y-2">
                      {feature.features.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/shop/${feature.id}`)
                      }}
                      className={`
                        w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                        bg-gradient-to-r ${feature.color} text-white hover:shadow-lg transform hover:-translate-y-0.5
                      `}
                    >
                      Zu {feature.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-slate-700 rounded mb-2 mx-auto w-16"></div>
                    <div className="h-4 bg-slate-700 rounded mx-auto w-24"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {stats.activeListings}
                  </div>
                  <div className="text-sm text-slate-400">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {stats.revenue30d.toFixed(2)} €
                  </div>
                  <div className="text-sm text-slate-400">Revenue (30d)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {stats.totalOrders}
                  </div>
                  <div className="text-sm text-slate-400">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400 mb-1">
                    {stats.itemsInStock}
                  </div>
                  <div className="text-sm text-slate-400">Items in Stock</div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/shop/dashboard"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <span>Zum Shop Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-white mb-2">Auto-Sync</h3>
              <p className="text-slate-400">
                Automatische Synchronisation über alle verbundenen Plattformen
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Pricing</h3>
              <p className="text-slate-400">
                KI-basierte Preisvorschläge & dynamische Marktanalyse
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-2">Fulfillment</h3>
              <p className="text-slate-400">
                Integriertes Versand-Management mit Label-Druck
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
