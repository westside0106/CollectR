'use client'

import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return // 7 Tage nicht mehr zeigen
    }

    // iOS Detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // iOS: Nach 3 Sekunden Banner zeigen (with cleanup tracking)
      timerRef.current = setTimeout(() => setShowPrompt(true), 3000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }

    // Android/Desktop: beforeinstallprompt Event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      timerRef.current = setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 text-white z-50 shadow-lg">
      <div className="max-w-xl mx-auto flex items-center gap-4">
        <span className="text-3xl">📦</span>
        <div className="flex-1">
          <p className="font-semibold">CollectR installieren</p>
          {isIOS ? (
            <p className="text-sm text-slate-300">
              Tippe auf <span className="inline-block">⬆️</span> und dann "Zum Home-Bildschirm"
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              Schneller Zugriff direkt vom Homescreen
            </p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Installieren
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-2"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
