'use client'

import { useEffect, useRef, useState } from 'react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let animationId: number
    let barcodeDetector: any

    async function startScanner() {
      try {
        // Kamera starten
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        
        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // BarcodeDetector API (Chrome/Edge) oder Fallback
        if ('BarcodeDetector' in window) {
          barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
          })
          
          const scan = async () => {
            if (!scanning || !videoRef.current || !barcodeDetector) return
            
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue
                setScanning(false)
                onScan(code)
                stopStream()
                return
              }
            } catch (e) {
              // Ignore scan errors
            }
            
            animationId = requestAnimationFrame(scan)
          }
          
          scan()
        } else {
          setError('Barcode-Scanner wird von diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.')
        }
        
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.')
        } else if (err.name === 'NotFoundError') {
          setError('Keine Kamera gefunden.')
        } else {
          setError(`Fehler: ${err.message}`)
        }
      }
    }

    function stopStream() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }

    startScanner()

    return () => {
      setScanning(false)
      cancelAnimationFrame(animationId)
      stopStream()
    }
  }, [onScan, scanning])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex items-center justify-between">
        <h2 className="text-white font-semibold">Barcode scannen</h2>
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-white/10 rounded-lg"
        >
          ✕
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-red-500/20 text-red-200 p-6 rounded-xl text-center max-w-md">
              <span className="text-4xl mb-4 block">⚠️</span>
              <p>{error}</p>
              <button
                onClick={onClose}
                className="mt-4 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30"
              >
                Schließen
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
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
            
            {/* Hinweis */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-white/80 text-sm">
                Halte den Barcode in den Rahmen
              </p>
            </div>
          </>
        )}
      </div>

      {/* Manual Input */}
      <div className="bg-black/80 p-4">
        <button
          onClick={() => {
            const code = prompt('Barcode manuell eingeben:')
            if (code) {
              onScan(code)
              onClose()
            }
          }}
          className="w-full py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          ⌨️ Manuell eingeben
        </button>
      </div>
    </div>
  )
}
