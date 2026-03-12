import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { CTAFooterSection } from '@/components/landing/CTAFooterSection'

export const metadata: Metadata = {
  title: 'Blog & News | Collectorssphere',
  description: 'Tipps, News und Guides rund ums Sammeln — von Vinyl bis Trading Cards.',
}

const posts = [
  {
    category: 'Collecting Tips',
    title: 'Collectors Guide: Hot Wheels verstehen',
    excerpt: 'Was unterscheidet eine Treasure Hunt von einer Super Treasure Hunt? Und warum sind bestimmte Casting-Jahre so begehrt? Ein Einsteiger-Guide für echte Sammler.',
    date: 'Bald verfügbar',
  },
  {
    category: 'Platform News',
    title: 'Neue Features: KI-Scan & Live-Preise',
    excerpt: 'Der neue KI-basierte Barcode-Scanner erkennt jetzt über 500.000 Artikel automatisch — vom Pokémon-Booster bis zur Vinyl-LP. Plus: Live-Preise direkt aus dem Markt.',
    date: 'Bald verfügbar',
  },
  {
    category: 'Community',
    title: 'Warum Vinyl wieder boomt',
    excerpt: 'Schallplatten erleben seit Jahren ein Revival — aber warum eigentlich? Wir haben mit Sammlern aus der Community gesprochen und nachgefragt, was Vinyl so besonders macht.',
    date: 'Bald verfügbar',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LandingNavbar />

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4a038]/30 bg-[#d4a038]/10 text-[#d4a038] text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a038] animate-pulse" />
            Coming Soon
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            Blog & News
          </h1>
          <p className="text-lg text-white/50">
            Tipps, Guides und News für leidenschaftliche Sammler. Bald mit neuen Artikeln.
          </p>
        </div>
      </section>

      {/* Article Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group relative flex flex-col bg-slate-900/60 border border-white/8 rounded-2xl p-6 hover:border-[#d4a038]/30 transition-all duration-300 hover:bg-slate-900/80"
            >
              <span className="inline-block px-2.5 py-1 rounded-lg bg-[#d4a038]/15 text-[#d4a038] text-xs font-semibold uppercase tracking-wider mb-4 self-start">
                {post.category}
              </span>
              <h2 className="text-base font-bold text-white mb-3 leading-snug group-hover:text-[#d4a038] transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-white/45 leading-relaxed flex-1">
                {post.excerpt}
              </p>
              <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between">
                <span className="text-xs text-white/30">{post.date}</span>
                <span className="text-xs text-[#d4a038]/60 font-medium">In Kürze →</span>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center mt-12 text-sm text-white/25">
          Möchtest du über neue Artikel informiert werden?{' '}
          <Link href="/register" className="text-[#d4a038]/70 hover:text-[#d4a038] transition-colors underline underline-offset-4">
            Jetzt kostenlos registrieren
          </Link>
        </p>
      </section>

      <CTAFooterSection />
    </div>
  )
}
