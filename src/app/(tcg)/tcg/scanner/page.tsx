'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TCGCardScanner } from '@/components/TCGCardScanner'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { AddToCollectionModal } from '@/components/AddToCollectionModal'
import { useToast } from '@/components/Toast'

type ScanMode = 'camera' | 'upload' | 'barcode'

export default function TCGScannerPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null)
  const [selectedGame, setSelectedGame] = useState<'pokemon' | 'yugioh' | 'magic'>('pokemon')
  const [detectedCard, setDetectedCard] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  const scanModes = [
    {
      id: 'camera' as ScanMode,
      icon: '📷',
      title: 'Live Camera',
      description: 'Karte mit Kamera scannen'
    },
    {
      id: 'upload' as ScanMode,
      icon: '📁',
      title: 'Foto Upload',
      description: 'Bild von Galerie hochladen'
    },
    {
      id: 'barcode' as ScanMode,
      icon: '📊',
      title: 'Barcode',
      description: 'Produkt-Barcode scannen'
    }
  ]

  const handleCardDetected = (cardData: any) => {
    console.log('Card detected:', cardData)
    setDetectedCard(cardData)
    setShowAddModal(true)
  }

  const handleBarcodeScanned = (barcode: string) => {
    setShowBarcodeScanner(false)
    // TODO: Look up card by barcode
    showToast(`Barcode gescannt: ${barcode}. Barcode-Datenbank-Lookup wird in zukünftiger Version implementiert.`, 'info')
  }

  const handleAddToCollection = () => {
    setShowAddModal(false)
    setSelectedMode(null)
    setDetectedCard(null)
  }

  const startScanning = (mode: ScanMode) => {
    if (mode === 'barcode') {
      setShowBarcodeScanner(true)
    } else {
      setSelectedMode(mode)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">📸</span>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                TCG Card Scanner
              </span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Scanne deine Karten für automatische Erkennung & Preisinformationen
          </p>
          <Link
            href="/tcg"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu TCG Übersicht
          </Link>
        </div>

        {!selectedMode && !showBarcodeScanner && (
          <>
            {/* Game Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Wähle dein Game:</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'pokemon', name: 'Pokémon', emoji: '🎴', color: 'red' },
                  { id: 'yugioh', name: 'Yu-Gi-Oh!', emoji: '🃏', color: 'purple' },
                  { id: 'magic', name: 'Magic', emoji: '🌟', color: 'blue' }
                ].map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id as any)}
                    className={`
                      p-4 rounded-xl transition-all duration-200
                      ${selectedGame === game.id
                        ? 'ring-4 ring-red-500/50 bg-red-500/20 border-2 border-red-500'
                        : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="text-4xl mb-2">{game.emoji}</div>
                    <div className="text-sm font-semibold text-white">{game.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Mode Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Scan-Methode:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scanModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => startScanning(mode.id)}
                    className="p-6 rounded-xl transition-all duration-200 text-left bg-slate-800/50 border-2 border-slate-700 hover:border-red-500/50 hover:bg-slate-800"
                  >
                    <div className="text-4xl mb-3">{mode.icon}</div>
                    <h3 className="font-semibold text-white mb-1">{mode.title}</h3>
                    <p className="text-sm text-slate-400">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active Scanner */}
        {selectedMode && (selectedMode === 'camera' || selectedMode === 'upload') && (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 mb-8">
            <TCGCardScanner
              mode={selectedMode}
              game={selectedGame}
              onCardDetected={handleCardDetected}
              onClose={() => setSelectedMode(null)}
            />
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Barcode Scanner</h2>
              <BarcodeScanner
                onScan={handleBarcodeScanned}
                onClose={() => setShowBarcodeScanner(false)}
              />
            </div>
          </div>
        )}

        {/* Add to Collection Modal */}
        {showAddModal && detectedCard && (
          <AddToCollectionModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false)
              setSelectedMode(null)
              setDetectedCard(null)
            }}
            itemData={{
              name: detectedCard.name,
              description: detectedCard.aiDescription,
              coverUrl: detectedCard.imageUrl,
              attributes: {
                game: detectedCard.game,
                set: detectedCard.set,
                rarity: detectedCard.rarity,
                estimatedPrice: detectedCard.price
              }
            }}
            itemType="book"
          />
        )}

        {/* Features Info */}
        {!selectedMode && !showBarcodeScanner && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-semibold text-white mb-2">AI Recognition</h3>
                <p className="text-sm text-slate-400">
                  Automatische Kartenerkennung mit hoher Genauigkeit
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold text-white mb-2">Live Pricing</h3>
                <p className="text-sm text-slate-400">
                  Sofortige Preisauskunft von mehreren Quellen
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="font-semibold text-white mb-2">Quick Add</h3>
                <p className="text-sm text-slate-400">
                  Füge Karten direkt zu deiner Sammlung hinzu
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <span>💡</span> Scan-Tipps
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Halte die Karte flach und gut beleuchtet</li>
                <li>• Vermeide Reflektionen auf der Kartenhülle</li>
                <li>• Zentriere die Karte im Scan-Bereich</li>
                <li>• Für beste Ergebnisse: Karte aus der Hülle nehmen</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
