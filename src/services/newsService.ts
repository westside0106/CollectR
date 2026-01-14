/**
 * News Service für CollectR
 * Verwendet GNews.io API für Sammler-News
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

const newsCache: Map<string, { data: NewsArticle[], timestamp: number }> = new Map()
const CACHE_DURATION = 15 * 60 * 1000

export async function getCollectionNews(
  category: CollectionCategory = 'general',
  limit: number = 10,
  language: string = 'en'
): Promise<NewsArticle[]> {
  const cacheKey = `${category}-${limit}-${language}`

  const cached = newsCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const url = `/api/news?category=${category}&limit=${limit}&language=${language}`
    const response = await fetch(url)

    if (!response.ok) {
      return getMockNews()
    }

    const data: NewsArticle[] = await response.json()

    newsCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    })

    return data
  } catch (error) {
    return getMockNews()
  }
}

export async function searchNews(
  keywords: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  try {
    const url = `/api/news?query=${encodeURIComponent(keywords)}&limit=${limit}`
    const response = await fetch(url)
    if (!response.ok) return []
    const data: NewsArticle[] = await response.json()
    return data
  } catch (error) {
    return []
  }
}

function getMockNews(): NewsArticle[] {
  return [{
    title: '💡 Aktiviere die News-Funktion!',
    description: 'Registriere dich kostenlos auf gnews.io und erhalte Echtzeit-News.',
    content: 'Gehe zu https://gnews.io/register und hole dir deinen kostenlosen API Key.',
    url: 'https://gnews.io/register',
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: 'CollectR Setup', url: '' }
  }]
}

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
