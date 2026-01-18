'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface Location {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  category: string
  date: string
  specimens: number
  notes: string
  photos?: string[]
}

export default function GeoLocationsPage() {
  const { showToast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [newLocation, setNewLocation] = useState({
    name: '',
    category: 'minerals',
    notes: ''
  })

  // Mock locations
  useEffect(() => {
    setLocations([
      {
        id: '1',
        name: 'Steinbruch Mühlheim',
        coordinates: { lat: 50.1234, lng: 8.8765 },
        category: 'minerals',
        date: '2024-01-15',
        specimens: 12,
        notes: 'Viele Quarze gefunden, gute Kristallqualität',
        photos: []
      },
      {
        id: '2',
        name: 'Jura-Küste Dorset',
        coordinates: { lat: 50.7184, lng: -2.4494 },
        category: 'fossils',
        date: '2024-01-10',
        specimens: 8,
        notes: 'Ammoniten im Juragesein, hohe Dichte',
        photos: []
      },
      {
        id: '3',
        name: 'Meteoriten-Fundstelle Arizona',
        coordinates: { lat: 35.0272, lng: -111.0225 },
        category: 'meteorites',
        date: '2023-12-20',
        specimens: 3,
        notes: 'Eisenmeteorite, Canyon Diablo Nähe',
        photos: []
      }
    ])
  }, [])

  const getCurrentPosition = () => {
    if ('geolocation' in navigator) {
      showToast('GPS-Position wird abgerufen...', 'info')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(coords)
          showToast(`Position ermittelt: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, 'success')
        },
        (error) => {
          console.error('Geolocation error:', error)
          showToast('GPS-Position konnte nicht ermittelt werden', 'error')
        }
      )
    } else {
      showToast('GPS wird von diesem Browser nicht unterstützt', 'error')
    }
  }

  const handleAddLocation = () => {
    if (!newLocation.name.trim()) {
      showToast('Bitte gib einen Namen ein', 'error')
      return
    }

    if (!currentLocation) {
      showToast('Bitte erst GPS-Position ermitteln', 'error')
      return
    }

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name,
      coordinates: currentLocation,
      category: newLocation.category,
      date: new Date().toISOString().split('T')[0],
      specimens: 0,
      notes: newLocation.notes
    }

    setLocations([location, ...locations])
    showToast(`Fundort "${location.name}" hinzugefügt!`, 'success')
    setShowAddModal(false)
    setNewLocation({ name: '', category: 'minerals', notes: '' })
    setCurrentLocation(null)
  }

  const deleteLocation = (id: string) => {
    const location = locations.find(l => l.id === id)
    if (confirm(`Fundort "${location?.name}" wirklich löschen?`)) {
      setLocations(locations.filter(l => l.id !== id))
      showToast('Fundort gelöscht', 'success')
    }
  }

  const openInMaps = (coords: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    window.open(url, '_blank')
  }

  const categoryIcons: Record<string, string> = {
    minerals: '💎',
    fossils: '🦴',
    crystals: '🔮',
    meteorites: '☄️',
    artifacts: '🏺'
  }

  const categoryNames: Record<string, string> = {
    minerals: 'Mineralien',
    fossils: 'Fossilien',
    crystals: 'Kristalle',
    meteorites: 'Meteoriten',
    artifacts: 'Artefakte'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto container-responsive py-6 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-2 sm:gap-3 mb-4">
            <span className="text-4xl sm:text-6xl">🗺️</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Fundorte
              </span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-slate-300 px-4">
            GPS-basiertes Tracking deiner geologischen Fundstellen
          </p>
          <Link
            href="/geo"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Geo Übersicht
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-emerald-400">{locations.length}</div>
            <div className="text-sm text-slate-400">Fundorte</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {locations.reduce((sum, loc) => sum + loc.specimens, 0)}
            </div>
            <div className="text-sm text-slate-400">Specimens</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {new Set(locations.map(l => l.category)).size}
            </div>
            <div className="text-sm text-slate-400">Kategorien</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 text-center">
            <div className="text-3xl font-bold text-amber-400">
              {locations.filter(l => new Date(l.date) > new Date(Date.now() - 30*24*60*60*1000)).length}
            </div>
            <div className="text-sm text-slate-400">Letzter Monat</div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>➕</span> Neuer Fundort
          </button>
        </div>

        {/* Locations List */}
        <div className="space-y-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-slate-800/30 backdrop-blur-lg rounded-xl card-padding border border-slate-700 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl">{categoryIcons[location.category]}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{location.name}</h3>
                      <div className="text-sm text-slate-400">
                        {categoryNames[location.category]} • {new Date(location.date).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Koordinaten</div>
                      <div className="text-sm text-slate-300 font-mono">
                        {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Specimens</div>
                      <div className="text-sm text-slate-300 font-semibold">
                        {location.specimens} gefunden
                      </div>
                    </div>
                  </div>

                  {location.notes && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                      <div className="text-xs text-slate-500 mb-1">Notizen</div>
                      <p className="text-sm text-slate-300">{location.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openInMaps(location.coordinates)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      <span>🗺️</span> Auf Karte öffnen
                    </button>
                    <button
                      onClick={() => alert('Specimens-Liste für diesen Fundort')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      📦 Specimens ({location.specimens})
                    </button>
                    <button
                      onClick={() => deleteLocation(location.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-slate-400">Noch keine Fundorte erfasst</p>
              <p className="text-sm text-slate-500 mt-2">
                Füge deinen ersten Fundort hinzu um loszulegen
              </p>
            </div>
          )}
        </div>

        {/* Add Location Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl modal-responsive card-padding max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Neuer Fundort</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Name des Fundorts
                  </label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="z.B. Steinbruch Mühlheim"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Kategorie
                  </label>
                  <select
                    value={newLocation.category}
                    onChange={(e) => setNewLocation({ ...newLocation, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="minerals">💎 Mineralien</option>
                    <option value="fossils">🦴 Fossilien</option>
                    <option value="crystals">🔮 Kristalle</option>
                    <option value="meteorites">☄️ Meteoriten</option>
                    <option value="artifacts">🏺 Artefakte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    GPS-Position
                  </label>
                  {currentLocation ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <div className="text-emerald-400 font-mono text-sm">
                        📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </div>
                      <button
                        onClick={getCurrentPosition}
                        className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Position erneut ermitteln
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={getCurrentPosition}
                      className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <span>📍</span> Aktuelle Position ermitteln
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Notizen (optional)
                  </label>
                  <textarea
                    value={newLocation.notes}
                    onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    placeholder="Beschreibung, Besonderheiten, Zugang..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddLocation}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Fundort Hinzufügen
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewLocation({ name: '', category: 'minerals', notes: '' })
                    setCurrentLocation(null)
                  }}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 card-padding rounded-xl bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>💡</span> Fundort-Tracking Tipps
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Erlaube GPS-Zugriff für automatische Koordinaten-Erfassung</li>
            <li>• Notiere besondere Merkmale und Zugang zum Fundort</li>
            <li>• Mache Fotos der Umgebung für späteres Wiederfinden</li>
            <li>• Prüfe lokale Gesetze zu Sammeln & Ausgrabungen</li>
            <li>• Teile keine sensiblen Fundorte öffentlich</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
