import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DISCOGS_USER_AGENT = 'CollectR/1.0 +https://collectr.app'
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check - require authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Release ID required' }, { status: 400 })
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': DISCOGS_USER_AGENT,
    }

    if (DISCOGS_TOKEN) {
      headers['Authorization'] = `Discogs token=${DISCOGS_TOKEN}`
    }

    const response = await fetch(`https://api.discogs.com/releases/${id}`, { headers })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Discogs API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Discogs release error:', error)
    return NextResponse.json({ error: 'Failed to fetch release' }, { status: 500 })
  }
}
