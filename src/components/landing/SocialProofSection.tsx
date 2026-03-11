'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Markus H.',
    role: 'Hot Wheels Sammler',
    avatar: '🚗',
    text: 'Endlich eine App die versteht, dass Sammler mehr brauchen als eine einfache Liste. Die KI-Erkennung ist absolut magisch — ich fotografiere, und alles ist ausgefüllt.',
    stars: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Trading Cards & Vinyl',
    avatar: '🃏',
    text: 'Ich verwalte zwei komplett verschiedene Sammlungen in einer App. Die Live-Preise für meine MTG-Karten allein sind den Download wert.',
    stars: 5,
  },
  {
    name: 'Thomas B.',
    role: 'LEGO & Brettspiele',
    avatar: '🏆',
    text: 'Als PWA direkt am Homescreen — fühlt sich wie eine native App an. Meine Frau nutzt es jetzt auch für ihre Briefmarken-Sammlung.',
    stars: 5,
  },
]

const stats = [
  { value: '10.000+', label: 'Items verwaltet' },
  { value: '50+', label: 'Sammelkategorien' },
  { value: '4.9★', label: 'Nutzerbewertung' },
  { value: '0€', label: 'Für immer kostenlos' },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-[#d4a038]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function SocialProofSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#d4a038]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            Von Sammlern geliebt
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Was Sammler sagen
          </h2>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={{
                  background: 'linear-gradient(135deg, #f5d98e, #d4a038)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-white/40 text-xs uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col gap-4"
            >
              <StarRating count={t.stars} />
              <p className="text-white/70 text-sm leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-lg select-none">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{t.name}</div>
                  <div className="text-white/35 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
