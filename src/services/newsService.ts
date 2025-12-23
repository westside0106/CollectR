/**
 * News Service für CollectR
 * 
 * Verwendet GNews.io API für Sammler-News
 * Free Tier: 100 Requests/Tag (kein Credit Card nötig!)
 * 
 * API Docs: https://gnews.io/docs/v4
 * Sign up: https://gnews.io/register (gratis)
 */

export interface NewsArticle {
  title: string
  description: string
  content: string
  url: string
  image: string | null
  publishedAt: string
  source: {
    name: string
    url: string
  }
}

interface GNewsResponse {
  totalArticles: number
  articles: Array<{
    title: string
    description: string
    content: string
    url: string
    image: string | null
    publishedAt: string
    source: {
      name: string
      url: string
    }
  }>
}

// Sammler-relevante Suchbegriffe
export const COLLECTION_KEYWORDS = {
  'hot-wheels': 'Hot Wheels collectible',
  'antiques': 'antiques auction',
  'art': 'art auction',
  'coins': 'rare coins numismatic',
  'stamps': 'stamp collecting',
  'watches': 'luxury watches',
  'toys': 'vintage toys',
  'comics': 'comic books',
  'vinyl': 'vinyl records',
  'furniture': 'antique furniture',
  'jewelry': 'jewelry auction',
  'general': 'collectibles auction',
} as const

export type CollectionCategory = keyof typeof COLLECTION_KEYWORDS

// Cache für News (15 Minuten)
const newsCache: Map<string, { data: NewsArticle[], timestamp: number }> = new Map()
const CACHE_DURATION = 15 * 60 * 1000 // 15 Minuten

/**
 * Holt News zu einem Sammelgebiet
 * 
 * WICHTIG: Für die Nutzung brauchst du einen KOSTENLOSEN API Key von gnews.io
 * 1. Gehe zu https://gnews.io/register
 * 2. Registriere dich (kostenlos, keine CC)
 * 3. Kopiere deinen API Key
 * 4. Füge ihn in .env.local hinzu: NEXT_PUBLIC_GNEWS_API_KEY=dein_key
 */
export async function getCollectionNews(
  category: CollectionCategory = 'general',
  limit: number = 10,
  language: string = 'en' // GNews unterstützt: de, en, es, fr, it, nl, pt, ru, zh
): Promise<NewsArticle[]> {
  const cacheKey = `${category}-${limit}-${language}`
  
  // Cache prüfen
  const cached = newsCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  // API Key aus .env laden
  const apiKey = process.env.NEXT_PUBLIC_GNEWS_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ GNEWS_API_KEY nicht gesetzt!')
    console.warn('Registriere dich kostenlos auf https://gnews.io/register')
    console.warn('Füge dann deinen Key in .env.local hinzu: NEXT_PUBLIC_GNEWS_API_KEY=...')
    return getMockNews(category) // Fallback auf Mock-Daten
  }

  try {
    const query = COLLECTION_KEYWORDS[category]
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${language}&max=${limit}&apikey=${apiKey}`
    
    const response = await fetch(url, {
      next: { revalidate: 900 } // Next.js Cache: 15 Minuten
    })

    if (!response.ok) {
      console.error('GNews API Error:', response.status)
      return getMockNews(category)
    }

    const data: GNewsResponse = await response.json()

    // Cache aktualisieren
    newsCache.set(cacheKey, {
      data: data.articles,
      timestamp: Date.now()
    })

    return data.articles
  } catch (error) {
    console.error('Fehler beim Abrufen der News:', error)
    return getMockNews(category)
  }
}

/**
 * Sucht News mit benutzerdefinierten Keywords
 */
export async function searchNews(
  keywords: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEXT_PUBLIC_GNEWS_API_KEY
  
  if (!apiKey) {
    console.warn('GNEWS_API_KEY nicht gesetzt')
    return []
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keywords)}&max=${limit}&apikey=${apiKey}`
    
    const response = await fetch(url)

    if (!response.ok) return []

    const data: GNewsResponse = await response.json()
    return data.articles
  } catch (error) {
    console.error('Fehler beim Suchen von News:', error)
    return []
  }
}

/**
 * Mock-Daten falls kein API Key vorhanden
 */
function getMockNews(category: CollectionCategory): NewsArticle[] {
  const mockArticles: Record<CollectionCategory, NewsArticle[]> = {
    'hot-wheels': [
      {
        title: 'Neue Hot Wheels Legends Tour 2024 angekündigt',
        description: 'Mattel kündigt die nächste Runde der Hot Wheels Legends Tour an...',
        content: 'Mattel hat die Details zur Hot Wheels Legends Tour 2024 bekannt gegeben.',
        url: 'https://hotwheels.fandom.com',
        image: null,
        publishedAt: new Date().toISOString(),
        source: { name: 'Hot Wheels News', url: 'https://hotwheels.com' }
      }
    ],
    'antiques': [
      {
        title: 'Rekordauktion für antike Möbel',
        description: 'Bei einer Auktion in London wurden Rekordpreise erzielt...',
        content: 'Seltene antike Möbel erzielen Höchstpreise.',
        url: 'https://www.sothebys.com',
        image: null,
        publishedAt: new Date().toISOString(),
        source: { name: "Sotheby's", url: 'https://sothebys.com' }
      }
    ],
    'general': [
      {
        title: '💡 Aktiviere die News-Funktion!',
        description: 'Registriere dich kostenlos auf gnews.io und erhalte Echtzeit-News zu deinen Sammelgebieten.',
        content: 'Gehe zu https://gnews.io/register und hole dir deinen kostenlosen API Key.',
        url: 'https://gnews.io/register',
        image: null,
        publishedAt: new Date().toISOString(),
        source: { name: 'CollectR Setup', url: '' }
      }
    ]
  }

  return mockArticles[category] || mockArticles.general
}

/**
 * Formatiert das Datum eines Artikels
 */
export function formatNewsDate(dateString: string, locale: string = 'de-DE'): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Gibt relative Zeit zurück (z.B. "vor 2 Stunden")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Min.`
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
  return formatNewsDate(dateString)
}
