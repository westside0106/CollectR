'use client'

import { motion } from 'framer-motion'

const collections = [
  { emoji: '🚗', label: 'Diecast / Hot Wheels', wide: true },
  { emoji: '💿', label: 'Vinyl' },
  { emoji: '📷', label: 'Kameras' },
  { emoji: '📮', label: 'Briefmarken' },
  { emoji: '🃏', label: 'Trading Cards' },
  { emoji: '🏆', label: 'LEGO' },
]

export function CollectionTypesGrid() {
  return (
    <section className="relative py-20 sm:py-32 bg-slate-900 overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.06] pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#d4a038]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            50+ Kategorien
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Was sammelst du?
          </h2>
          <p className="mt-5 text-white/45 text-lg max-w-md mx-auto">
            Von Hot Wheels bis Briefmarken — Collectorssphere passt sich deiner Leidenschaft an.
          </p>
          <p className="mt-4 text-white/20 text-xs tracking-wide">
            + Münzen · Sneakers · Gaming · Bücher · Uhren · Spielzeug · Wein · und vieles mehr
          </p>
        </motion.div>

        {/* Tile grid — auto-flow with some wide tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 auto-rows-auto">
          {collections.map((col, i) => (
            <motion.div
              key={col.label}
              initial={{ opacity: 0, scale: 0.82, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.45,
                delay: i * 0.04,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={col.wide ? 'col-span-2' : ''}
            >
              <div className="group relative p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.09] hover:border-[#d4a038]/35 transition-all duration-300 hover:shadow-[0_0_28px_rgba(212,160,56,0.12)] text-center cursor-default overflow-hidden h-full">
                {/* Emoji */}
                <div className="text-3xl mb-2.5 select-none group-hover:scale-110 transition-transform duration-300">
                  {col.emoji}
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors duration-200">
                  {col.label}
                </div>

                {/* Gold shimmer on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#d4a038]/8 to-transparent transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* "And more" hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-8 text-white/25 text-sm"
        >
          + alles andere, was dir am Herzen liegt
        </motion.p>
      </div>
    </section>
  )
}
