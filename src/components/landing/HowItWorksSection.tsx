'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '🆓',
    title: 'Kostenlos registrieren',
    desc: 'Kein Abo, keine Kreditkarte. Einfach E-Mail eingeben und sofort loslegen.',
    color: 'from-blue-500/15 to-cyan-500/15',
    border: 'border-blue-500/20',
    glow: 'rgba(59,130,246,0.15)',
  },
  {
    number: '02',
    icon: '📷',
    title: 'Item fotografieren',
    desc: 'Foto machen — die KI erkennt dein Item automatisch und füllt alle Felder aus.',
    color: 'from-purple-500/15 to-fuchsia-500/15',
    border: 'border-purple-500/20',
    glow: 'rgba(168,85,247,0.15)',
  },
  {
    number: '03',
    icon: '📊',
    title: 'Überblick genießen',
    desc: 'Live-Preise, Gesamtwert, Teilen-Funktion — deine Sammlung immer im Griff.',
    color: 'from-[#d4a038]/15 to-amber-600/15',
    border: 'border-[#d4a038]/25',
    glow: 'rgba(212,160,56,0.15)',
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 sm:mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#d4a038] mb-4 block">
            In 3 Schritten
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            So einfach geht's
          </h2>
          <p className="mt-4 text-white/45 text-base sm:text-lg max-w-md mx-auto">
            Vom ersten Item bis zum vollständigen Überblick — in unter 5 Minuten.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative p-6 sm:p-8 rounded-2xl border ${step.border} bg-gradient-to-br ${step.color} backdrop-blur-sm`}
              style={{ boxShadow: `0 0 40px ${step.glow}` }}
            >
              {/* Step number */}
              <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-4">
                Schritt {step.number}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 select-none">{step.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{step.title}</h3>

              {/* Desc */}
              <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
