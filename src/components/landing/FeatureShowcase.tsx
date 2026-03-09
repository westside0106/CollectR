'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '📦',
    title: 'Sammlung verwalten',
    desc: 'Unbegrenzt Sammlungen, Kategorien, Custom-Attribute und Bilder. Komplett flexibel für jede Leidenschaft.',
    gradient: 'from-blue-500/15 to-indigo-600/15',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/40',
    accentGlow: 'hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]',
  },
  {
    icon: '🤖',
    title: 'KI-Analyse',
    desc: 'Fotografiere ein Item — die KI erkennt es automatisch und füllt alle Felder blitzschnell aus.',
    gradient: 'from-purple-500/15 to-fuchsia-600/15',
    border: 'border-purple-500/20',
    hoverBorder: 'hover:border-purple-400/40',
    accentGlow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]',
  },
  {
    icon: '📈',
    title: 'Live-Preise & Alarme',
    desc: 'Echtzeit-Preise für TCG, Vinyl, Bücher. Setze Preisalarme und verpasse kein Angebot.',
    gradient: 'from-emerald-500/15 to-teal-600/15',
    border: 'border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-400/40',
    accentGlow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]',
  },
  {
    icon: '🔗',
    title: 'Teilen & Kollaborieren',
    desc: 'Teile deine Sammlung mit Freunden. Vergib Viewer- oder Editor-Rollen pro Sammlung.',
    gradient: 'from-amber-500/15 to-orange-600/15',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/40',
    accentGlow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
]

export function FeatureShowcase() {
  return (
    <section className="relative py-32 bg-slate-950 overflow-hidden">
      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] pointer-events-none" />

      {/* Top fade from hero */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            Warum Collectorssphere
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Alles was Sammler<br className="hidden sm:block" /> wirklich brauchen
          </h2>
          <p className="mt-5 text-lg text-white/45 max-w-xl mx-auto leading-relaxed">
            Entwickelt von Sammlern für Sammler — mit den Tools, die du tatsächlich einsetzt.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`group relative p-8 rounded-3xl border ${feature.border} ${feature.hoverBorder} bg-gradient-to-br ${feature.gradient} backdrop-blur-sm transition-all duration-500 ${feature.accentGlow} cursor-default`}
            >
              {/* Icon */}
              <div className="text-4xl mb-5 select-none">{feature.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-white/50 leading-relaxed text-[15px]">{feature.desc}</p>

              {/* Gold hover shimmer */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#d4a038]/6 via-transparent to-transparent transition-opacity duration-500 pointer-events-none" />

              {/* Corner glow dot */}
              <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-[#d4a038]/60 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
