'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  searchByBarcode,
  searchReleases,
  getReleaseDetails,
  getMarketplaceStats,
  type DiscogsRelease,
  type DiscogsSearchResult
} from '@/services/discogsApi'
import { AddToCollectionModal } from '@/components/AddToCollectionModal'

export default function VinylLookupPage() {
  const [searchType, setSearchType] = useState<'barcode' | 'text'>('barcode')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [release, setRelease] = useState<DiscogsRelease | null>(null)
  const [marketStats, setMarketStats] = useState<{ lowest: number; median: number; highest: number } | null>(null)
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setRelease(null)
    setMarketStats(null)
    setSearchResults([])

    try {
      if (searchType === 'barcode') {
        const result = await searchByBarcode(query.trim())
        if (result) {
          setRelease(result)
          // Versuche Marktpreise zu laden
          const stats = await getMarketplaceStats(result.id)
          if (stats) setMarketStats(stats)
        } else {
          setError('Kein Release mit diesem Barcode gefunden.')
        }
      } else {
        const results = await searchReleases(query.trim(), 20)
        if (results.length > 0) {
          setSearchResults(results)
        } else {
          setError('Keine Releases gefunden.')
        }
      }
    } catch (err) {
      setError('Fehler bei der Suche. Bitte versuchen Sie es erneut.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectResult(result: DiscogsSearchResult) {
    setLoading(true)
    const detailedRelease = await getReleaseDetails(result.id)
    if (detailedRelease) {
      setRelease(detailedRelease)
      setSearchResults([])
      // Versuche Marktpreise zu laden
      const stats = await getMarketplaceStats(result.id)
      if (stats) setMarketStats(stats)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            &larr; Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Vinyl-Suche</h1>
          <p className="text-gray-600 mt-2">
            Suche nach Schallplatten via Discogs - die größte Musikdatenbank der Welt
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Type Toggle */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setSearchType('barcode')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  searchType === 'barcode'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Barcode-Suche
              </button>
              <button
                type="button"
                onClick={() => setSearchType('text')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  searchType === 'text'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Titel/Künstler-Suche
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === 'barcode' ? 'Barcode eingeben...' : 'Titel oder Künstler eingeben...'}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Suchergebnisse ({searchResults.length})</h2>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition text-left border border-gray-200"
                >
                  {result.cover_image || result.thumb ? (
                    <img
                      src={result.thumb || result.cover_image}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      💿
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.title}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {result.year && `${result.year}`}
                      {result.country && ` | ${result.country}`}
                      {result.format && result.format.length > 0 && ` | ${result.format.join(', ')}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.label && result.label.length > 0 && result.label[0]}
                      {result.genre && result.genre.length > 0 && ` | ${result.genre.join(', ')}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Release Detail */}
        {release && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Release-Details</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover */}
              <div className="flex-shrink-0">
                {release.coverUrl ? (
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-48 h-48 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">💿</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{release.title}</h3>
                  <p className="text-lg text-gray-600">{release.artist}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {release.year && (
                    <div>
                      <span className="text-sm text-gray-500">Jahr:</span>
                      <p>{release.year}</p>
                    </div>
                  )}
                  {release.label && (
                    <div>
                      <span className="text-sm text-gray-500">Label:</span>
                      <p>{release.label}</p>
                    </div>
                  )}
                  {release.country && (
                    <div>
                      <span className="text-sm text-gray-500">Land:</span>
                      <p>{release.country}</p>
                    </div>
                  )}
                  {release.format && release.format.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Format:</span>
                      <p>{release.format.join(', ')}</p>
                    </div>
                  )}
                </div>

                {release.genre && release.genre.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Genre:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {release.genre.map((g, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 rounded-full text-sm text-purple-700"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {release.style && release.style.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Stil:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {release.style.map((s, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Stats */}
                {(marketStats || release.lowestPrice !== undefined) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <span className="text-sm text-green-700 font-medium">Marktpreise (ca.):</span>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {marketStats ? (
                        <>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Niedrig</p>
                            <p className="font-bold text-green-700">
                              {marketStats.lowest.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Mittel</p>
                            <p className="font-bold text-green-700">
                              {marketStats.median.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Hoch</p>
                            <p className="font-bold text-green-700">
                              {marketStats.highest.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        </>
                      ) : release.lowestPrice !== undefined && (
                        <div className="text-center col-span-3">
                          <p className="text-xs text-gray-500">Ab</p>
                          <p className="font-bold text-green-700">
                            {release.lowestPrice.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </p>
                          {release.numForSale !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">{release.numForSale} zum Verkauf</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tracklist */}
                {release.tracklist && release.tracklist.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Tracklist:</span>
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {release.tracklist.map((track, index) => (
                            <tr key={index} className="border-b border-gray-200 last:border-0">
                              <td className="py-1 pr-3 text-gray-500 w-10">{track.position}</td>
                              <td className="py-1">{track.title}</td>
                              <td className="py-1 pl-3 text-gray-500 text-right w-16">{track.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                      navigator.clipboard.writeText(JSON.stringify(release, null, 2))
                      alert('Release-Daten in Zwischenablage kopiert!')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Daten kopieren
                  </button>
                  <a
                    href={`https://www.discogs.com/release/${release.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                  >
                    Auf Discogs ansehen
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-2">Über Discogs</h3>
          <p className="text-purple-800 text-sm">
            Discogs ist die weltweit größte Musik-Datenbank und Marktplatz für Vinyl, CDs und mehr.
            Die API ist kostenlos mit einem Limit von 60 Anfragen pro Minute. Für authentifizierte
            Anfragen mit Marktpreisen wird ein Personal Access Token benötigt.
          </p>
          <p className="text-purple-700 text-xs mt-2">
            Hinweis: Marktpreise erfordern möglicherweise einen Discogs API Token.
          </p>
        </div>
      </div>

      {/* Add to Collection Modal */}
      {release && (
        <AddToCollectionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          itemType="vinyl"
          itemData={{
            name: `${release.artist} - ${release.title}`,
            description: release.artist,
            coverUrl: release.coverUrl,
            notes: [
              release.label ? `Label: ${release.label}` : '',
              release.year ? `Jahr: ${release.year}` : '',
              release.country ? `Land: ${release.country}` : '',
              release.format ? `Format: ${release.format.join(', ')}` : '',
            ].filter(Boolean).join('\n'),
            attributes: {
              discogsId: release.id,
              artist: release.artist,
              title: release.title,
              year: release.year,
              label: release.label,
              country: release.country,
              format: release.format,
              genre: release.genre,
              style: release.style,
              lowestPrice: release.lowestPrice,
            }
          }}
        />
      )}
    </div>
  )
}
