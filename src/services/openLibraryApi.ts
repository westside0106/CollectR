// Open Library API Service – läuft über /api/books Proxy (server-seitig, kein CORS)
// Docs: https://openlibrary.org/developers/api

export interface OpenLibraryBook {
  title: string
  authors: string[]
  publishDate: string
  publishers: string[]
  isbn10?: string
  isbn13?: string
  coverUrl?: string
  pageCount?: number
  subjects?: string[]
  description?: string
}

export interface OpenLibrarySearchResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  isbn?: string[]
  cover_i?: number
  publisher?: string[]
}

// ISBN-Suche (10 oder 13 Stellen)
export async function searchByISBN(isbn: string): Promise<OpenLibraryBook | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, '')

  try {
    const response = await fetch(`/api/books?type=isbn&q=${encodeURIComponent(cleanIsbn)}`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.found || !data.book) return null

    const bookData = data.book

    return {
      title: bookData.title ?? '',
      authors: (bookData.authors ?? []).map((a: { name: string }) => a.name),
      publishDate: bookData.publish_date ?? '',
      publishers: (bookData.publishers ?? []).map((p: { name: string }) => p.name),
      isbn10: bookData.identifiers?.isbn_10?.[0],
      isbn13: bookData.identifiers?.isbn_13?.[0],
      coverUrl: bookData.cover?.large ?? bookData.cover?.medium ?? bookData.cover?.small,
      pageCount: bookData.number_of_pages,
      subjects: (bookData.subjects ?? []).map((s: { name: string }) => s.name).slice(0, 5),
      description: typeof bookData.description === 'string'
        ? bookData.description
        : bookData.description?.value,
    }
  } catch (error) {
    console.error('Open Library ISBN error:', error)
    return null
  }
}

// Titel/Autor-Suche
export async function searchBooks(query: string, limit = 10): Promise<OpenLibrarySearchResult[]> {
  try {
    const response = await fetch(
      `/api/books?type=search&q=${encodeURIComponent(query)}&limit=${limit}`
    )
    if (!response.ok) return []

    const data = await response.json()
    return data.results ?? []
  } catch (error) {
    console.error('Open Library search error:', error)
    return []
  }
}

// Cover-URL nach Cover-ID
export function getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

// Cover-URL nach ISBN
export function getIsbnCoverUrl(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
}
