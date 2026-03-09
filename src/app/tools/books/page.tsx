'use client'

import { useState } from 'react'
import {
  searchByISBN,
  searchBooks,
  getIsbnCoverUrl,
  getCoverUrl,
  type OpenLibraryBook,
  type OpenLibrarySearchResult
} from '@/services/openLibraryApi'
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
    } catch {
      setError('Fehler bei der Suche. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectResult(result: OpenLibrarySearchResult) {
    if (result.isbn && result.isbn.length > 0) {
      setLoading(true)
      setSearchResults([])
      const detailed = await searchByISBN(result.isbn[0])
      setLoading(false)
      if (detailed) setBook(detailed)
    }
  }

  function resetSearch() {
    setBook(null)
    setSearchResults([])
    setError(null)
    setQuery('')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Gradient Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📚</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Bücher-Suche</h1>
          </div>
          <p className="text-emerald-100 text-sm sm:text-base">
            Open Library · 20+ Millionen Bücher · Komplett kostenlos, kein API-Key
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-4">

        {/* Suchmaske */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              {(['isbn', 'text'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setSearchType(type); setQuery('') }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    searchType === type
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type === 'isbn' ? '🔢 ISBN-Suche' : '🔍 Titel / Autor'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={searchType === 'isbn' ? 'ISBN eingeben (z.B. 978-3-...)' : 'Titel oder Autor eingeben...'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition"
              >
                {loading ? '⟳' : 'Suchen'}
              </button>
            </div>
          </form>
        </div>

        {/* Fehler */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                {searchResults.length} Ergebnisse
              </h2>
              <button onClick={resetSearch} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                Zurücksetzen
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {searchResults.map(result => (
                <button
                  key={result.key}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition text-left"
                >
                  {result.cover_i ? (
                    <img
                      src={getCoverUrl(result.cover_i, 'S')}
                      alt={result.title}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                      📚
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate text-sm">{result.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {result.author_name?.join(', ') || 'Unbekannter Autor'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex gap-2">
                      {result.first_publish_year && <span>{result.first_publish_year}</span>}
                      {result.publisher?.[0] && <span>· {result.publisher[0]}</span>}
                    </div>
                  </div>
                  {result.isbn?.[0] && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:block">
                      {result.isbn[0]}
                    </div>
                  )}
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !book && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
            <div className="flex gap-6">
              <div className="w-36 h-52 bg-slate-200 dark:bg-slate-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Buch-Detail */}
        {book && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Buch-Details</h2>
              <button onClick={resetSearch} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                Neue Suche
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
                {/* Cover */}
                <div className="flex-shrink-0">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full md:w-40 h-auto rounded-xl shadow-md" />
                  ) : (book.isbn13 || book.isbn10) ? (
                    <img
                      src={getIsbnCoverUrl((book.isbn13 || book.isbn10)!, 'L')}
                      alt={book.title}
                      className="w-full md:w-40 h-auto rounded-xl shadow-md"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full md:w-40 h-56 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-6xl">📚</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{book.title}</h3>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">{book.authors.join(', ')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      book.isbn13 && { label: 'ISBN-13', value: book.isbn13, mono: true },
                      book.isbn10 && { label: 'ISBN-10', value: book.isbn10, mono: true },
                      book.publishDate && { label: 'Erschienen', value: book.publishDate, mono: false },
                      book.publishers.length > 0 && { label: 'Verlag', value: book.publishers.join(', '), mono: false },
                      book.pageCount && { label: 'Seiten', value: String(book.pageCount), mono: false },
                    ].filter(Boolean).map((item, i) => item && (
                      <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                        <div className={`font-medium text-slate-900 dark:text-white text-sm mt-0.5 ${item.mono ? 'font-mono' : ''}`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {book.subjects && book.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {book.subjects.map((subject, i) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                          {subject}
                        </span>
                      ))}
                    </div>
                  )}

                  {book.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                      {book.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition"
                    >
                      + Zur Sammlung
                    </button>
                    {(book.isbn13 || book.isbn10) && (
                      <a
                        href={`https://openlibrary.org/isbn/${book.isbn13 || book.isbn10}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium text-sm transition hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                      >
                        Open Library ansehen ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-600">
          Powered by Open Library · Internet Archive · Kein API-Key · Offen für alle
        </p>
      </div>

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
            },
          }}
        />
      )}
    </div>
  )
}
