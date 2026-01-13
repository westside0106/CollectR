'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

interface TCGCardScannerProps {
  mode: 'camera' | 'upload'
  game: 'pokemon' | 'yugioh' | 'magic'
  onCardDetected: (cardData: any) => void
  onClose: () => void
}

export function TCGCardScanner({ mode, game, onCardDetected, onClose }: TCGCardScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [detectedCard, setDetectedCard] = useState<any>(null)

  const { showToast } = useToast()
  const supabase = createClient()

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  // Start camera for camera mode
  useEffect(() => {
    if (mode !== 'camera') return

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Kamera wird von diesem Browser nicht unterstützt')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          setCameraReady(true)
        }
      } catch (err) {
        console.error('Camera error:', err)
        setError('Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen.')
      }
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [mode, stopCamera])

  // Capture image from camera
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to capture image'))
      }, 'image/jpeg', 0.9)
    })
  }, [])

  // Process image with AI
  const processImage = useCallback(async (imageBlob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Upload image to Supabase Storage
      const filename = `tcg-scan-${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item_images')
        .upload(filename, imageBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item_images')
        .getPublicUrl(filename)

      // Call AI analysis Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageUrl: publicUrl,
          context: `This is a ${game} trading card. Please identify the card name, set, rarity, and any visible attributes.`
        }
      })

      if (functionError) throw functionError

      // Parse AI response
      const aiDescription = data?.description || ''
      const aiTags = data?.tags || []

      // Try to extract card info from AI response
      const cardData = {
        name: extractCardName(aiDescription, aiTags),
        set: extractSet(aiDescription),
        rarity: extractRarity(aiDescription, aiTags),
        game: game,
        imageUrl: publicUrl,
        aiDescription,
        aiTags
      }

      setDetectedCard(cardData)

      // Also try to get price
      try {
        const priceResponse = await fetch('/api/tcg-price-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardName: cardData.name,
            setName: cardData.set,
            game: game
          })
        })

        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          cardData.price = priceData.rawPrice?.market || priceData.rawPrice?.avg || null
        }
      } catch (priceError) {
        console.error('Price lookup failed:', priceError)
        // Non-critical, continue without price
      }

      showToast('Karte erkannt!', 'success')
      onCardDetected(cardData)

    } catch (err) {
      console.error('Image processing error:', err)
      setError('Fehler bei der Kartenanalyse. Bitte versuche es erneut.')
      showToast('Kartenerkennung fehlgeschlagen', 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [game, onCardDetected, showToast, supabase])

  // Handle camera capture
  const handleCapture = useCallback(async () => {
    try {
      const imageBlob = await captureImage()
      if (!imageBlob) throw new Error('Failed to capture image')

      await processImage(imageBlob)
    } catch (err) {
      console.error('Capture error:', err)
      setError('Fehler beim Aufnehmen. Bitte versuche es erneut.')
    }
  }, [captureImage, processImage])

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Bild ist zu groß (max 10MB)')
      return
    }

    await processImage(file)
  }, [processImage])

  // Helper functions to extract card info from AI description
  function extractCardName(description: string, tags: string[]): string {
    // Try to find card name in first line or tags
    const lines = description.split('\n')
    const firstLine = lines[0]?.trim()

    // Look for patterns like "Card: X" or just use first meaningful tag
    if (firstLine && firstLine.length > 3 && firstLine.length < 50) {
      return firstLine
    }

    // Fallback to first tag that looks like a name
    const nameTag = tags.find(tag => tag.length > 3 && tag.length < 50 && !/^(rare|common|uncommon|holographic)/i.test(tag))
    return nameTag || 'Unknown Card'
  }

  function extractSet(description: string): string | undefined {
    // Look for set mentions in description
    const setPatterns = [
      /set:\s*([^\n,]+)/i,
      /from\s+([^\n,]+)\s+set/i,
      /(base set|jungle|fossil|team rocket|neo|ex|diamond|pearl|black|white|sun|moon|sword|shield|scarlet|violet)/i
    ]

    for (const pattern of setPatterns) {
      const match = description.match(pattern)
      if (match) return match[1].trim()
    }

    return undefined
  }

  function extractRarity(description: string, tags: string[]): string | undefined {
    const rarityKeywords = ['common', 'uncommon', 'rare', 'ultra rare', 'secret rare', 'holographic', 'holo', 'rainbow', 'gold']

    // Check tags first
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase()
      if (rarityKeywords.some(keyword => lowerTag.includes(keyword))) {
        return tag
      }
    }

    // Check description
    const lowerDesc = description.toLowerCase()
    for (const keyword of rarityKeywords) {
      if (lowerDesc.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1)
      }
    }

    return undefined
  }

  return (
    <div className="space-y-4">
      {/* Canvas for capture (hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera View */}
      {mode === 'camera' && (
        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                <p className="text-slate-300">Kamera wird geladen...</p>
              </div>
            </div>
          )}

          {/* Overlay guide */}
          {cameraReady && !isProcessing && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                  Karte hier positionieren
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">🤖</div>
                <p className="text-slate-300">Analysiere Karte...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload View */}
      {mode === 'upload' && (
        <div className="relative aspect-video bg-slate-900 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isProcessing ? (
            <div className="text-center">
              <div className="animate-spin text-4xl mb-2">🤖</div>
              <p className="text-slate-300">Analysiere Karte...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-slate-300 mb-4">Klicke unten zum Upload</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
          {error}
        </div>
      )}

      {/* Detected Card Info */}
      {detectedCard && (
        <div className="p-6 rounded-xl bg-green-500/20 border border-green-500/50">
          <h3 className="text-lg font-semibold text-green-300 mb-3">Erkannt:</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p><strong>Name:</strong> {detectedCard.name}</p>
            {detectedCard.set && <p><strong>Set:</strong> {detectedCard.set}</p>}
            {detectedCard.rarity && <p><strong>Seltenheit:</strong> {detectedCard.rarity}</p>}
            {detectedCard.price && <p><strong>Geschätzter Wert:</strong> {detectedCard.price.toFixed(2)} €</p>}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {mode === 'camera' ? (
          <button
            onClick={handleCapture}
            disabled={!cameraReady || isProcessing}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Analysiere...' : '📸 Foto Aufnehmen'}
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Analysiere...' : '📁 Foto Hochladen'}
          </button>
        )}

        <button
          onClick={onClose}
          disabled={isProcessing}
          className="px-6 py-4 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all disabled:opacity-50"
        >
          {detectedCard ? 'Fertig' : 'Abbrechen'}
        </button>
      </div>
    </div>
  )
}
