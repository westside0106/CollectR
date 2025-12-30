// Open Library API Service - Kostenlos, kein API Key nötig
// Docs: https://openlibrary.org/developers/api

// Internal API response types
interface OpenLibraryAuthor {
  name: string
  url?: string
}

interface OpenLibraryPublisher {
  name: string
}

interface OpenLibrarySubject {
  name: string
  url?: string
}

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

// Suche nach ISBN (10 oder 13 stellig)
export async function searchByISBN(isbn: string): Promise<OpenLibraryBook | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, '')

  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
    )

    if (!response.ok) return null

    const data = await response.json()
    const bookData = data[`ISBN:${cleanIsbn}`]

    if (!bookData) return null

    const authors = bookData.authors as OpenLibraryAuthor[] | undefined
    const publishers = bookData.publishers as OpenLibraryPublisher[] | undefined
    const subjects = bookData.subjects as OpenLibrarySubject[] | undefined

    return {
      title: bookData.title || '',
      authors: authors?.map(a => a.name) || [],
      publishDate: bookData.publish_date || '',
      publishers: publishers?.map(p => p.name) || [],
      isbn10: bookData.identifiers?.isbn_10?.[0],
      isbn13: bookData.identifiers?.isbn_13?.[0],
      coverUrl: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small,
      pageCount: bookData.number_of_pages,
      subjects: subjects?.map(s => s.name).slice(0, 5) || [],
    }
  } catch (error) {
    console.error('Open Library API error:', error)
    return null
  }
}

// Suche nach Titel/Autor
export async function searchBooks(query: string, limit = 10): Promise<OpenLibrarySearchResult[]> {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error('Open Library search error:', error)
    return []
  }
}

// Cover URL generieren
export function getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

// ISBN Cover URL
export function getIsbnCoverUrl(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
}
