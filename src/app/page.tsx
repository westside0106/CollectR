import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { CollectionTypesGrid } from '@/components/landing/CollectionTypesGrid'
import { SocialProofSection } from '@/components/landing/SocialProofSection'
import { AppDemoSection } from '@/components/landing/AppDemoSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { CTAFooterSection } from '@/components/landing/CTAFooterSection'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Collectorssphere — Deine Sammlung, dein Überblick',
  description:
    'Verwalte Hot Wheels, TCG-Karten, Vinyl, Bücher und mehr — mit KI-Analyse, Live-Preisen und Teilen-Funktion. Kostenlos und sofort startklar.',
  openGraph: {
    title: 'Collectorssphere — Deine Sammlung, dein Überblick',
    description:
      'Hot Wheels, Pokémon-Karten, Vinyl — alles an einem Ort. Mit KI-Analyse und Live-Preisen.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-white overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <HowItWorksSection />
      <FeatureShowcase />
      <CollectionTypesGrid />
      <SocialProofSection />
      <AppDemoSection />
      <PricingSection />
      <FAQSection />
      <CTAFooterSection />
    </div>
  )
}
