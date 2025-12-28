'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

// Einfache Barcode-Erkennung über Canvas für alle Browser
// Nutzt BarcodeDetector API wenn verfügbar, sonst Fallback auf manuelle Eingabe
export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const handleScan = useCallback((code: string) => {
    setScanning(false)
    stopStream()
    onScan(code)
  }, [onScan, stopStream])

  useEffect(() => {
    // Prüfe ob BarcodeDetector verfügbar ist
    const hasAPI = typeof window !== 'undefined' && 'BarcodeDetector' in window
    setHasBarcodeDetector(hasAPI)

    let barcodeDetector: any = null

    async function startScanner() {
      try {
        // Prüfe erst ob Kamera-Berechtigung möglich ist
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Kamera wird von diesem Browser nicht unterstützt. Bitte gib den Barcode manuell ein.')
          return
        }

        // Kamera starten mit verschiedenen Fallback-Optionen
        let stream: MediaStream | null = null

        // Erst versuchen mit facingMode: environment (Rückkamera)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            },
            audio: false
          })
        } catch {
          // Fallback: Irgendeine Kamera
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            })
          } catch (fallbackErr: any) {
            if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
              setPermissionDenied(true)
              setError('Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen.')
            } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
              setError('Keine Kamera gefunden.')
            } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
              setError('Kamera wird bereits von einer anderen App verwendet.')
            } else {
              setError(`Kamera-Fehler: ${fallbackErr.message || 'Unbekannter Fehler'}`)
            }
            return
          }
        }

        if (!stream) {
          setError('Konnte keine Kamera starten.')
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream

          // Warte auf Video-Metadaten
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('Video element not found'))
              return
            }

            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
                .then(() => resolve())
                .catch(reject)
            }

            videoRef.current.onerror = () => reject(new Error('Video error'))

            // Timeout nach 5 Sekunden
            setTimeout(() => reject(new Error('Video timeout')), 5000)
          })
        }

        // BarcodeDetector starten wenn verfügbar
        if (hasAPI && scanning) {
          try {
            barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf']
            })

            const scan = async () => {
              if (!scanning || !videoRef.current || !barcodeDetector) return

              try {
                const barcodes = await barcodeDetector.detect(videoRef.current)
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue
                  if (code) {
                    handleScan(code)
                    return
                  }
                }
              } catch {
                // Scan-Fehler ignorieren
              }

              animationRef.current = requestAnimationFrame(scan)
            }

            // Kurze Verzögerung damit Video bereit ist
            setTimeout(() => {
              if (scanning) scan()
            }, 500)

          } catch (detectorErr) {
            console.warn('BarcodeDetector konnte nicht initialisiert werden:', detectorErr)
          }
        }

      } catch (err: any) {
        console.error('Scanner error:', err)
        setError(`Fehler: ${err.message || 'Unbekannter Fehler'}`)
      }
    }

    startScanner()

    return () => {
      setScanning(false)
      stopStream()
    }
  }, [scanning, handleScan, stopStream])

  const handleManualInput = () => {
    const code = prompt('Barcode manuell eingeben:')
    if (code && code.trim()) {
      handleScan(code.trim())
      onClose()
    }
  }

  const handleClose = () => {
    stopStream()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex items-center justify-between safe-area-top">
        <h2 className="text-white font-semibold">Barcode scannen</h2>
        <button
          onClick={handleClose}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Schließen"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-slate-800/90 text-white p-6 rounded-xl text-center max-w-md">
              <span className="text-4xl mb-4 block">
                {permissionDenied ? '🔒' : '⚠️'}
              </span>
              <p className="mb-4">{error}</p>

              {permissionDenied && (
                <div className="text-sm text-slate-300 mb-4 text-left bg-slate-700/50 rounded-lg p-3">
                  <p className="font-medium mb-2">So erlaubst du den Kamera-Zugriff:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Safari (iOS):</strong> Einstellungen → Safari → Kamera → Erlauben</li>
                    <li><strong>Chrome:</strong> Auf das Schloss-Symbol in der Adressleiste tippen → Kamera → Erlauben</li>
                    <li><strong>Firefox:</strong> Auf das Schloss-Symbol tippen → Berechtigungen → Kamera</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleManualInput}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manuell eingeben
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scan Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-48 relative">
                {/* Ecken */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                {/* Scan Line Animation */}
                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-blue-500 animate-pulse" />
              </div>
            </div>

            {/* Status-Hinweis */}
            <div className="absolute bottom-24 left-0 right-0 text-center px-4">
              {hasBarcodeDetector ? (
                <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                  Halte den Barcode in den Rahmen
                </p>
              ) : (
                <div className="bg-amber-500/90 text-white text-sm px-4 py-2 rounded-lg inline-block">
                  <p className="font-medium">Automatische Erkennung nicht verfügbar</p>
                  <p className="text-xs mt-1">Bitte gib den Barcode manuell ein</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual Input Button */}
      <div className="bg-black/80 p-4 safe-area-bottom">
        <button
          onClick={handleManualInput}
          className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manuell eingeben
        </button>
      </div>
    </div>
  )
}
