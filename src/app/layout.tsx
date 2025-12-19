import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { InstallPrompt } from '@/components/InstallPrompt'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CollectR - Deine Sammlungen',
  description: 'Verwalte deine Sammlungen - Hot Wheels, Möbel, Antiquitäten und mehr',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CollectR',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'CollectR',
    title: 'CollectR - Deine Sammlungen',
    description: 'Verwalte deine Sammlungen - Hot Wheels, Möbel, Antiquitäten und mehr',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-slate-100`}>
        <ServiceWorkerRegistration />
        <div className="flex min-h-screen min-h-[100dvh]">
          <Sidebar />
          <main className="flex-1 overflow-auto pt-14 lg:pt-0">
            {children}
          </main>
        </div>
        <InstallPrompt />
      </body>
    </html>
  )
}
