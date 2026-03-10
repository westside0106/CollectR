'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const screens = [
  { icon: '📊', label: 'Dashboard', desc: 'Alle Sammlungen im Überblick' },
  { icon: '📦', label: 'Sammlungen', desc: 'Items verwalten & filtern' },
  { icon: '🏷️', label: 'Item-Detail', desc: 'Preisverlauf & Infos' },
  { icon: '🤖', label: 'KI-Analyse', desc: 'Automatisch erkennen' },
]

const bullets = [
  'Dashboard mit allen Sammlungen auf einen Blick',
  'Item-Detailansicht mit Preisverlauf',
  'KI erkennt Items automatisch per Foto',
  'Offline-fähig als PWA auf iOS & Android',
]

export function AppDemoSection() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setActive(prev => (prev + 1) % screens.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [paused, next])

  return (
    <section className="relative py-20 sm:py-32 bg-slate-950 overflow-hidden">
      {/* Ambient center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#d4a038]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
              App-Vorschau
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
              So sieht dein<br />Sammel&#8209;HQ aus
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-10">
              Übersichtlich, schnell, schön. Collectorssphere läuft als installierbare PWA —
              direkt auf deinem Homescreen, auch offline.
            </p>

            {/* Bullets */}
            <ul className="space-y-4">
              {bullets.map(text => (
                <li key={text} className="flex items-start gap-3.5 text-white/65 text-[15px] leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#d4a038]/15 border border-[#d4a038]/35 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-[#d4a038]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: iPhone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Phone wrapper */}
            <div className="relative w-64 sm:w-72">
              {/* Ambient glow behind phone */}
              <div className="absolute inset-[-10%] bg-[#d4a038]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Phone frame */}
              <div className="relative rounded-[2.8rem] border-[7px] border-slate-700/80 shadow-[0_30px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] bg-slate-900 overflow-hidden aspect-[9/19.5]">

                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-slate-950 rounded-2xl z-20" />

                {/* Screen Content */}
                <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {/* Fake status bar */}
                      <div className="h-12 bg-slate-950 flex items-end justify-between px-5 pb-2 flex-shrink-0">
                        <span className="text-[10px] text-white/40 font-medium">9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 border border-white/30 rounded-[2px] relative">
                            <div className="absolute inset-[1px] right-[3px] bg-white/40 rounded-[1px]" />
                            <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-white/30 rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* Screen Body */}
                      <div
                        className="flex-1 flex flex-col items-center justify-center p-6"
                        style={{
                          background: `linear-gradient(160deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.8) 100%)`,
                        }}
                      >
                        {/* App icon area */}
                        <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-xl"
                          style={{
                            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                            border: '1px solid rgba(212,160,56,0.2)',
                            boxShadow: '0 8px 32px rgba(212,160,56,0.15)',
                          }}
                        >
                          {screens[active].icon}
                        </div>

                        {/* Screen title */}
                        <div
                          className="text-lg font-bold mb-1"
                          style={{
                            background: 'linear-gradient(135deg, #f5d98e, #d4a038)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {screens[active].label}
                        </div>
                        <div className="text-xs text-white/35 text-center">{screens[active].desc}</div>

                        {/* Decorative elements */}
                        <div className="mt-8 w-full space-y-2">
                          {[65, 45, 80, 35].map((w, j) => (
                            <div key={j} className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${w}%`,
                                  background: j === 0
                                    ? 'linear-gradient(90deg, #d4a038, #f5d98e)'
                                    : 'rgba(255,255,255,0.08)',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom nav bar */}
                      <div className="h-14 bg-slate-950/90 border-t border-white/5 flex items-center justify-around px-4 flex-shrink-0">
                        {['📊', '📦', '🔍', '👤'].map((icon, j) => (
                          <div
                            key={j}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm transition-all ${
                              j === active % 4
                                ? 'bg-[#d4a038]/15 scale-110'
                                : ''
                            }`}
                          >
                            {icon}
                          </div>
                        ))}
                      </div>

                      {/* Home indicator */}
                      <div className="h-6 bg-slate-950 flex items-center justify-center flex-shrink-0">
                        <div className="w-24 h-1 rounded-full bg-white/15" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center gap-2 mt-7">
              {screens.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === active
                      ? 'w-6 h-2 bg-[#d4a038] shadow-[0_0_8px_rgba(212,160,56,0.6)]'
                      : 'w-2 h-2 bg-white/15 hover:bg-white/35'
                  }`}
                  aria-label={s.label}
                />
              ))}
            </div>

            <p className="mt-5 text-xs text-white/25 text-center">
              Installierbar als PWA — auch offline auf deinem Homescreen
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
