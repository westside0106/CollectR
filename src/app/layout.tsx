import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { InstallPrompt } from '@/components/InstallPrompt'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/Toast'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CollectR - Deine Sammlungen',
  description: 'Verwalte deine Sammlungen – Hot Wheels, Möbel, Antiquitäten und mehr',
  manifest: '/manifest.json',

  icons: {
    icon: [
      { url: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CollectR',
    startupImage: [
      // iPhone SE, 8, 7, 6s, 6
      {
        url: '/splash/splash-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)'
      },
      // iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
      {
        url: '/splash/splash-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone X, XS, 11 Pro, 12 Mini, 13 Mini
      {
        url: '/splash/splash-1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone XR, 11
      {
        url: '/splash/splash-828x1792.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)'
      },
      // iPhone XS Max, 11 Pro Max
      {
        url: '/splash/splash-1242x2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone 12, 12 Pro, 13, 13 Pro, 14
      {
        url: '/splash/splash-1170x2532.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
      {
        url: '/splash/splash-1284x2778.png',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone 14 Pro
      {
        url: '/splash/splash-1179x2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPhone 14 Pro Max, 15 Plus, 15 Pro Max
      {
        url: '/splash/splash-1290x2796.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)'
      },
      // iPad Mini, Air
      {
        url: '/splash/splash-1536x2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)'
      },
      // iPad Pro 11"
      {
        url: '/splash/splash-1668x2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)'
      },
      // iPad Pro 12.9"
      {
        url: '/splash/splash-2048x2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'
      }
    ]
  },

  formatDetection: {
    telephone: false
  },

  openGraph: {
    type: 'website',
    siteName: 'CollectR',
    title: 'CollectR - Deine Sammlungen',
    description: 'Verwalte deine Sammlungen – Hot Wheels, Möbel, Antiquitäten und mehr',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'CollectR - Deine Sammlungen',
    description: 'Verwalte deine Sammlungen – Hot Wheels, Möbel, Antiquitäten und mehr'
  }
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Theme initialization - prevents flash of unstyled content */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} bg-slate-100 dark:bg-slate-900 transition-colors`}>
        <ThemeProvider>
          <ToastProvider>
            <ServiceWorkerRegistration />
            <div className="flex min-h-screen min-h-[100dvh]">
              <Sidebar />
              <main className="flex-1 overflow-auto pt-14 lg:pt-0">
                {children}
              </main>
            </div>
            <InstallPrompt />
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}