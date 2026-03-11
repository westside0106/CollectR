'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: 'Kostenlos',
    priceSub: 'für immer',
    highlight: false,
    cta: 'Jetzt starten',
    ctaHref: '/register',
    features: [
      { text: 'Bis zu 3 Sammlungen', included: true },
      { text: 'Unbegrenzte Items pro Sammlung', included: true },
      { text: 'KI-Erkennung (10× pro Monat)', included: true },
      { text: 'Live-Preise (TCG, Vinyl, Bücher)', included: true },
      { text: 'PWA — installierbar & offline', included: true },
      { text: 'Dashboard & Gesamtwert', included: true },
      { text: 'Preisalarme', included: false },
      { text: 'Export (CSV / PDF)', included: false },
      { text: 'Unbegrenzte Sammlungen', included: false },
      { text: 'Teilen mit Editor-Rollen', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '€4,99',
    priceSub: 'pro Monat',
    highlight: true,
    badge: 'Bald verfügbar',
    cta: 'Frühzugang sichern',
    ctaHref: '/register',
    features: [
      { text: 'Unbegrenzte Sammlungen', included: true },
      { text: 'Unbegrenzte Items pro Sammlung', included: true },
      { text: 'KI-Erkennung (unbegrenzt)', included: true },
      { text: 'Live-Preise (alle Kategorien)', included: true },
      { text: 'PWA — installierbar & offline', included: true },
      { text: 'Dashboard & Gesamtwert', included: true },
      { text: 'Preisalarme', included: true },
      { text: 'Export (CSV / PDF)', included: true },
      { text: 'Preisverlauf-Charts', included: true },
      { text: 'Teilen mit Editor-Rollen', included: true },
    ],
  },
]

function CheckIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg className="w-4 h-4 text-[#d4a038] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function PricingSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#d4a038]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            Preise
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Einfach. Transparent.
          </h2>
          <p className="mt-4 text-white/45 text-base sm:text-lg max-w-md mx-auto">
            Starte kostenlos — upgrade wenn du bereit bist.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex flex-col p-7 rounded-3xl border transition-all duration-300 ${
                plan.highlight
                  ? 'border-[#d4a038]/50 bg-gradient-to-br from-[#d4a038]/10 to-amber-900/10 shadow-[0_0_60px_rgba(212,160,56,0.15)]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d4a038] text-slate-950 text-xs font-bold tracking-wide whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-6">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
                  {plan.name}
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm mb-1.5">{plan.priceSub}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <CheckIcon included={f.included} />
                    <span className={`text-sm leading-snug ${f.included ? 'text-white/70' : 'text-white/25'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  plan.highlight
                    ? 'bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 shadow-[0_0_24px_rgba(212,160,56,0.4)] hover:shadow-[0_0_40px_rgba(212,160,56,0.6)]'
                    : 'border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-8 text-white/25 text-xs"
        >
          Keine Kreditkarte · Kein Abo · Jederzeit kündbar
        </motion.p>
      </div>
    </section>
  )
}
