import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.gaming

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Die ultimative Plattform für Video Game Sammler - PlayStation, Xbox, Nintendo, PC & Retro Gaming',
  keywords: ['Gaming', 'Video Games', 'PlayStation', 'Xbox', 'Nintendo', 'PC Gaming', 'Retro', 'Sammlung'],
  openGraph: {
    title: theme.name,
    description: 'Die ultimative Plattform für Video Game Sammler',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function GamingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
