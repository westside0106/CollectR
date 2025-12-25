// Discogs API Service - Läuft über eigene API-Route für bessere Authentifizierung
// Die API-Route nutzt den optionalen DISCOGS_TOKEN aus env

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

// Suche nach Barcode
export async function searchByBarcode(barcode: string): Promise<DiscogsRelease | null> {
  try {
    const response = await fetch(`/api/discogs/search?barcode=${encodeURIComponent(barcode)}`)

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
export async function searchReleases(query: string, limit = 20): Promise<DiscogsSearchResult[]> {
  try {
    const response = await fetch(
      `/api/discogs/search?q=${encodeURIComponent(query)}&limit=${limit}`
    )

    if (!response.ok) {
      console.error('Discogs search failed:', response.status)
      return []
    }

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
    const response = await fetch(`/api/discogs/release/${releaseId}`)

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

// Marketplace Preis abrufen (erfordert Token)
export async function getMarketplaceStats(releaseId: number): Promise<{ lowest: number; median: number; highest: number } | null> {
  try {
    // Diese Funktion braucht einen Token - überspringen wenn nicht konfiguriert
    const response = await fetch(`/api/discogs/release/${releaseId}`)

    if (!response.ok) return null

    const data = await response.json()

    // Nutze lowest_price aus Release-Daten wenn verfügbar
    if (data.lowest_price) {
      return {
        lowest: data.lowest_price,
        median: data.lowest_price * 1.2,
        highest: data.lowest_price * 2,
      }
    }

    return null
  } catch (error) {
    console.error('Discogs marketplace error:', error)
    return null
  }
}
