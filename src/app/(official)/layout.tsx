import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.official

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Sichere Verwaltung für offizielle Dokumente, Zertifikate, Autogramme & Memorabilia',
  keywords: ['Dokumente', 'Zertifikate', 'Autogramme', 'Memorabilia', 'Archiv', 'Sammlung', 'OCR'],
  openGraph: {
    title: theme.name,
    description: 'Sichere Verwaltung für offizielle Dokumente & Zertifikate',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function OfficialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
