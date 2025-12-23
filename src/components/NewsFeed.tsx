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

interface NewsFeedProps {
  category?: CollectionCategory
  limit?: number
  showSearch?: boolean
}

export function NewsFeed({
  category = 'general',
  limit = 5,
  showSearch = true
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory>(category)
  const [searchQuery, setSearchQuery] = useState('')

  async function loadNews() {
    setLoading(true)
    setError(null)
    
    try {
      let news: NewsArticle[]
      
      if (searchQuery.trim()) {
        news = await searchNews(searchQuery, limit)
      } else {
        news = await getCollectionNews(selectedCategory, limit)
      }
      
      setArticles(news)
    } catch (err) {
      setError('Fehler beim Laden der News')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [selectedCategory])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadNews()
  }

  const categoryOptions = Object.keys(COLLECTION_KEYWORDS) as CollectionCategory[]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📰 Sammler-News</h3>
        <button
          onClick={loadNews}
          disabled={loading}
          className="text-sm hover:bg-slate-100 p-1 rounded disabled:opacity-50 transition"
          title="Aktualisieren"
        >
          🔄
        </button>
      </div>

      {/* Kategorie-Auswahl */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            setSelectedCategory('hot-wheels')
            setSearchQuery('')
          }}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            selectedCategory === 'hot-wheels' && !searchQuery
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🚗 Hot Wheels
        </button>
        <button
          onClick={() => {
            setSelectedCategory('antiques')
            setSearchQuery('')
          }}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            selectedCategory === 'antiques' && !searchQuery
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🏺 Allgemein
        </button>
      </div>

      {/* Suche */}
      {showSearch && (
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach News..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition"
            >
              Suchen
            </button>
          </div>
        </form>
      )}

      {/* Setup Hinweis wenn kein API Key */}
      {!process.env.NEXT_PUBLIC_GNEWS_API_KEY && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900 font-medium mb-2">
            💡 News-Funktion aktivieren
          </p>
          <p className="text-xs text-yellow-800 mb-3">
            Registriere dich kostenlos auf gnews.io und erhalte Echtzeit-News zu deinen Sammelgebieten.
          </p>
          <a
            href="https://gnews.io/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition"
          >
            Kostenlosen API Key holen →
          </a>
          <p className="text-xs text-yellow-700 mt-2">
            Nach Registrierung: Key in .env.local als NEXT_PUBLIC_GNEWS_API_KEY eintragen
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-slate-500 text-center py-8">
          Keine News gefunden.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <article key={index} className="border-b border-slate-100 pb-4 last:border-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="flex gap-4">
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    {article.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span>{article.source.name}</span>
                      <span>•</span>
                      <span>{getRelativeTime(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}

      {/* API Info */}
      <p className="text-xs text-slate-400 mt-4 text-center">
        News werden alle 15 Minuten aktualisiert. Powered by {process.env.NEXT_PUBLIC_GNEWS_API_KEY ? 'GNews.io (Free Tier: 30 Min Verzögerung)' : 'Mock Data'}
      </p>
    </div>
  )
}
