// Discogs API Service - Kostenlos mit Rate Limits (60/min)
// Docs: https://www.discogs.com/developers

export interface DiscogsRelease {
  id: number
  title: string
  artist: string
  year?: number
  label?: string
  format?: string[]
  genre?: string[]
  style?: string[]
  country?: string
  coverUrl?: string
  tracklist?: { position: string; title: string; duration: string }[]
  lowestPrice?: number
  numForSale?: number
}

export interface DiscogsSearchResult {
  id: number
  title: string
  year?: string
  country?: string
  format?: string[]
  label?: string[]
  genre?: string[]
  style?: string[]
  cover_image?: string
  thumb?: string
  type: string
}

const DISCOGS_USER_AGENT = 'CollectR/1.0'

// Suche nach Barcode
export async function searchByBarcode(barcode: string): Promise<DiscogsRelease | null> {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&type=release`,
      {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const result = data.results?.[0]

    if (!result) return null

    // Details abrufen
    return await getReleaseDetails(result.id)
  } catch (error) {
    console.error('Discogs barcode search error:', error)
    return null
  }
}

// Suche nach Titel/Künstler
export async function searchReleases(query: string, limit = 10): Promise<DiscogsSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=${limit}`,
      {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Discogs search error:', error)
    return []
  }
}

// Release Details abrufen
export async function getReleaseDetails(releaseId: number): Promise<DiscogsRelease | null> {
  try {
    const response = await fetch(
      `https://api.discogs.com/releases/${releaseId}`,
      {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    return {
      id: data.id,
      title: data.title,
      artist: data.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      year: data.year,
      label: data.labels?.[0]?.name,
      format: data.formats?.map((f: any) => f.name),
      genre: data.genres,
      style: data.styles,
      country: data.country,
      coverUrl: data.images?.[0]?.uri || data.images?.[0]?.resource_url,
      tracklist: data.tracklist?.map((t: any) => ({
        position: t.position,
        title: t.title,
        duration: t.duration,
      })),
      lowestPrice: data.lowest_price,
      numForSale: data.num_for_sale,
    }
  } catch (error) {
    console.error('Discogs release details error:', error)
    return null
  }
}

// Marketplace Preis abrufen (falls verfügbar)
export async function getMarketplaceStats(releaseId: number): Promise<{ lowest: number; median: number; highest: number } | null> {
  try {
    const response = await fetch(
      `https://api.discogs.com/marketplace/price_suggestions/${releaseId}`,
      {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    // Discogs gibt Preise nach Zustand zurück
    const vgPlus = data['Very Good Plus (VG+)']
    if (vgPlus) {
      return {
        lowest: vgPlus.value * 0.7,
        median: vgPlus.value,
        highest: vgPlus.value * 1.5,
      }
    }

    return null
  } catch (error) {
    console.error('Discogs marketplace error:', error)
    return null
  }
}
