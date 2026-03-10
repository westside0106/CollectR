'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

// Kein SSR – WebGL braucht Browser-Kontext
const Dither = dynamic(() => import('@/components/Dither'), { ssr: false })

/**
 * Globaler Pixel-Scan Hintergrund für alle Seiten (Desktop + Mobile).
 * Eingebunden im Root Layout – kein Import nötig in Einzelseiten.
 * Auf der Landing Page ausgeblendet (nutzt eigene Gold-Dither-Instanz).
 */
export function GlobalDitherBackground() {
  const pathname = usePathname()

  // Landing Page hat eigenen Gold-Dither im HeroSection
  if (pathname === '/') return null

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none opacity-20 dark:opacity-25"
      aria-hidden="true"
    >
      <Dither
        waveColor={[0.3, 0.4, 0.6]}
        colorNum={4}
        waveAmplitude={0.3}
        waveFrequency={3}
        waveSpeed={0.05}
        enableMouseInteraction={false}
        mouseRadius={0.3}
        disableAnimation={false}
        pixelSize={2}
      />
    </div>
  )
}
