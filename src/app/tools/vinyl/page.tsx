'use client'

import { useState } from 'react'
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
  const [searchType, setSearchType] = useState<'barcode' | 'text'>('text')
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
    } catch {
      setError('Fehler bei der Suche. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectResult(result: DiscogsSearchResult) {
    setLoading(true)
    setRelease(null)
    setSearchResults([])
    const detailedRelease = await getReleaseDetails(result.id)
    if (detailedRelease) {
      setRelease(detailedRelease)
      const stats = await getMarketplaceStats(result.id)
      if (stats) setMarketStats(stats)
    }
    setLoading(false)
  }

  function resetSearch() {
    setRelease(null)
    setSearchResults([])
    setMarketStats(null)
    setError(null)
    setQuery('')
  }

  const formatEur = (amount: number) =>
    amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Gradient Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-700 dark:via-amber-700 dark:to-yellow-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💿</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Vinyl-Suche</h1>
          </div>
          <p className="text-orange-100 text-sm sm:text-base">
            Discogs-Datenbank · Barcode oder Titel/Künstler · Kein API-Key nötig
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-4">

        {/* Suchmaske */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Such-Typ Toggle */}
            <div className="flex gap-2">
              {(['text', 'barcode'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setSearchType(type); setQuery('') }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    searchType === type
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type === 'barcode' ? '📊 Barcode' : '🔍 Titel / Künstler'}
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
                  placeholder={searchType === 'barcode' ? 'Barcode eingeben...' : 'z.B. Pink Floyd – The Wall'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition"
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
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition text-left"
                >
                  {result.cover_image || result.thumb ? (
                    <img
                      src={result.thumb || result.cover_image}
                      alt={result.title}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                      💿
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate text-sm">{result.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-1 mt-0.5">
                      {result.year && <span>{result.year}</span>}
                      {result.country && <><span>·</span><span>{result.country}</span></>}
                      {result.format?.length && <><span>·</span><span>{result.format.join(', ')}</span></>}
                    </div>
                    {result.genre && result.genre.length > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{result.genre.slice(0, 2).join(', ')}</div>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !release && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
            <div className="flex gap-6">
              <div className="w-48 h-48 bg-slate-200 dark:bg-slate-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* Release Detail */}
        {release && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Release-Details</h2>
              <button onClick={resetSearch} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                Neue Suche
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
                {/* Cover */}
                <div className="flex-shrink-0">
                  {release.coverUrl ? (
                    <img
                      src={release.coverUrl}
                      alt={release.title}
                      className="w-full md:w-52 aspect-square object-cover rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-full md:w-52 aspect-square bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                      <span className="text-7xl">💿</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{release.title}</h3>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">{release.artist}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      release.year && { label: 'Jahr', value: String(release.year) },
                      release.label && { label: 'Label', value: release.label },
                      release.country && { label: 'Land', value: release.country },
                      release.format?.length && { label: 'Format', value: release.format.join(', ') },
                    ].filter(Boolean).map((item, i) => item && (
                      <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Genre + Stil */}
                  {(release.genre?.length || release.style?.length) && (
                    <div className="flex flex-wrap gap-1.5">
                      {release.genre?.map((g, i) => (
                        <span key={i} className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">{g}</span>
                      ))}
                      {release.style?.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Marktpreise */}
                  {(marketStats || release.lowestPrice !== undefined) && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                        💶 Discogs Marktpreise
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {marketStats ? (
                          <>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Niedrig</div>
                              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{formatEur(marketStats.lowest)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Mittel</div>
                              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{formatEur(marketStats.median)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Hoch</div>
                              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{formatEur(marketStats.highest)}</div>
                            </div>
                          </>
                        ) : release.lowestPrice !== undefined && (
                          <div className="col-span-3">
                            <div className="text-xs text-slate-500 dark:text-slate-400">Ab</div>
                            <div className="font-bold text-emerald-700 dark:text-emerald-400">{formatEur(release.lowestPrice)}</div>
                            {release.numForSale !== undefined && (
                              <div className="text-xs text-slate-400 mt-1">{release.numForSale} zum Verkauf</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition"
                    >
                      + Zur Sammlung
                    </button>
                    <a
                      href={`https://www.discogs.com/release/${release.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl font-medium text-sm transition hover:bg-orange-200 dark:hover:bg-orange-900/50"
                    >
                      Auf Discogs ansehen ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Tracklist */}
              {release.tracklist && release.tracklist.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Tracklist</h4>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {release.tracklist.map((track, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                            <td className="py-2 pl-4 pr-3 text-slate-400 dark:text-slate-500 w-10 font-mono text-xs">{track.position}</td>
                            <td className="py-2 text-slate-800 dark:text-slate-200">{track.title}</td>
                            <td className="py-2 pl-3 pr-4 text-slate-400 dark:text-slate-500 text-right text-xs font-mono">{track.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-600">
          Powered by Discogs API · Weltweit größte Musikdatenbank · Kein API-Key nötig
        </p>
      </div>

      {release && (
        <AddToCollectionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          itemType="vinyl"
          itemData={{
            name: `${release.artist} – ${release.title}`,
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
            },
          }}
        />
      )}
    </div>
  )
}
