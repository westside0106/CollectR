'use client'

import { useState } from 'react'
import Link from 'next/link'
import { searchByISBN, searchBooks, getIsbnCoverUrl, type OpenLibraryBook, type OpenLibrarySearchResult, getCoverUrl } from '@/services/openLibraryApi'
import { AddToCollectionModal } from '@/components/AddToCollectionModal'

export default function BooksLookupPage() {
  const [searchType, setSearchType] = useState<'isbn' | 'text'>('isbn')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [book, setBook] = useState<OpenLibraryBook | null>(null)
  const [searchResults, setSearchResults] = useState<OpenLibrarySearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setBook(null)
    setSearchResults([])

    try {
      if (searchType === 'isbn') {
        const result = await searchByISBN(query.trim())
        if (result) {
          setBook(result)
        } else {
          setError('Kein Buch mit dieser ISBN gefunden.')
        }
      } else {
        const results = await searchBooks(query.trim(), 20)
        if (results.length > 0) {
          setSearchResults(results)
        } else {
          setError('Keine Bücher gefunden.')
        }
      }
    } catch (err) {
      setError('Fehler bei der Suche. Bitte versuchen Sie es erneut.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectResult(result: OpenLibrarySearchResult) {
    if (result.isbn && result.isbn.length > 0) {
      setLoading(true)
      const detailedBook = await searchByISBN(result.isbn[0])
      setLoading(false)
      if (detailedBook) {
        setBook(detailedBook)
        setSearchResults([])
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 container-responsive">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mb-3 sm:mb-4 inline-block">
            &larr; Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bücher-Suche</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Suche nach Büchern via Open Library - kostenlos und ohne API-Key
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm card-padding mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
            {/* Search Type Toggle */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-4">
              <button
                type="button"
                onClick={() => setSearchType('isbn')}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-medium transition ${
                  searchType === 'isbn'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ISBN-Suche
              </button>
              <button
                type="button"
                onClick={() => setSearchType('text')}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-medium transition ${
                  searchType === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Titel/Autor-Suche
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === 'isbn' ? 'ISBN eingeben (z.B. 978-3-...)' : 'Titel oder Autor eingeben...'}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Suche...' : 'Suchen'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Search Results List */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm card-padding mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Suchergebnisse ({searchResults.length})</h2>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <button
                  key={result.key}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition text-left border border-gray-200"
                >
                  {result.cover_i ? (
                    <img
                      src={getCoverUrl(result.cover_i, 'S')}
                      alt={result.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                      📚
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.title}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {result.author_name?.join(', ') || 'Unbekannter Autor'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.first_publish_year && `Erschienen: ${result.first_publish_year}`}
                      {result.publisher && result.publisher.length > 0 && ` | ${result.publisher[0]}`}
                    </div>
                  </div>
                  {result.isbn && result.isbn.length > 0 && (
                    <div className="text-xs text-gray-400">
                      ISBN: {result.isbn[0]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Book Detail */}
        {book && (
          <div className="bg-white rounded-xl shadow-sm card-padding">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Buch-Details</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover */}
              <div className="flex-shrink-0">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-48 h-auto rounded-lg shadow-md"
                  />
                ) : book.isbn13 || book.isbn10 ? (
                  <img
                    src={getIsbnCoverUrl(book.isbn13 || book.isbn10 || '', 'L')}
                    alt={book.title}
                    className="w-48 h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{book.title}</h3>
                  <p className="text-lg text-gray-600">{book.authors.join(', ')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {book.isbn13 && (
                    <div>
                      <span className="text-sm text-gray-500">ISBN-13:</span>
                      <p className="font-mono">{book.isbn13}</p>
                    </div>
                  )}
                  {book.isbn10 && (
                    <div>
                      <span className="text-sm text-gray-500">ISBN-10:</span>
                      <p className="font-mono">{book.isbn10}</p>
                    </div>
                  )}
                  {book.publishDate && (
                    <div>
                      <span className="text-sm text-gray-500">Erscheinungsdatum:</span>
                      <p>{book.publishDate}</p>
                    </div>
                  )}
                  {book.publishers.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Verlag:</span>
                      <p>{book.publishers.join(', ')}</p>
                    </div>
                  )}
                  {book.pageCount && (
                    <div>
                      <span className="text-sm text-gray-500">Seiten:</span>
                      <p>{book.pageCount}</p>
                    </div>
                  )}
                </div>

                {book.subjects && book.subjects.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Themen:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {book.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {book.description && (
                  <div>
                    <span className="text-sm text-gray-500">Beschreibung:</span>
                    <p className="text-gray-700 mt-1">{book.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    + Zur Sammlung hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(book, null, 2))
                      alert('Buchdaten in Zwischenablage kopiert!')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Daten kopieren
                  </button>
                  <a
                    href={`https://openlibrary.org/isbn/${book.isbn13 || book.isbn10}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    Auf Open Library ansehen
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-xl card-padding">
          <h3 className="font-semibold text-blue-900 mb-2">Über Open Library</h3>
          <p className="text-blue-800 text-sm">
            Open Library ist eine offene, editierbare Bibliotheksdatenbank mit über 20 Millionen Büchern.
            Die API ist kostenlos und benötigt keinen API-Key. Perfekt für Buchsammler!
          </p>
        </div>
      </div>

      {/* Add to Collection Modal */}
      {book && (
        <AddToCollectionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          itemType="book"
          itemData={{
            name: book.title,
            description: book.authors.join(', '),
            barcode: book.isbn13 || book.isbn10 || undefined,
            coverUrl: book.coverUrl || (book.isbn13 ? getIsbnCoverUrl(book.isbn13, 'L') : undefined),
            notes: [
              book.publishers.length > 0 ? `Verlag: ${book.publishers.join(', ')}` : '',
              book.publishDate ? `Erschienen: ${book.publishDate}` : '',
              book.pageCount ? `${book.pageCount} Seiten` : '',
            ].filter(Boolean).join('\n'),
            attributes: {
              isbn13: book.isbn13,
              isbn10: book.isbn10,
              authors: book.authors,
              publishers: book.publishers,
              publishDate: book.publishDate,
              pageCount: book.pageCount,
              subjects: book.subjects,
            }
          }}
        />
      )}
    </div>
  )
}
