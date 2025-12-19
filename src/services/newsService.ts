/**
 * News Service für CollectR
 * 
 * Verwendet mediastack API für Sammler-News
 * Free Tier: 100 Requests/Monat, 30 Min Verzögerung
 * 
 * API Docs: https://mediastack.com/documentation
 */

export interface NewsArticle {
  author: string | null
  title: string
  description: string
  url: string
  source: string
  image: string | null
  category: string
  language: string
  country: string
  published_at: string
}

interface MediastackResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: NewsArticle[]
  error?: {
    code: string
    message: string
  }
}

// Sammler-relevante Suchbegriffe
export const COLLECTION_KEYWORDS = {
  'hot-wheels': 'Hot Wheels collectible diecast cars Mattel',
  'coins': 'coin collecting numismatic rare coins',
  'stamps': 'stamp collecting philately rare stamps',
  'antiques': 'antiques auction vintage collectibles',
  'watches': 'luxury watches Rolex Omega collectible timepiece',
  'art': 'art auction Christie Sotheby painting',
  'vinyl': 'vinyl records collecting rare albums',
  'comics': 'comic books collectible Marvel DC rare',
  'toys': 'vintage toys collectible action figures',
  'jewelry': 'jewelry auction diamonds gems collectible',
  'furniture': 'antique furniture vintage design collectible',
  'general': 'collectibles auction rare vintage',
} as const

export type CollectionCategory = keyof typeof COLLECTION_KEYWORDS

// Cache für News (15 Minuten)
const newsCache: Map<string, { data: NewsArticle[], timestamp: number }> = new Map()
const CACHE_DURATION = 15 * 60 * 1000 // 15 Minuten

/**
 * Holt News zu einem Sammelgebiet
 */
export async function getCollectionNews(
  category: CollectionCategory = 'general',
  limit: number = 10,
  language: string = 'de,en'
): Promise<NewsArticle[]> {
  const cacheKey = `${category}-${limit}-${language}`
  
  // Cache prüfen
  const cached = newsCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const apiKey = process.env.NEXT_PUBLIC_MEDIASTACK_API_KEY
  
  if (!apiKey) {
    console.warn('MEDIASTACK_API_KEY nicht gesetzt')
    return []
  }

  try {
    const keywords = encodeURIComponent(COLLECTION_KEYWORDS[category])
    const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${keywords}&languages=${language}&limit=${limit}&sort=published_desc`
    
    const response = await fetch(url, {
      next: { revalidate: 900 } // Next.js Cache: 15 Minuten
    })

    const data: MediastackResponse = await response.json()

    if (data.error) {
      console.error('Mediastack Error:', data.error)
      return []
    }

    // Cache aktualisieren
    newsCache.set(cacheKey, {
      data: data.data,
      timestamp: Date.now()
    })

    return data.data
  } catch (error) {
    console.error('Fehler beim Abrufen der News:', error)
    return []
  }
}

/**
 * Sucht News mit benutzerdefinierten Keywords
 */
export async function searchNews(
  keywords: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEXT_PUBLIC_MEDIASTACK_API_KEY
  
  if (!apiKey) {
    console.warn('MEDIASTACK_API_KEY nicht gesetzt')
    return []
  }

  try {
    const encodedKeywords = encodeURIComponent(keywords)
    const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${encodedKeywords}&limit=${limit}&sort=published_desc`
    
    const response = await fetch(url)
    const data: MediastackResponse = await response.json()

    if (data.error) {
      console.error('Mediastack Error:', data.error)
      return []
    }

    return data.data
  } catch (error) {
    console.error('Fehler beim Suchen von News:', error)
    return []
  }
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
export function getRelativeTime(dateString: string, locale: string = 'de-DE'): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) {
    return `vor ${diffMins} Minuten`
  } else if (diffHours < 24) {
    return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`
  } else if (diffDays < 7) {
    return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
  } else {
    return formatNewsDate(dateString, locale)
  }
}
