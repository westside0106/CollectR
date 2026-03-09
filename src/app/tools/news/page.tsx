'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getCollectionNews,
  searchNews,
  getRelativeTime,
  type NewsArticle,
  type CollectionCategory,
  COLLECTION_KEYWORDS
} from '@/services/newsService'

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  'hot-wheels': { label: 'Hot Wheels', icon: '🚗' },
  'coins':      { label: 'Münzen', icon: '🪙' },
  'stamps':     { label: 'Briefmarken', icon: '📮' },
  'antiques':   { label: 'Antiquitäten', icon: '🏺' },
  'watches':    { label: 'Uhren', icon: '⌚' },
  'art':        { label: 'Kunst', icon: '🎨' },
  'vinyl':      { label: 'Vinyl', icon: '💿' },
  'comics':     { label: 'Comics', icon: '📚' },
  'toys':       { label: 'Spielzeug', icon: '🧸' },
  'jewelry':    { label: 'Schmuck', icon: '💎' },
  'furniture':  { label: 'Möbel', icon: '🪑' },
  'general':    { label: 'Allgemein', icon: '📦' },
  'tcg':        { label: 'Trading Cards', icon: '🃏' },
  'gaming':     { label: 'Gaming', icon: '🎮' },
  'market':     { label: 'Markt', icon: '📈' },
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<CollectionCategory[]>(['general', 'hot-wheels'])
  const [activeCategory, setActiveCategory] = useState<CollectionCategory>('general')
  const [searchQuery, setSearchQuery] = useState('')

  const allCategories = Object.keys(COLLECTION_KEYWORDS) as CollectionCategory[]

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('news-categories')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelectedCategories(parsed)
        if (parsed.length > 0) setActiveCategory(parsed[0])
      }
    } catch {}
  }, [])

  const loadNews = useCallback(async () => {
    setLoading(true)
    try {
      const news = searchQuery.trim()
        ? await searchNews(searchQuery, 15)
        : await getCollectionNews(activeCategory, 15)
      setArticles(news)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeCategory])

  useEffect(() => {
    if (mounted && !searchQuery) loadNews()
  }, [activeCategory, mounted, searchQuery, loadNews])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadNews()
  }

  function toggleCategory(cat: CollectionCategory) {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat]
    setSelectedCategories(updated)
    localStorage.setItem('news-categories', JSON.stringify(updated))
    if (!updated.includes(activeCategory) && updated.length > 0) {
      setActiveCategory(updated[0])
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 h-32" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Gradient Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 dark:from-violet-700 dark:via-purple-700 dark:to-pink-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📰</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Sammler-News</h1>
              </div>
              <p className="text-violet-100 text-sm sm:text-base">
                Aktuelle Nachrichten aus der Sammlerwelt — Google News, kein API-Key
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={loadNews}
                disabled={loading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition"
                title="Aktualisieren"
              >
                🔄
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl transition ${showSettings ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Kategorien"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-4">

        {/* Kategorie-Einstellungen */}
        {showSettings && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Meine Sammelgebiete</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Wähle die Kategorien, die du als Schnelltabs sehen möchtest:
            </p>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => {
                const info = CATEGORY_LABELS[cat] ?? { label: cat, icon: '📦' }
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedCategories.includes(cat)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {info.icon} {info.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Kategorie-Tabs */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(cat => {
              const info = CATEGORY_LABELS[cat] ?? { label: cat, icon: '📦' }
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearchQuery('') }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeCategory === cat && !searchQuery
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600'
                  }`}
                >
                  {info.icon} {info.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Suchleiste */}
        <form onSubmit={handleSearch}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Eigene Suche eingeben..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition"
            >
              Suchen
            </button>
          </div>
        </form>

        {/* Artikel */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Keine News gefunden</p>
            {selectedCategories.length === 0 && (
              <button
                onClick={() => setShowSettings(true)}
                className="mt-4 text-violet-600 dark:text-violet-400 hover:underline text-sm"
              >
                Kategorien auswählen →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all group"
              >
                {article.image ? (
                  <img
                    src={article.image}
                    alt=""
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0 text-2xl">
                    📰
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition line-clamp-2 mb-1.5 text-sm sm:text-base leading-snug">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{article.source.name}</span>
                    <span>·</span>
                    <span>{getRelativeTime(article.publishedAt)}</span>
                    <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Powered by Google News RSS · 15 Minuten Cache · Kein API-Key erforderlich
          </p>
        </div>
      </div>
    </div>
  )
}
