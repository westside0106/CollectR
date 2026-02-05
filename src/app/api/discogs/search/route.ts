import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Discogs erfordert einen User-Agent und optional einen Token
const DISCOGS_USER_AGENT = 'CollectR/1.0 +https://collectr.app'
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || ''

export async function GET(request: NextRequest) {
  // Auth check - require authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const barcode = searchParams.get('barcode')
  const limit = searchParams.get('limit') || '20'

  if (!query && !barcode) {
    return NextResponse.json({ error: 'Query or barcode required' }, { status: 400 })
  }

  try {
    let url = 'https://api.discogs.com/database/search?type=release'

    if (barcode) {
      url += `&barcode=${encodeURIComponent(barcode)}`
    } else if (query) {
      url += `&q=${encodeURIComponent(query)}&per_page=${limit}`
    }

    const headers: Record<string, string> = {
      'User-Agent': DISCOGS_USER_AGENT,
    }

    // Token hinzufügen wenn vorhanden
    if (DISCOGS_TOKEN) {
      headers['Authorization'] = `Discogs token=${DISCOGS_TOKEN}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discogs API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Discogs API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Discogs search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
