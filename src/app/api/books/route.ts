import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Open Library API Proxy – kein API-Key nötig, komplett kostenlos
// Läuft server-seitig um CORS-Probleme zu vermeiden
// Docs: https://openlibrary.org/developers/api

const OL_BASE = 'https://openlibrary.org'
const COVERS_BASE = 'https://covers.openlibrary.org'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'isbn' | 'search'
    const query = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    if (!type || !query) {
      return NextResponse.json({ error: 'type und q Parameter erforderlich' }, { status: 400 })
    }

    const headers = {
      'User-Agent': 'CollectorssphereApp/1.0 +https://collectorssphere.com',
    }

    if (type === 'isbn') {
      // ISBN-Suche: gibt einzelnes Buch zurück
      const cleanIsbn = query.replace(/[-\s]/g, '')
      const response = await fetch(
        `${OL_BASE}/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`,
        { headers, next: { revalidate: 86400 } } // 24h Cache
      )

      if (!response.ok) {
        return NextResponse.json({ error: 'Open Library nicht erreichbar' }, { status: 502 })
      }

      const data = await response.json()
      const bookData = data[`ISBN:${cleanIsbn}`]

      if (!bookData) {
        return NextResponse.json({ found: false })
      }

      return NextResponse.json({ found: true, book: bookData })

    } else if (type === 'search') {
      // Titel/Autor-Suche
      const response = await fetch(
        `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,publisher`,
        { headers, next: { revalidate: 3600 } } // 1h Cache
      )

      if (!response.ok) {
        return NextResponse.json({ error: 'Open Library nicht erreichbar' }, { status: 502 })
      }

      const data = await response.json()
      return NextResponse.json({ results: data.docs ?? [] })

    } else {
      return NextResponse.json({ error: 'Ungültiger type (isbn|search)' }, { status: 400 })
    }

  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json({ error: 'Fehler bei der Buchsuche' }, { status: 500 })
  }
}
