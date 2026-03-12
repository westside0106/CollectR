import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { CTAFooterSection } from '@/components/landing/CTAFooterSection'
import { SPHERE_THEMES } from '@/lib/themes/sphere-themes'

export const metadata: Metadata = {
  title: 'Spheres | Collectorssphere',
  description: 'Spezialisierte Werkzeuge für jede Sammelkategorie — von TCG bis Geologie.',
}

const spheres = [
  {
    ...SPHERE_THEMES.tcg,
    href: '/tcg',
    tagline: 'Pokémon, Yu-Gi-Oh!, Magic',
    detail: 'Live-Preisabfragen, Deck Builder, Grading & Barcode-Scanner für alle großen TCG-Spiele.',
  },
  {
    ...SPHERE_THEMES.gaming,
    href: '/gaming',
    tagline: 'PlayStation, Xbox, Nintendo, PC & Retro',
    detail: 'Spiele-Sammlung über alle Plattformen verwalten, Preise tracken und Wunschliste pflegen.',
  },
  {
    ...SPHERE_THEMES.official,
    href: '/official',
    tagline: 'Urkunden, Verträge, Ausweise',
    detail: 'Dokumente sicher verwalten mit OCR-Suche, Ablaufmeldungen und verschlüsseltem Vault.',
  },
  {
    ...SPHERE_THEMES.geo,
    href: '/geo',
    tagline: 'Mineralien, Fossilien, Kristalle',
    detail: 'Fundorte per GPS tracken, Labordaten speichern und wissenschaftlich klassifizieren.',
  },
  {
    ...SPHERE_THEMES.shop,
    href: '/shop',
    tagline: 'Verkaufen auf eBay, Etsy & Vinted',
    detail: 'Inventar verwalten, Preise kalkulieren und Listings automatisch auf mehreren Plattformen stellen.',
  },
  {
    ...SPHERE_THEMES.hub,
    href: '/hub',
    tagline: 'Zentrale Schaltstelle',
    detail: 'Der HUB verbindet alle Spheres und gibt dir einen vollständigen Überblick deiner gesamten Sammlung.',
  },
]

export default function SpheresPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4a038]/30 bg-[#d4a038]/10 text-[#d4a038] text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a038]" />
            6 Spezialisierte Bereiche
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            Die Spheres
          </h1>
          <p className="text-lg text-white/50">
            Spezialisierte Werkzeuge für jede Sammelkategorie — maßgeschneidert statt generisch.
          </p>
        </div>
      </section>

      {/* Sphere Cards */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {spheres.map((sphere) => (
            <Link
              key={sphere.id}
              href={sphere.href}
              className="group relative flex flex-col bg-slate-900/60 border border-white/8 rounded-2xl p-6 hover:border-[#d4a038]/30 transition-all duration-300 hover:bg-slate-900/80"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{sphere.emoji}</span>
                <div>
                  <p className="text-[11px] text-white/35 uppercase tracking-wider">{sphere.tagline}</p>
                  <h2 className="text-base font-bold text-white group-hover:text-[#d4a038] transition-colors">
                    {sphere.displayName}
                  </h2>
                </div>
              </div>
              <p className="text-sm text-white/45 leading-relaxed flex-1">
                {sphere.detail}
              </p>
              <div className="mt-5 flex items-center gap-1 text-xs text-[#d4a038]/60 group-hover:text-[#d4a038] transition-colors font-medium">
                Mehr entdecken
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon banner */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center px-6 py-5 rounded-2xl border border-[#d4a038]/20 bg-[#d4a038]/5">
          <p className="text-sm text-white/45">
            Detaillierte Sphere-Seiten mit Funktionsübersichten folgen bald.{' '}
            <Link href="/register" className="text-[#d4a038]/70 hover:text-[#d4a038] transition-colors underline underline-offset-4">
              Registriere dich jetzt kostenlos
            </Link>{' '}
            und erhalte Early-Access zu neuen Features.
          </p>
        </div>
      </section>

      <CTAFooterSection />
    </div>
  )
}
