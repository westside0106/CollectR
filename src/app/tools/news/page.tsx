'use client'

import { useState, useEffect } from 'react'
import { 
  getCollectionNews, 
  searchNews,
  getRelativeTime,
  type NewsArticle,
  type CollectionCategory,
  COLLECTION_KEYWORDS
} from '@/services/newsService'

const CATEGORY_LABELS: Record<CollectionCategory, { label: string, icon: string }> = {
  'hot-wheels': { label: 'Hot Wheels', icon: '🚗' },
  'coins': { label: 'Münzen', icon: '🪙' },
  'stamps': { label: 'Briefmarken', icon: '📮' },
  'antiques': { label: 'Antiquitäten', icon: '🏺' },
  'watches': { label: 'Uhren', icon: '⌚' },
  'art': { label: 'Kunst', icon: '🎨' },
  'vinyl': { label: 'Vinyl', icon: '💿' },
  'comics': { label: 'Comics', icon: '📚' },
  'toys': { label: 'Spielzeug', icon: '🧸' },
  'jewelry': { label: 'Schmuck', icon: '💎' },
  'furniture': { label: 'Möbel', icon: '🪑' },
  'general': { label: 'Allgemein', icon: '📦' },
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<CollectionCategory[]>(['hot-wheels', 'general'])
  const [activeCategory, setActiveCategory] = useState<CollectionCategory>('hot-wheels')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('news-categories')
        if (saved) {
          const parsed = JSON.parse(saved)
          setSelectedCategories(parsed)
          if (parsed.length > 0) {
            setActiveCategory(parsed[0])
          }
        }
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
  }, [mounted])

  async function loadNews() {
    setLoading(true)
    setError(null)
    
    try {
      let news: NewsArticle[]
      
      if (searchQuery.trim()) {
        news = await searchNews(searchQuery, 15)
      } else {
        news = await getCollectionNews(activeCategory, 15)
      }
      
      setArticles(news)
    } catch (err) {
      setError('Fehler beim Laden der News')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      loadNews()
    }
  }, [activeCategory, mounted])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadNews()
  }

  function toggleCategory(cat: CollectionCategory) {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat]
    
    setSelectedCategories(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('news-categories', JSON.stringify(updated))
    }
    
    if (!updated.includes(activeCategory) && updated.length > 0) {
      setActiveCategory(updated[0])
    }
  }

  const allCategories = Object.keys(COLLECTION_KEYWORDS) as CollectionCategory[]

  if (!mounted) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📰 Sammler-News</h1>
          <p className="text-slate-500 mt-1">Aktuelle Nachrichten aus der Sammlerwelt</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadNews}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Aktualisieren"
          >
            🔄
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`}
            title="Einstellungen"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">⚙️ Meine Sammelgebiete</h3>
          <p className="text-sm text-slate-500 mb-4">
            Wähle die Kategorien, die dich interessieren:
          </p>
          
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => {
              const info = CATEGORY_LABELS[cat]
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategories.includes(cat)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {info.icon} {info.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategories.map(cat => {
            const info = CATEGORY_LABELS[cat]
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  setSearchQuery('')
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat && !searchQuery
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {info.icon} {info.label}
              </button>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach News..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            Suchen
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">Keine News gefunden.</p>
          {selectedCategories.length === 0 && (
            <button
              onClick={() => setShowSettings(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Kategorien auswählen →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (<a
            
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex gap-4">
                {article.image && (
                  <img
                    src={article.image}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium">{article.source.name}</span>
                    <span>•</span>
                    <span>{getRelativeTime(article.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-500">
        <p>
          News werden alle 15 Minuten aktualisiert. 
          Powered by GNews.io API (Free Tier: 100 Requests/Tag).
        </p>
      </div>
    </div>
  )
}
}
