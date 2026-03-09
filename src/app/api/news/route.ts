import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google News RSS – komplett kostenlos, kein API-Key nötig
// Suchbegriffe pro Sammelkategorie (Deutsch + Englisch für bessere Abdeckung)
const COLLECTION_KEYWORDS: Record<string, string> = {
  'hot-wheels':  'Hot Wheels Sammlung',
  'antiques':    'Antiquitäten Auktion',
  'art':         'Kunst Auktion',
  'coins':       'Münzen Numismatik',
  'stamps':      'Briefmarken Sammlung',
  'watches':     'Luxusuhren',
  'toys':        'Vintage Spielzeug',
  'comics':      'Comic Sammlung',
  'vinyl':       'Vinyl Schallplatten',
  'furniture':   'Antike Möbel',
  'jewelry':     'Schmuck Auktion',
  'general':     'Sammlerstücke Auktion',
  'tcg':         'Trading Card Pokémon',
  'gaming':      'Retro Gaming Sammlung',
  'market':      'Aktien Markt Krypto',
}

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

// Minimaler RSS-XML-Parser (kein Paket nötig)
function parseRssXml(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = []

  // Alle <item>-Blöcke extrahieren
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of itemMatches) {
    const item = match[1]

    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s)?.[1]
      ?? item.match(/<title>(.*?)<\/title>/s)?.[1]
      ?? ''

    const link = item.match(/<link>(.*?)<\/link>/s)?.[1]
      ?? item.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1]
      ?? ''

    const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
      ?? item.match(/<description>([\s\S]*?)<\/description>/s)?.[1]
      ?? ''

    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    const sourceName = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1]
      ?? new URL(link || 'https://news.google.com').hostname.replace('www.', '')

    // HTML-Tags aus Description entfernen
    const cleanDescription = description.replace(/<[^>]*>/g, '').trim().slice(0, 300)

    if (title && link) {
      articles.push({
        title: title.trim(),
        description: cleanDescription,
        content: cleanDescription,
        url: link.trim(),
        image: null,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: { name: sourceName, url: '' },
      })
    }
  }

  return articles
}

export async function GET(request: NextRequest) {
  try {
    // Auth-Check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') ?? 'general'
    const query = searchParams.get('query')
    const language = searchParams.get('language') ?? 'de'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

    const searchTerm = query ?? COLLECTION_KEYWORDS[category] ?? 'Sammler Auktion'

    // Google News RSS – unterstützt Deutsch (hl=de, gl=DE) und Englisch (hl=en, gl=US)
    const hl = language === 'de' ? 'de' : 'en'
    const gl = language === 'de' ? 'DE' : 'US'
    const ceid = language === 'de' ? 'DE:de' : 'US:en'

    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=${hl}&gl=${gl}&ceid=${ceid}`

    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'CollectorssphereApp/1.0 +https://collectorssphere.com' },
      next: { revalidate: 900 }, // 15 Minuten Cache
    })

    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const xml = await response.text()
    const articles = parseRssXml(xml).slice(0, limit)

    return NextResponse.json(articles)

  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
