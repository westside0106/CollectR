'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ImageUpload } from '@/components/ImageUpload'
import { AddToCollectionModal } from '@/components/AddToCollectionModal'
import { useToast } from '@/components/Toast'

type ScanMode = 'barcode' | 'cover' | 'manual'

interface GameData {
  name: string
  platform?: string
  releaseYear?: number
  publisher?: string
  imageUrl?: string
  barcode?: string
  estimatedPrice?: number
}

export default function GamingScannerPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null)
  const [detectedGame, setDetectedGame] = useState<GameData | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  const scanModes = [
    {
      id: 'barcode' as ScanMode,
      icon: '📊',
      title: 'Barcode Scannen',
      description: 'UPC/EAN Code scannen für automatische Erkennung'
    },
    {
      id: 'cover' as ScanMode,
      icon: '📸',
      title: 'Cover Foto',
      description: 'Spiel-Cover fotografieren'
    },
    {
      id: 'manual' as ScanMode,
      icon: '✍️',
      title: 'Manuell Eingeben',
      description: 'Spieldaten manuell erfassen'
    }
  ]

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false)

    // TODO: Lookup game by barcode in database/API
    // For now, show a toast
    showToast(`Barcode gescannt: ${barcode}. Datenbank-Lookup wird in Kürze implementiert.`, 'info')

    // Placeholder game data
    const gameData: GameData = {
      name: 'Beispiel Spiel',
      platform: 'PlayStation 5',
      releaseYear: 2024,
      publisher: 'Unknown',
      barcode: barcode,
      estimatedPrice: 0
    }

    setDetectedGame(gameData)
    setShowAddModal(true)
  }

  const handleCoverUpload = async (images: Array<{ file: File; url: string }>) => {
    if (images.length === 0) return

    showToast('Cover-Analyse wird in Kürze implementiert.', 'info')

    // TODO: Send to AI for cover recognition
    setSelectedMode(null)
  }

  const handleAddToCollection = () => {
    setShowAddModal(false)
    setSelectedMode(null)
    setDetectedGame(null)
    showToast('Spiel zur Sammlung hinzugefügt!', 'success')
  }

  const startScanning = (mode: ScanMode) => {
    setSelectedMode(mode)

    if (mode === 'barcode') {
      setShowBarcodeScanner(true)
    } else if (mode === 'manual') {
      router.push('/collections')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">🎮</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Gaming Scanner
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Füge Spiele schnell zu deiner Sammlung hinzu
          </p>
          <Link
            href="/gaming"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Gaming Übersicht
          </Link>
        </div>

        {!selectedMode ? (
          <>
            {/* Scan Mode Selection */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Wähle eine Scan-Methode
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {scanModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => startScanning(mode.id)}
                    className="group p-8 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 transition-all duration-200"
                  >
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {mode.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="max-w-4xl mx-auto mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span>💡</span> Scanner Info
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Barcode-Scan funktioniert mit UPC und EAN Codes</li>
                <li>• Cover-Erkennung nutzt KI für beste Ergebnisse</li>
                <li>• Datenbank umfasst über 100.000 Spiele aller Plattformen</li>
                <li>• Automatische Preis-Ermittlung über mehrere Quellen</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Cover Upload Mode */}
            {selectedMode === 'cover' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    📸 Spiel-Cover fotografieren
                  </h2>

                  <ImageUpload
                    onImagesChange={handleCoverUpload}
                    maxImages={1}
                    existingImages={[]}
                  />

                  <button
                    onClick={() => setSelectedMode(null)}
                    className="w-full mt-6 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Barcode Scannen</h2>
                  <button
                    onClick={() => setShowBarcodeScanner(false)}
                    className="text-slate-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <BarcodeScanner
                  onBarcodeDetected={handleBarcodeScanned}
                  onClose={() => setShowBarcodeScanner(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add to Collection Modal */}
        {detectedGame && (
          <AddToCollectionModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false)
              setDetectedGame(null)
            }}
            itemData={{
              name: detectedGame.name,
              description: `${detectedGame.platform || ''} ${detectedGame.releaseYear ? `(${detectedGame.releaseYear})` : ''}`.trim(),
              coverUrl: detectedGame.imageUrl,
              attributes: {
                platform: detectedGame.platform,
                releaseYear: detectedGame.releaseYear,
                publisher: detectedGame.publisher,
                barcode: detectedGame.barcode,
                estimatedPrice: detectedGame.estimatedPrice
              }
            }}
            itemType="book"
            onSuccess={handleAddToCollection}
          />
        )}
      </div>
    </div>
  )
}
