import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.hub

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Deine universelle Sammlungsplattform - Verwalte alle deine Sammlungen an einem Ort',
  keywords: ['Sammlung', 'Collection', 'Manager', 'Inventar', 'Katalog', 'Universal'],
  openGraph: {
    title: theme.name,
    description: 'Deine universelle Sammlungsplattform',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
