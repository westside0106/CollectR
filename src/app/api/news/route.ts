import { NextRequest, NextResponse } from 'next/server'

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || ''

const COLLECTION_KEYWORDS = {
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

type CollectionCategory = keyof typeof COLLECTION_KEYWORDS

interface NewsArticle {
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
  articles: NewsArticle[]
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as CollectionCategory | null
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')
    const language = searchParams.get('language') || 'en'

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // If no API key, return mock data
    if (!GNEWS_API_KEY) {
      return NextResponse.json(getMockNews())
    }

    let searchTerm: string

    // Use custom search query if provided
    if (query) {
      searchTerm = query
    } else if (category && category in COLLECTION_KEYWORDS) {
      searchTerm = COLLECTION_KEYWORDS[category]
    } else {
      return NextResponse.json(
        { error: 'Either category or query parameter is required' },
        { status: 400 }
      )
    }

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchTerm)}&lang=${language}&max=${limit}&apikey=${GNEWS_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 900 } // 15 minutes
    })

    if (!response.ok) {
      return NextResponse.json(getMockNews())
    }

    const data: GNewsResponse = await response.json()

    return NextResponse.json(data.articles)

  } catch (error) {
    return NextResponse.json(getMockNews())
  }
}
