'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function CTAFooterSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Gold ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#d4a038]/7 rounded-full blur-[120px] pointer-events-none" />

      {/* Main CTA block */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-6 block">
            Kostenlos · Keine Kreditkarte · Sofort loslegen
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Bereit, deine<br />Sammlung zu ordnen?
          </h2>

          <p className="text-xl text-white/45 mb-12 leading-relaxed">
            Alles kostenlos. Keine Kreditkarte. In 30 Sekunden startklar.
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 rounded-2xl transition-colors duration-200 shadow-[0_0_50px_rgba(212,160,56,0.45)] hover:shadow-[0_0_70px_rgba(212,160,56,0.65)]"
            >
              Jetzt kostenlos registrieren
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-10 text-white/25 text-xs">
            {['Kein Spam', 'Keine Kreditkarte', 'Jederzeit kündbar'].map((badge, i) => (
              <span key={badge} className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-[#d4a038]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-white/5 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © 2026 Collectorssphere. Mit ♥ für Sammler gemacht.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/25">
            {[
              { label: 'Impressum', href: '/impressum' },
              { label: 'Datenschutz', href: '/datenschutz' },
              { label: 'Kontakt', href: '/kontakt' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-white/50 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
