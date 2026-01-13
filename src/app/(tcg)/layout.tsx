import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.tcg

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Die ultimative Plattform für Trading Card Game Sammler - Pokémon, Yu-Gi-Oh!, Magic: The Gathering',
  keywords: ['TCG', 'Trading Cards', 'Pokémon', 'Yu-Gi-Oh!', 'Magic', 'Sammlungen', 'Preise', 'Deck Builder'],
  openGraph: {
    title: theme.name,
    description: 'Die ultimative Plattform für Trading Card Game Sammler',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function TCGLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
