'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Dither = dynamic(() => import('@/components/Dither'), { ssr: false })

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const stats = [
  { value: '10.000+', label: 'Items verwaltet' },
  { value: '50+', label: 'Sammelgebiete' },
  { value: '100%', label: 'Kostenlos' },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Gold Dither Background */}
      <div className="absolute inset-0 z-0 opacity-55">
        <Dither
          waveColor={[0.83, 0.63, 0.22]}
          colorNum={6}
          waveAmplitude={0.5}
          waveFrequency={2}
          waveSpeed={0.03}
          pixelSize={3}
          enableMouseInteraction={true}
          mouseRadius={0.4}
        />
      </div>

      {/* Layered dark overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/65 via-slate-950/35 to-slate-950/75" />

      {/* Radial glow center */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,rgba(15,23,42,0.6)_100%)]" />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-28 pb-14 sm:pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Eyebrow badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4a038]/30 bg-[#d4a038]/10 text-[#d4a038] text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a038] animate-pulse" />
            Für echte Sammler
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-tight leading-[0.93] mb-6"
        >
          <span className="block text-white">Deine Sammlung.</span>
          <span
            className="block mt-2"
            style={{
              background: 'linear-gradient(135deg, #f5d98e 0%, #d4a038 45%, #b8892a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Dein Überblick.
          </span>
        </motion.h1>

        {/* Subline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-xl text-white/55 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
        >
          Hot Wheels, Pokémon-Karten, Vinyl — alles an einem Ort.
          <br className="hidden sm:block" />
          Mit KI-Analyse, Live-Preisen und Teilen-Funktion.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-16"
        >
          <Link
            href="/register"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-[#d4a038] hover:bg-[#e8b84a] text-slate-950 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(212,160,56,0.45)] hover:shadow-[0_0_55px_rgba(212,160,56,0.65)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Kostenlos starten
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white/75 hover:text-white border border-white/20 hover:border-white/40 rounded-2xl transition-all duration-300 hover:bg-white/5 backdrop-blur-sm"
          >
            Bereits Mitglied? Anmelden
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-6 max-w-sm mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={{
                  background: 'linear-gradient(135deg, #f5d98e, #d4a038)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <span className="text-[10px] text-white/25 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <svg className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
