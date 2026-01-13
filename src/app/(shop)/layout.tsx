import { Metadata } from 'next'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

const theme = SPHERE_THEMES.shop

export const metadata: Metadata = {
  title: {
    template: `%s | ${theme.name}`,
    default: theme.name
  },
  description: 'Deine All-in-One Plattform für Sammler-Commerce & Marktplatz-Integration - eBay, Shopify, Cardmarket',
  keywords: ['Shop', 'Verkaufen', 'Marktplatz', 'eBay', 'Shopify', 'Cardmarket', 'Inventar', 'Commerce'],
  openGraph: {
    title: theme.name,
    description: 'Deine All-in-One Plattform für Sammler-Commerce',
    type: 'website',
  },
  icons: {
    icon: '/brand/collectr-hero.png'
  }
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
