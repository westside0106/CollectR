'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'

type GeoCategory = 'minerals' | 'fossils' | 'crystals' | 'meteorites' | 'artifacts'

export default function GeoLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.geo
  const [selectedCategory, setSelectedCategory] = useState<GeoCategory | null>(null)

  const categories = [
    {
      id: 'minerals' as GeoCategory,
      name: 'Mineralien',
      emoji: '💎',
      color: 'from-emerald-600 to-teal-600',
      description: 'Edelsteine & Mineralien',
      features: ['Mohshärte-Datenbank', 'Fundort-Tracking', 'Chemische Formel', 'Marktpreise']
    },
    {
      id: 'fossils' as GeoCategory,
      name: 'Fossilien',
      emoji: '🦴',
      color: 'from-amber-700 to-orange-700',
      description: 'Versteinerungen & Paläontologie',
      features: ['Zeitalter-Bestimmung', 'Arten-Identifikation', 'Echtheitsprüfung', 'Wissenschaftlicher Wert']
    },
    {
      id: 'crystals' as GeoCategory,
      name: 'Kristalle',
      emoji: '🔮',
      color: 'from-purple-600 to-pink-600',
      description: 'Kristallstrukturen & Drusen',
      features: ['Kristallsystem', 'Reinheitsgrad', 'Heilstein-Eigenschaften', 'Größen-Tracker']
    },
    {
      id: 'meteorites' as GeoCategory,
      name: 'Meteoriten',
      emoji: '☄️',
      color: 'from-slate-600 to-zinc-700',
      description: 'Weltraum-Gestein',
      features: ['Klassifikation', 'Fundgeschichte', 'Nickel-Gehalt', 'Zertifizierung']
    },
    {
      id: 'artifacts' as GeoCategory,
      name: 'Artefakte',
      emoji: '🏺',
      color: 'from-yellow-700 to-amber-800',
      description: 'Archäologische Funde',
      features: ['Datierung', 'Kulturzuordnung', 'Provenienz', 'Restaurierungsstatus']
    }
  ]

  const quickActions = [
    {
      icon: '📸',
      title: 'Specimen Scannen',
      description: 'Foto-Erkennung & Identifikation',
      action: () => router.push('/geo/scanner')
    },
    {
      icon: '🗺️',
      title: 'Fundorte',
      description: 'GPS-Tracking & Karten',
      action: () => router.push('/geo/locations')
    },
    {
      icon: '📊',
      title: 'Meine Sammlung',
      description: 'Geologische Archive',
      action: () => router.push('/collections')
    },
    {
      icon: '🔬',
      title: 'Labor-Daten',
      description: 'Analysen & Zertifikate',
      action: () => router.push('/geo/lab-data')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
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
              Die ultimative Plattform für Geologie & Archäologie Sammler
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Category Selection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Wähle deine Kategorie
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${selectedCategory === category.id
                      ? 'ring-4 ring-white/50 shadow-2xl'
                      : 'hover:shadow-xl'
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${selectedCategory === category.id ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.5)'} 0%, rgba(15,23,42,0.8) 100%)`
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 rounded-2xl`}></div>

                  <div className="relative z-10">
                    <div className="text-6xl mb-4 text-center">{category.emoji}</div>
                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                      {category.name}
                    </h3>
                    <p className="text-center text-slate-300 mb-6 italic">
                      {category.description}
                    </p>

                    <div className="space-y-2">
                      {category.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/geo/${category.id}`)
                      }}
                      className={`
                        w-full mt-6 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                        bg-gradient-to-r ${category.color} text-white hover:shadow-lg transform hover:-translate-y-0.5
                      `}
                    >
                      Zu {category.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard Preview */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Stats</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Total Specimens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Rare Finds</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
                <div className="text-sm text-slate-400">Locations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">0.00 €</div>
                <div className="text-sm text-slate-400">Collection Value</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <span>Zur Sammlung</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Fundort-Tracking</h3>
              <p className="text-slate-400">
                GPS-basierte Fundortverwaltung mit interaktiven Karten
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">🔬</div>
              <h3 className="text-xl font-semibold text-white mb-2">Wissenschaftliche Daten</h3>
              <p className="text-slate-400">
                Detaillierte Analysen, chemische Formeln & Klassifikationen
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Identifikation</h3>
              <p className="text-slate-400">
                Automatische Bestimmung von Mineralien & Fossilien per Foto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
