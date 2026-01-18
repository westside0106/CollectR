'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

type ScanMode = 'camera' | 'upload'
type GeoCategory = 'minerals' | 'fossils' | 'crystals' | 'meteorites' | 'artifacts'

export default function GeoScannerPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<GeoCategory>('minerals')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const categories = [
    { id: 'minerals' as GeoCategory, name: 'Mineralien', emoji: '💎', color: 'emerald' },
    { id: 'fossils' as GeoCategory, name: 'Fossilien', emoji: '🦴', color: 'amber' },
    { id: 'crystals' as GeoCategory, name: 'Kristalle', emoji: '🔮', color: 'purple' },
    { id: 'meteorites' as GeoCategory, name: 'Meteoriten', emoji: '☄️', color: 'slate' },
    { id: 'artifacts' as GeoCategory, name: 'Artefakte', emoji: '🏺', color: 'yellow' }
  ]

  const scanModes = [
    {
      id: 'camera' as ScanMode,
      icon: '📷',
      title: 'Live Camera',
      description: 'Specimen mit Kamera fotografieren'
    },
    {
      id: 'upload' as ScanMode,
      icon: '📁',
      title: 'Foto Upload',
      description: 'Bild von Galerie hochladen'
    }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!imageFile) {
      showToast('Bitte wähle zuerst ein Bild aus', 'error')
      return
    }

    setIsAnalyzing(true)
    showToast('Analysiere Specimen...', 'info')

    try {
      // Simulate AI analysis (in real implementation, call AI API)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockResult = {
        specimen: selectedCategory === 'minerals' ? 'Quarz (SiO₂)' :
                  selectedCategory === 'fossils' ? 'Ammonit (Jura)' :
                  selectedCategory === 'crystals' ? 'Amethyst' :
                  selectedCategory === 'meteorites' ? 'Eisenmeteorit' :
                  'Römische Münze',
        confidence: 87,
        properties: selectedCategory === 'minerals' ? {
          'Chemische Formel': 'SiO₂',
          'Mohshärte': '7',
          'Kristallsystem': 'Trigonal',
          'Farbe': 'Farblos bis milchig'
        } : selectedCategory === 'fossils' ? {
          'Zeitalter': 'Jura (199-145 Mio Jahre)',
          'Klasse': 'Cephalopoda',
          'Fundort-Typisch': 'Jurakalk'
        } : selectedCategory === 'crystals' ? {
          'Varietät': 'Quarz (violett)',
          'Kristallsystem': 'Trigonal',
          'Chakra': 'Kronenchakra',
          'Heilwirkung': 'Beruhigend, Spirituell'
        } : selectedCategory === 'meteorites' ? {
          'Typ': 'Oktaedrit',
          'Nickel-Gehalt': '7-12%',
          'Klassifikation': 'Eisenmeteorit (Typ IIIA)'
        } : {
          'Epoche': 'Römisches Reich',
          'Datierung': '100-200 n. Chr.',
          'Material': 'Bronze',
          'Erhaltung': 'Gut'
        },
        description: `Ein wunderschönes Exemplar. Charakteristische Merkmale sind deutlich erkennbar.`,
        estimatedValue: selectedCategory === 'minerals' ? '15-25 €' :
                        selectedCategory === 'fossils' ? '80-150 €' :
                        selectedCategory === 'crystals' ? '45-70 €' :
                        selectedCategory === 'meteorites' ? '500-800 €' :
                        '200-400 €'
      }

      setAnalysisResult(mockResult)
      showToast(`${mockResult.specimen} erkannt! (${mockResult.confidence}% Konfidenz)`, 'success')
    } catch (error) {
      console.error('Analysis error:', error)
      showToast('Fehler bei der Analyse. Bitte versuche es erneut.', 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddToCollection = () => {
    showToast('Specimen zur Sammlung hinzugefügt!', 'success')
    router.push('/collections')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
      <div className="max-w-4xl mx-auto container-responsive py-6 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex flex-col sm:inline-flex sm:flex-row items-center gap-2 sm:gap-3 mb-4">
            <span className="text-4xl sm:text-6xl">📸</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Specimen Scanner
              </span>
            </h1>
          </div>
          <p className="text-base sm:text-xl text-slate-300 px-4">
            Identifiziere Mineralien, Fossilien & mehr mit AI-Foto-Erkennung
          </p>
          <Link
            href="/geo"
            className="inline-block mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Zurück zu Geo Übersicht
          </Link>
        </div>

        {!selectedMode && !imagePreview && (
          <>
            {/* Category Selection */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Wähle die Kategorie:</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      p-4 rounded-xl transition-all duration-200
                      ${selectedCategory === category.id
                        ? `ring-4 ring-${category.color}-500/50 bg-${category.color}-500/20 border-2 border-${category.color}-500`
                        : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="text-3xl sm:text-4xl mb-2">{category.emoji}</div>
                    <div className="text-sm font-semibold text-white">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Mode Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Scan-Methode:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scanModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className="card-padding rounded-xl transition-all duration-200 text-left bg-slate-800/50 border-2 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800"
                  >
                    <div className="text-4xl mb-3">{mode.icon}</div>
                    <h3 className="text-base font-semibold text-white mb-1">{mode.title}</h3>
                    <p className="text-sm text-slate-400">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Upload Interface */}
        {selectedMode === 'upload' && !imagePreview && (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl card-padding border border-slate-700 mb-8">
            <label className="block">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-white font-semibold mb-2">Klicke zum Hochladen</p>
                <p className="text-sm text-slate-400">oder ziehe ein Bild hierher</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </label>
            <button
              onClick={() => setSelectedMode(null)}
              className="mt-4 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Andere Methode wählen
            </button>
          </div>
        )}

        {/* Image Preview & Analysis */}
        {imagePreview && (
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl card-padding border border-slate-700 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <img
                  src={imagePreview}
                  alt="Uploaded specimen"
                  className="w-full rounded-lg border-2 border-slate-700"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? '🔄 Analysiere...' : '🔍 Analysieren'}
                  </button>
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                      setAnalysisResult(null)
                    }}
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                  >
                    Neu
                  </button>
                </div>
              </div>

              {analysisResult && (
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-400 mb-2">
                      {analysisResult.specimen}
                    </h3>
                    <div className="text-sm text-slate-400 mb-4">
                      Konfidenz: {analysisResult.confidence}%
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Eigenschaften:</h4>
                    <div className="space-y-2">
                      {Object.entries(analysisResult.properties).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-slate-400">{key}:</span>
                          <span className="text-white font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-300">{analysisResult.description}</p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="text-sm text-emerald-300 mb-1">Geschätzter Wert:</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {analysisResult.estimatedValue}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCollection}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    ➕ Zur Sammlung Hinzufügen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features Info */}
        {!imagePreview && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-white mb-2">AI Recognition</h3>
              <p className="text-sm text-slate-400">
                Automatische Identifikation von Mineralien & Fossilien
              </p>
            </div>

            <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="text-4xl mb-3">🔬</div>
              <h3 className="font-semibold text-white mb-2">Wissenschaftlich</h3>
              <p className="text-sm text-slate-400">
                Chemische Formeln, Klassifikationen & mehr
              </p>
            </div>

            <div className="text-center card-padding rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold text-white mb-2">Wertschätzung</h3>
              <p className="text-sm text-slate-400">
                Automatische Marktpreis-Einschätzung
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        {!imagePreview && (
          <div className="card-padding rounded-xl bg-blue-500/10 border border-blue-500/30">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <span>💡</span> Scan-Tipps
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Fotografiere das Specimen bei gutem, natürlichem Licht</li>
              <li>• Platziere das Objekt auf neutralem Hintergrund (weiß/schwarz)</li>
              <li>• Füge einen Maßstab hinzu (z.B. Münze) für Größenreferenz</li>
              <li>• Mache mehrere Fotos aus verschiedenen Winkeln</li>
              <li>• Für Kristalle: Zeige das Kristallsystem deutlich</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
