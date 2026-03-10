'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Aurora } from '@/components/Aurora'
import { Starfield } from '@/components/landing/Starfield'
import { NumberTicker } from '@/components/landing/NumberTicker'

// ---- Animation helpers ----
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

// ---- Data ----
const spheres = [
  { name: 'Hot Wheels', icon: '🏎️', desc: 'Diecast & Modellautos', color: 'from-red-500/20 to-orange-500/20 border-red-500/15 hover:border-red-500/30 hover:shadow-red-500/5' },
  { name: 'Trading Cards', icon: '🃏', desc: 'Pokémon, Yu-Gi-Oh! & mehr', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/15 hover:border-blue-500/30 hover:shadow-blue-500/5' },
  { name: 'Vinyl', icon: '💿', desc: 'Schallplatten & Raritäten', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/15 hover:border-emerald-500/30 hover:shadow-emerald-500/5' },
  { name: 'Gaming', icon: '🎮', desc: 'Retro Games & Konsolen', color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/15 hover:border-violet-500/30 hover:shadow-violet-500/5' },
  { name: 'Geologie', icon: '💎', desc: 'Mineralien & Edelsteine', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/15 hover:border-amber-500/30 hover:shadow-amber-500/5' },
  { name: 'Und mehr...', icon: '✨', desc: 'Erstelle eigene Sphären', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/15 hover:border-pink-500/30 hover:shadow-pink-500/5' },
]

const stats = [
  { value: 500, suffix: '+', label: 'Sammler' },
  { value: 12000, suffix: '+', label: 'Items erfasst' },
  { value: 150, suffix: 'k€', label: 'Sammlungswert' },
  { value: 6, suffix: '', label: 'Sphären' },
]

// ================================================================
//  SECTIONS
// ================================================================

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Glass bar that's always visible */}
      <div className="bg-[#030014]/60 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-96.png"
              alt="CollectR"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              Collect<span className="text-indigo-400">R</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] transition-all"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-4 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <Starfield />
        <Aurora
          colorStops={['#4338ca', '#6d28d9', '#312e81', '#1e1b4b', '#030014']}
          amplitude={0.15}
          blend={0.1}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,transparent_0%,#030014_75%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center pt-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-6 sm:space-y-8"
        >
          {/* Beta badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Jetzt in der Beta
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-[2.75rem] leading-[1] sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
          >
            Deine Sammlung.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Dein Universum.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/40 max-w-lg mx-auto leading-relaxed"
          >
            Organisiere, bewerte und teile deine Schätze —
            alles an einem Ort.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10">Kostenlos starten</span>
              <svg className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {/* Shimmer */}
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/40 hover:text-white/70 transition-colors sm:hidden"
            >
              Bereits registriert? Anmelden
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  )
}

function SpheresSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-4">
      {/* Subtle separator glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center mb-14 sm:mb-16"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-indigo-400 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-4"
          >
            Sphären
          </motion.p>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
          >
            Eine App. Jede{' '}
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              Leidenschaft.
            </span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {spheres.map((sphere, i) => (
            <motion.div
              key={sphere.name}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`group relative p-5 sm:p-7 rounded-2xl bg-gradient-to-br ${sphere.color} border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default`}
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110">
                {sphere.icon}
              </div>
              <h3 className="font-display font-semibold text-white text-sm sm:text-base mb-1">
                {sphere.name}
              </h3>
              <p className="text-white/35 text-xs sm:text-sm leading-relaxed">
                {sphere.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center mb-14 sm:mb-16"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-indigo-400 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-4"
          >
            Features
          </motion.p>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
          >
            Alles{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              im Griff.
            </span>
          </motion.h2>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-6 gap-4"
        >
          {/* Dashboard — large card, spans 4 cols */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="md:col-span-4 group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">Dashboard</h3>
              <p className="text-white/35 text-sm leading-relaxed max-w-sm">
                Alles auf einen Blick. Werte, Trends und deine neuesten Schätze — übersichtlich und live.
              </p>
            </div>
            {/* Mock dashboard tiles */}
            <div className="mt-6 grid grid-cols-4 gap-2 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
              <div className="col-span-2 h-20 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-white/[0.04]" />
              <div className="h-20 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-white/[0.04]" />
              <div className="h-20 rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-white/[0.04]" />
              <div className="h-14 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-white/[0.04]" />
              <div className="col-span-2 h-14 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-white/[0.04]" />
              <div className="h-14 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-white/[0.04]" />
            </div>
          </motion.div>

          {/* Value tracking — spans 2 cols */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">Wert-Tracking</h3>
            <p className="text-white/35 text-sm leading-relaxed">
              Kaufpreis, Marktwert, Gewinn — für jedes Stück.
            </p>
            {/* Mini chart */}
            <div className="mt-6 flex items-end gap-1 h-20 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
              {[35, 50, 30, 55, 40, 65, 45, 75, 55, 85, 65, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-500/40 to-emerald-500/10"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Multi-Sphere — spans 2 cols */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">Multi-Sphere</h3>
            <p className="text-white/35 text-sm leading-relaxed">
              Hot Wheels heute, Vinyl morgen. Eine App für alles.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
              {['🏎️', '🃏', '💿', '🎮', '💎', '🏺'].map((icon, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.04] flex items-center justify-center text-lg">
                  {icon}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mobile / PWA — spans 2 cols */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">Mobile First</h3>
            <p className="text-white/35 text-sm leading-relaxed">
              Installierbar als PWA. Deine Sammlung immer dabei — auch offline.
            </p>
          </motion.div>

          {/* Community — spans 2 cols */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">Community</h3>
            <p className="text-white/35 text-sm leading-relaxed">
              Teile Sammlungen und entdecke andere Sammler.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-24 sm:py-32 px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/15 to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight tabular-nums">
                {isInView && (
                  <NumberTicker
                    value={stat.value}
                    suffix={stat.suffix}
                    delay={0.3 + i * 0.12}
                  />
                )}
              </div>
              <p className="text-white/30 text-sm mt-2 tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-28 sm:py-36 px-4">
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={stagger}
        className="relative max-w-2xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6"
        >
          Bereit für dein{' '}
          <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Sammler-Universum?
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/40 text-base sm:text-lg mb-10"
        >
          Kostenlos starten. Keine Kreditkarte nötig.
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-white text-[#030014] font-semibold text-base sm:text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5"
          >
            Jetzt starten
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative py-10 sm:py-12 px-4 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-96.png"
            alt="CollectR"
            width={20}
            height={20}
            className="rounded-md opacity-50"
          />
          <span className="text-white/25 text-sm">
            CollectR &copy; {new Date().getFullYear()}
          </span>
        </div>
        <p className="text-white/15 text-sm">
          Made with &#9825; for Sammler
        </p>
      </div>
    </footer>
  )
}

// ================================================================
//  MAIN
// ================================================================

export default function LandingPage() {
  return (
    <div className="bg-[#030014] text-white min-h-[100dvh] overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <SpheresSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
