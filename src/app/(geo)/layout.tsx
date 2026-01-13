import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.geo

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Die ultimative Plattform für Geologie & Archäologie Sammler - Mineralien, Fossilien, Kristalle, Meteoriten',
  keywords: ['Geologie', 'Archäologie', 'Mineralien', 'Fossilien', 'Kristalle', 'Meteoriten', 'Artefakte', 'Sammlung'],
  openGraph: {
    title: theme.name,
    description: 'Die ultimative Plattform für Geologie & Archäologie Sammler',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function GeoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
