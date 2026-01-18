'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'
import Link from 'next/link'
import { useOfficialStats } from '@/hooks/useOfficialStats'

type OfficialCategory = 'certificates' | 'autographs' | 'documents' | 'tickets' | 'memorabilia'

export default function OfficialLandingPage() {
  const router = useRouter()
  const theme = SPHERE_THEMES.official
  const [selectedCategory, setSelectedCategory] = useState<OfficialCategory | null>(null)
  const { stats, loading } = useOfficialStats('all')

  const categories = [
    {
      id: 'certificates' as OfficialCategory,
      name: 'Zertifikate',
      emoji: '📜',
      color: 'from-amber-600 to-yellow-600',
      description: 'Urkunden, Diplome & Zertifikate',
      features: ['Echtheitsprüfung', 'Digitale Archive', 'Ablaufdatum-Tracking', 'Backup-System']
    },
    {
      id: 'autographs' as OfficialCategory,
      name: 'Autogramme',
      emoji: '✍️',
      color: 'from-blue-600 to-indigo-600',
      description: 'Signierte Memorabilia',
      features: ['COA-Verwaltung', 'Wertsteigerung', 'Promi-Datenbank', 'Authentifizierung']
    },
    {
      id: 'documents' as OfficialCategory,
      name: 'Dokumente',
      emoji: '📄',
      color: 'from-slate-600 to-slate-800',
      description: 'Wichtige Papiere & Verträge',
      features: ['Verschlüsselte Speicherung', 'Versionskontrolle', 'Ablaufdatum-Alerts', 'OCR-Scan']
    },
    {
      id: 'tickets' as OfficialCategory,
      name: 'Tickets',
      emoji: '🎫',
      color: 'from-pink-600 to-rose-600',
      description: 'Konzerte, Events & Reisen',
      features: ['Event-Chronologie', 'Standort-Tracking', 'Memory-Tags', 'Preisentwicklung']
    },
    {
      id: 'memorabilia' as OfficialCategory,
      name: 'Memorabilia',
      emoji: '🏆',
      color: 'from-purple-600 to-violet-600',
      description: 'Historische Sammlerstücke',
      features: ['Provenienz-Tracking', 'Expertisen-Verwaltung', 'Versicherungswert', 'Ausstellungsplanung']
    }
  ]

  const quickActions = [
    {
      icon: '📸',
      title: 'Dokument Scannen',
      description: 'OCR & Automatische Kategorisierung',
      action: () => router.push('/official/scanner')
    },
    {
      icon: '🔐',
      title: 'Sichere Ablage',
      description: 'Verschlüsselte Cloud-Speicherung',
      action: () => router.push('/official/vault')
    },
    {
      icon: '📊',
      title: 'Meine Archive',
      description: 'Dokumente verwalten',
      action: () => router.push('/collections')
    },
    {
      icon: '⏰',
      title: 'Erinnerungen',
      description: 'Ablaufdatum & Renewals',
      action: () => router.push('/official/reminders')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto container-responsive py-8 sm:py-12 md:py-20">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="text-4xl sm:text-5xl md:text-6xl">{theme.emoji}</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className={`bg-gradient-to-r ${theme.darkColors.gradient} bg-clip-text text-transparent`}>
                  {theme.name}
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto px-4">
              Sichere Verwaltung für offizielle Dokumente, Zertifikate & Memorabilia
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-8 sm:mb-10 md:mb-12 md:mb-16">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="group p-4 sm:p-6 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all duration-200 text-left"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{action.icon}</div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Category Selection */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
              Wähle deine Kategorie
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    relative p-6 sm:p-8 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105
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
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 text-center">{category.emoji}</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-center text-slate-300 mb-4 sm:mb-6 italic">
                      {category.description}
                    </p>

                    <div className="space-y-2">
                      {category.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                          <svg className="w-4 h-4 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/official/${category.id}`)
                      }}
                      className={`
                        w-full mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200
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
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl sm:rounded-2xl card-padding border border-slate-700">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Stats</h2>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-slate-700 rounded mb-2 mx-auto w-16"></div>
                    <div className="h-4 bg-slate-700 rounded mx-auto w-24"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-400 mb-1">
                    {stats.totalDocuments}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">Total Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                    {stats.certificates}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">Certificates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                    {stats.totalValue.toFixed(2)} €
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
                    {stats.expiringSoon}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">Expiring Soon</div>
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6 text-center">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-sm sm:text-base text-slate-300 hover:text-white transition-colors"
              >
                <span>Zu meinen Archiven</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔒</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Maximale Sicherheit</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Ende-zu-Ende-Verschlüsselung für sensible Dokumente & Zertifikate
              </p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📱</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Überall Zugriff</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Cloud-Backup mit Offline-Modus für wichtige Dokumente
              </p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🤖</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Smart OCR</h3>
              <p className="text-sm sm:text-base text-slate-400 px-4">
                Automatische Texterkennung & intelligente Kategorisierung
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
