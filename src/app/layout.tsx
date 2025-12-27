import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
    apple: [
      {
        url: '/apple-touch-icon.v2.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CollectR'
  },

  formatDetection: {
    telephone: false
  },

  openGraph: {
    type: 'website',
    siteName: 'CollectR',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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